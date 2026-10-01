# Mongoose Schema and Database Access Review

Date: 2026-10-01
Scope: All Mongoose schemas, database access patterns, indexes, aggregations, pagination, references, validation, and transaction boundaries in the repository.
Method: Static review of the current schema definitions and every discovered Mongoose query site. Recommendations are explained below; no schema, index, query, or application files were modified.

## Executive Summary

The database model is small and the existing metric index is directionally correct. `Metric` has a unique `{ user: 1, month: 1 }` index that supports exact month lookups and the user-prefix scan used for total balance. The main missing production index is on `Transaction`: the application repeatedly filters by `user`, sorts by `date`, and aggregates by a user/date range, but the collection defines no index for that access path.

The highest-risk database issue is not an index. Transaction writes and denormalized metric updates are separate operations triggered by asynchronous Mongoose hooks. A transaction can be committed while its metric update fails, and concurrent edits can leave the cached balance or weekly summaries incorrect. The current API also returns an unbounded transaction collection, permits some update validation to be bypassed, and has no repository/service boundary that guarantees owner-scoped queries.

## Current Data Model

### User

Evidence: [user.ts](../../packages/db/src/models/user.ts)

Fields:

- `username`: required string, unique index requested by Mongoose.
- `email`: required string, unique index requested by Mongoose.
- `currency`: string enum with a default of `USD`.
- `password`: required string containing a bcrypt hash after normal document save.
- `refreshToken`: optional in the schema, but required in the TypeScript interface; stores one complete refresh JWT.

Observed access patterns:

- Insert with `User.create` during registration.
- Lookup by either `{ email }` or `{ username }` during login.
- Lookup by `_id` during refresh.
- Update by `_id` during currency changes.
- Save the entire user document when generating a refresh token.

### Transaction

Evidence: [transaction.ts](../../packages/db/src/models/transaction.ts)

Fields:

- `user`: required ObjectId reference to `User`.
- `amount`: required Number.
- `type`: required enum, `credit` or `debit`.
- `date`: required Date.
- `createdAt` and `updatedAt`: timestamps.

Observed access patterns:

- Insert by authenticated user.
- List by `user`, sorted by `date` descending.
- Update or delete by `_id` in the controller; current mutation queries are not owner-scoped.
- Aggregate by `user` and a `date` range for metrics.
- Re-read the pre-update transaction in middleware, then update the metric cache.

### Metric

Evidence: [metrics.ts](../../packages/db/src/models/metrics.ts)

Fields:

- `user`: required ObjectId, but not declared as a `ref: "User"`.
- `month`: required Date representing a UTC month start.
- `income`, `expense`, and `netCashFlow`: required Number totals.
- `weeklySummary`: embedded weekly totals with `_id: false`.

Observed access patterns:

- Exact lookup by `{ user, month }`.
- Upsert by `{ user, month }` after transaction writes.
- Aggregate all metric documents for a user to calculate total balance.

## Findings and Recommendations

### DB-01: Missing transaction ownership/date index

Severity: High
Priority: P0
Category: Query efficiency / availability

Evidence: [transaction.controller.ts](../../apps/api/src/controllers/transaction.controller.ts), [metrics.controller.ts](../../apps/api/src/controllers/metrics.controller.ts), [transaction.ts](../../packages/db/src/models/transaction.ts)

The dominant transaction query is:

```ts
Transaction.find({ user: userId }).sort({ date: -1 })
```

The metrics aggregation begins with:

```ts
{
  $match: {
    user: userId,
    date: { $gte: startDate, $lt: endDate },
  },
}
```

There is no transaction index. MongoDB must scan the collection, filter records, and sort or group the result. This becomes a direct availability problem as one user's history or the total collection grows.

Recommendation:

```ts
TransactionSchema.index({ user: 1, date: -1 })
```

Why this index: `user` is the equality prefix used by every list and metric query, and `date` is the sort/range field. The same compound index supports the list sort and narrows the aggregation's `$match` before grouping. Do not add separate `{ user: 1 }` and `{ date: 1 }` indexes first; they duplicate work and are less useful for the actual compound access path.

Validation before rollout: run `explain("executionStats")` for the list query and representative 7-day, 30-day, and 1-year metric queries before and after the index. Confirm the winning plan uses the compound index and that `totalKeysExamined` and `totalDocsExamined` are bounded by the user's date range.

### DB-02: Metric index is correct but should be treated as a required invariant

Severity: Medium
Priority: P1
Category: Uniqueness / query correctness

Evidence: [metrics.ts](../../packages/db/src/models/metrics.ts), [transaction.ts](../../packages/db/src/models/transaction.ts), [metrics.controller.ts](../../apps/api/src/controllers/metrics.controller.ts)

`MetricSchema.index({ user: 1, month: 1 }, { unique: true })` is the correct index for:

- `Metric.findOne({ user, month })` exact cached-month lookups.
- `Metric.findOneAndUpdate({ user, month }, ..., { upsert: true })` metric maintenance.
- `Metric.aggregate([{ $match: { user } }, ...])` because `user` is the index prefix.

The unique constraint is essential: without it, concurrent cache rebuilds or update races could create duplicate month documents and inflate total balance. However, index creation is asynchronous in many deployment setups, and the code has no startup migration/index verification step.

Recommendation:

- Keep this unique compound index.
- Verify it exists in every deployed database as part of deployment readiness.
- Handle duplicate-key races during cache rebuild with retry/re-read logic.
- Consider making the month representation explicit and canonical, such as a UTC month-start invariant or a `YYYY-MM` key. A string month key can avoid accidental time components, but changing it requires a migration and contract review.

The existing index should not be replaced with `{ month: 1, user: 1 }`: the current query shape starts with `user`, and total balance needs the user prefix.

### DB-03: User uniqueness is incomplete for normalized identity semantics

Severity: Medium
Priority: P1
Category: Uniqueness / account integrity

Evidence: [user.ts](../../packages/db/src/models/user.ts), [auth.controller.ts](../../apps/api/src/controllers/auth.controller.ts)

`unique: true` creates unique indexes, but it does not trim values, normalize email case, or define a collation. Registration stores the input directly, and login queries it directly. Depending on MongoDB collation and input, values such as `User@example.com`, `user@example.com`, or values with surrounding whitespace may become separate identities or produce inconsistent login behavior.

Recommendation:

- Define normalization rules in the validation/service layer: trim usernames, trim and lowercase emails, and explicitly decide username case sensitivity.
- Enforce the normalized representation with unique indexes. For case-insensitive identity requirements, use a normalized field or a unique index with an explicit collation rather than relying on application behavior.
- Perform a duplicate/normalization migration before changing index semantics; existing conflicting records must be resolved first.
- Retain duplicate-key handling as the final concurrency guard because a pre-check followed by insert is race-prone.

### DB-04: Schema validation is weaker than API validation and can be bypassed

Severity: High
Priority: P1
Category: Data integrity

Evidence: [transaction.ts](../../packages/db/src/models/transaction.ts), [transaction.controller.ts](../../apps/api/src/controllers/transaction.controller.ts), [validation/transaction.ts](../../packages/validation/src/transaction.ts), [user.ts](../../packages/db/src/models/user.ts)

The API validates transaction amount positivity and date format with Zod, but the Mongoose schema does not define `min`, finite-number, or date validity constraints. The update controller uses `findByIdAndUpdate` without `runValidators: true`, so schema-level update validation would not run anyway. Currency updates likewise bypass the schema enum through an update operation without validators.

This creates two problems:

- Any future write path, migration, admin script, or direct model consumer can persist invalid financial data.
- The API's validation rules are not a durable persistence invariant.

Recommendation:

- Add schema-level constraints that express database invariants: finite positive amount, valid date, required owner, and enum type.
- Use `{ runValidators: true, context: "query" }` for update operations where Mongoose validators are relied upon.
- Keep Zod validation for request shape and client-facing error quality; do not treat it as a replacement for persistence validation.
- Add tests that write through `create`, `findOneAndUpdate`, and any future bulk path.

Money-specific note: Number arithmetic is vulnerable to floating-point representation errors. Prefer integer minor units for currencies with a fixed scale or Decimal128 with explicit conversion rules. This is a data-model migration, so it should be designed before production financial data accumulates.

### DB-05: Transaction writes and metric writes are not atomic

Severity: Critical
Priority: P0
Category: Transaction boundary / consistency

Evidence: [transaction.ts](../../packages/db/src/models/transaction.ts)

`post("save")`, `post("findOneAndUpdate")`, and `post("findOneAndDelete")` call `updateMetric` in a separate database operation. The source transaction and metric document are not written under one MongoDB session/transaction. The API can therefore observe these states:

1. Transaction write succeeds and metric update fails.
2. Metric decrement succeeds but increment for a moved/updated transaction fails.
3. Concurrent updates read the same old transaction and each apply a decrement/increment sequence based on stale state.
4. A process crash occurs after the transaction write and before the metric write.

Because total balance is read from `Metric`, this is not merely a cache freshness issue. It can return an incorrect financial balance.

Recommendation options, in preferred order:

1. Use transactions as the source of truth and calculate metrics on demand with the new `{ user, date }` index. This removes a consistency class at the cost of aggregation work.
2. If materialized metrics are required, pass a MongoDB session through the transaction write and metric update and commit both in one transaction. Ensure the deployment uses a replica set or sharded cluster that supports transactions.
3. Alternatively, use an outbox/event model with idempotent metric rebuilds and a reconciliation job. This provides eventual consistency but makes that state explicit.

Do not rely on post hooks alone as a transaction boundary. Add failure-injection and concurrent-update tests before treating the cache as authoritative.

### DB-06: Mongoose hooks are incomplete for alternate write paths

Severity: High
Priority: P1
Category: Consistency / lifecycle hooks

Evidence: [transaction.ts](../../packages/db/src/models/transaction.ts)

Metric maintenance is attached only to `save`, `findOneAndUpdate`, and `findOneAndDelete`. It does not cover every possible write API, including `updateOne`, `updateMany`, `deleteMany`, `bulkWrite`, and `insertMany` behavior. A future batch import or cleanup script can change transactions without updating metrics. Even within the current code, the model contract is implicit and easy to violate.

The pre-update hook also performs a read of the old document before the update. That read and the update are separate operations, so the old snapshot is not protected from concurrent changes.

Recommendation:

- Centralize transaction mutation in a service that explicitly updates both source and derived data, rather than using hidden model side effects.
- Either prohibit unsupported write methods by convention and lint/review rule, or implement a complete, tested event/rebuild strategy.
- If hooks remain temporarily, document supported operations and add tests for every write method that the application or maintenance tooling may use.

### DB-07: Transaction update/delete queries are both an authorization and index concern

Severity: Critical
Priority: P0
Category: Ownership / query shape

Evidence: [transaction.controller.ts](../../apps/api/src/controllers/transaction.controller.ts)

The current update and delete calls use only `_id`. This is already a cross-user IDOR, as documented in the authentication review. It also prevents a uniform owner-scoped repository pattern.

Recommendation:

```ts
Transaction.findOneAndUpdate(
  { _id: transactionId, user: authenticatedUserId },
  updateFields,
  { new: true, runValidators: true }
)
```

and the equivalent owner-scoped delete query. The `_id` index remains sufficient for this point lookup; adding a special `{ user, _id }` index is unnecessary because MongoDB already indexes `_id` uniquely. If the API moves to path IDs, validate ObjectId syntax before the query and return a uniform not-found response.

### DB-08: Transaction list endpoint is unbounded and lacks pagination

Severity: High
Priority: P1
Category: Query efficiency / resource exhaustion

Evidence: [transaction.controller.ts](../../apps/api/src/controllers/transaction.controller.ts), [Dashboard.tsx](../../apps/web/src/pages/Dashboard.tsx)

`getTransactions` returns all transactions for a user, sorts them in the database, and sends every full document to the client. The dashboard then sorts and slices the result again to five records. This duplicates work, increases response size, and lets a user with a large history consume excessive database, API, and browser resources.

Recommendation:

- Add a bounded `limit` with a server-side maximum.
- Use cursor pagination rather than unrestricted skip/offset for a growing ledger. A stable cursor should include `date` and `_id` to handle equal timestamps.
- Add server-side date filters and a projection containing only list fields.
- Add a dedicated recent-transactions query for the dashboard, such as a bounded first page, rather than returning the entire history.
- The `{ user: 1, date: -1 }` index is required for this design.

### DB-09: Metrics aggregation is correctly shaped but needs bounded inputs and explain validation

Severity: Medium
Priority: P1
Category: Aggregation efficiency

Evidence: [metrics.controller.ts](../../apps/api/src/controllers/metrics.controller.ts), [transaction.ts](../../packages/db/src/models/transaction.ts)

The range pipeline places `$match` before `$group`, which is the correct shape for index use. It filters by user and date, then groups by UTC week or month. The complete-month path uses the materialized `Metric` document and the range path reads source transactions. This split is efficient when the cache is correct, but it creates inconsistent source-of-truth behavior.

Risks:

- There is no maximum date range. A user can request a multi-year or arbitrarily broad range, causing a large scan and group operation.
- `getTotalBalance` runs a second aggregate over all metric months for every metrics request, even when the requested range does not need a lifetime total.
- There is no `allowDiskUse`, timeout, or explain-plan regression check.
- UTC grouping may not match the user's financial timezone, as noted in the authentication review.

Recommendation:

- Enforce a maximum reporting window or offer pre-aggregated periods.
- Decide whether total balance is a required response field on every range request. If it is, maintain a separate current-balance field or derive it from the source of truth with a known cost.
- Keep `$match` first and verify the `{ user, date }` index with `explain`.
- Add server-side query timeouts and operational metrics for aggregation duration.
- Make the cache/source-of-truth choice consistent across complete-month and arbitrary-range requests.

### DB-10: No N+1 query exists in the current request paths, but hidden N+1 risk is high

Severity: Low currently, Medium future risk
Priority: P2
Category: Query organization

The review found no `populate`, per-row lookup, or loop containing a database query in the current API. Current metrics work is a small fixed number of queries: one metric lookup or rebuild, one total-balance aggregate, and one range aggregate where applicable.

However, the transaction list returns raw documents and the dashboard maps them client-side. If transaction enrichment, user data, categories, or attachments are later added with per-transaction lookups, the list can become an N+1 endpoint quickly. The absence of a service/repository layer makes that regression easy to introduce.

Recommendation:

- Keep list responses self-contained through deliberate projections or one aggregation with `$lookup` only when justified.
- Do not call `User.findById` or other queries inside a transaction result loop.
- Add query-count assertions to integration tests for list and metrics endpoints.
- Establish a repository convention that accepts a query plan/projection rather than letting controllers compose arbitrary database calls.

### DB-11: References and model typing are inconsistent

Severity: Medium
Priority: P2
Category: Schema correctness / TypeScript safety

Evidence: [transaction.ts](../../packages/db/src/models/transaction.ts), [metrics.ts](../../packages/db/src/models/metrics.ts), [user.ts](../../packages/db/src/models/user.ts)

`Transaction.user` declares `ref: "User"`, but `Metric.user` does not. The application does not currently populate either field, so this is not a current query failure. It does make the relationship less explicit and prevents consistent future population/validation behavior.

The transaction model is created without passing `ITransaction` as the model generic, and the user interface declares `_id` as `string` even though Mongoose uses an ObjectId. These mismatches weaken the compiler's ability to catch incorrect query/update shapes.

Recommendation:

- Add the user reference to `Metric` if the relationship is intended to be navigable; otherwise document that metrics are intentionally denormalized and never populated.
- Type the exported transaction model with a document/model type that reflects Mongoose methods and ObjectId fields.
- Separate persistence document types from API DTOs. Do not use raw Mongoose document types as response contracts.

### DB-12: Schema fields need explicit defaults and lifecycle policy

Severity: Medium
Priority: P2
Category: Data quality

Evidence: [user.ts](../../packages/db/src/models/user.ts), [metrics.ts](../../packages/db/src/models/metrics.ts), [transaction.ts](../../packages/db/src/models/transaction.ts)

The refresh token is optional in the schema but required in `IUser`, while metric numeric fields are required without defaults. A metric upsert pipeline supplies values for a new document, but alternate repair/import paths can fail or produce incomplete documents. Metrics have no timestamps or version field, so diagnosing cache freshness and rebuild history is difficult.

Recommendation:

- Align TypeScript optionality with schema optionality.
- Use explicit defaults for zero-valued metric totals and an empty weekly summary if those are valid initial states.
- Add `updatedAt` or a cache generation/reconciliation marker to materialized metrics.
- Add a documented retention and rebuild policy for metrics and old transactions.

### DB-13: User lookup indexes should be verified rather than assumed

Severity: Medium
Priority: P2
Category: Deployment correctness

Evidence: [user.ts](../../packages/db/src/models/user.ts), [auth.controller.ts](../../apps/api/src/controllers/auth.controller.ts)

Mongoose's `unique: true` is an index declaration, not a validator. It should create unique indexes, but index creation may be disabled, delayed, or misconfigured in production. Login depends on fast and unambiguous lookup by email or username, and registration depends on the uniqueness guarantee under concurrency.

Recommendation:

- Verify the deployed `User` collection has unique indexes for the normalized login keys.
- Treat index creation/migration as a deployment responsibility, not an implicit application startup side effect.
- Keep duplicate-key handling for concurrent registration attempts.
- Do not add a compound `{ email, username }` index: the application queries either field independently, so two separate unique indexes are the correct access paths.

## Index Plan Based on Actual Queries

| Collection  | Recommended index                                   | Why it exists                                                        | Status                                                                      |
| ----------- | --------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| User        | `{ email: 1 }` unique, normalized representation    | Login by email and registration uniqueness                           | Declared indirectly via `unique: true`; verify deployment and normalization |
| User        | `{ username: 1 }` unique, normalized representation | Login by username and registration uniqueness                        | Declared indirectly via `unique: true`; verify deployment and normalization |
| User        | `_id`                                               | Refresh and currency update point lookups                            | Built-in MongoDB index                                                      |
| Transaction | `{ user: 1, date: -1 }`                             | User list sort and user/date metrics range                           | Missing; highest-value new index                                            |
| Transaction | `_id`                                               | Owner-scoped update/delete point lookup                              | Built-in MongoDB index; no extra `{ user, _id }` needed                     |
| Metric      | `{ user: 1, month: 1 }` unique                      | Exact month lookup, upsert identity, user-prefix balance aggregation | Present and required                                                        |

Indexes not recommended at this stage:

- A standalone `Transaction.date` index: all observed queries constrain `user` first; a user/date compound index is more selective and supports the sort/range.
- A standalone `Metric.month` index: observed queries always include `user`; the existing user/month compound index is the correct shape.
- A `Transaction.type` index: type is used inside aggregation expressions after the user/date match, not as a selective top-level filter.
- A `Metric.user` index in addition to `{ user, month }`: the compound index already has `user` as its prefix.

## Transaction and Concurrency Assessment

### Current boundaries

- `User.create` and refresh-token `save` are single-document operations.
- `Transaction.create` writes the transaction, then the post-save hook updates `Metric` separately.
- `findByIdAndUpdate` reads the old transaction in pre-hook middleware, updates the transaction, then decrements/increments metrics in post-hook middleware.
- `findByIdAndDelete` deletes the transaction, then decrements metrics in a post-hook.
- Metric rebuild performs a transaction aggregation followed by a metric upsert, also outside a transaction.

### Consequences

- Source and derived data can diverge after process failure or database errors.
- Concurrent updates can calculate decrements from stale snapshots.
- A transaction moving across month boundaries requires two metric documents, which magnifies partial-failure risk.
- Unique metric upserts can race; one writer may see a duplicate-key error or one update may overwrite another depending on the operation sequence.

### Recommendation

Choose and document one of these models before adding more metric features:

1. Source-of-truth transactions plus indexed on-demand aggregation.
2. MongoDB session transactions for source and materialized writes.
3. Event/outbox-driven materialization with idempotent consumers and periodic reconciliation.

The current hook-based implicit model is not sufficient for financial correctness.

## Pagination and Query Efficiency Plan

1. Add `{ user: 1, date: -1 }` to `Transaction`.
2. Replace the unbounded list with a server-enforced cursor and maximum page size.
3. Use a stable sort on `date` plus `_id` to handle equal timestamps.
4. Project list fields rather than returning full persistence documents.
5. Add bounded date filters to transaction listing and metrics.
6. Remove client-side sorting/slicing for the dashboard's recent list.
7. Add query timeouts and monitor execution time, examined documents, and returned documents.
8. Use `.lean()` for read-only list and lookup queries where document methods are not needed, reducing hydration overhead.

## N+1 and Access-Pattern Conclusion

No current N+1 query was found. The current metrics endpoint uses a fixed number of database operations, and no `populate` calls exist. The main current performance defect is unbounded work rather than N+1 work.

The main future N+1 controls should be query-count tests, repository methods that return complete list DTOs, and a rule against database calls inside result loops. The `{ user, date }` transaction index and bounded pagination are more urgent than speculative indexes for relationships that are not currently populated.

## Prioritized Implementation Plan, After Approval

### P0: Protect correctness and availability

1. Add and verify the `Transaction { user: 1, date: -1 }` index with explain-plan evidence.
2. Make transaction update/delete owner-scoped; this is both a database query correction and an authorization fix.
3. Decide whether metrics are authoritative. Until a transaction boundary exists, consider deriving balances from transactions rather than trusting the cache.
4. Add integration tests for concurrent transaction update/delete and metric failure scenarios.

### P1: Enforce durable data invariants

1. Add schema-level amount/date/type/currency constraints and enable update validators.
2. Normalize user identifiers and verify unique indexes on the deployed database.
3. Replace hook-only metric maintenance with MongoDB transactions or an explicit outbox/reconciliation design.
4. Add bounded pagination, projections, date windows, and query timeouts.

### P2: Improve type and operational durability

1. Align ObjectId and optional field types with Mongoose schemas.
2. Add explicit metric defaults and cache freshness metadata.
3. Add index verification and explain-plan checks to deployment/CI.
4. Add query-count, pagination, and no-cross-user integration tests.

## Verification Checklist

- `Transaction.find({ user }).sort({ date: -1 })` uses `{ user: 1, date: -1 }` and remains bounded with pagination.
- User/date metric aggregation uses the same compound index and does not scan unrelated users.
- Metric exact-month lookup and upsert use the unique `{ user, month }` index.
- Duplicate user identities fail under concurrent registration, including normalized variants.
- Invalid amount, date, type, currency, and ObjectId values fail at both API and persistence boundaries.
- Source transaction and metric updates either commit together or are repaired by an idempotent reconciliation process.
- Bulk or alternate transaction write methods cannot silently bypass metric maintenance.
- Query-count tests show no per-row database lookup in transaction or metric responses.
- Large transaction histories cannot force an unbounded response or client-side sort.
