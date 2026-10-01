# Finance Tracker Repository Audit

Date: 2026-10-01
Scope: Entire repository, with emphasis on the Express, TypeScript, MongoDB/Mongoose backend and its web-client contracts.
Method: Static code review, request-path tracing, dependency audit, and repository type/error checks. No source changes were made as part of this audit.

## Executive Summary

The repository has a small and understandable structure, strict TypeScript settings, centralized validation intent, and a sensible separation between API, database models, validation, and shared constants. The main risks are in authorization boundaries, token lifecycle design, denormalized metric consistency, and missing operational controls.

The highest-priority defect is an object-level authorization failure: authenticated users can update or delete any transaction if they know its MongoDB ID. This is a direct cross-account data integrity vulnerability. Refresh tokens are also stored as reusable plaintext JWTs, are not rotated on refresh, and have no logout/revocation path. The metric cache is maintained by asynchronous model hooks without a transaction or reconciliation strategy, so balances and summaries can drift under concurrent or partially failed writes.

### Priority summary

| Priority | Finding                                                                                       | Severity                                    |
| -------- | --------------------------------------------------------------------------------------------- | ------------------------------------------- |
| P0       | Transaction update/delete do not constrain the query by authenticated user                    | High / exploitable IDOR                     |
| P0       | Refresh tokens are reusable, stored in plaintext, and cannot be revoked by logout             | High                                        |
| P0       | Denormalized metrics are not updated atomically with transactions                             | High data-integrity risk                    |
| P1       | Authentication lacks rate limiting, account-enumeration resistance, and credential policy     | High abuse risk                             |
| P1       | Request validation and MongoDB error normalization are incomplete                             | Medium to high reliability/security risk    |
| P1       | Currency updates bypass update validators                                                     | Medium data-integrity risk                  |
| P1       | Timezone semantics are UTC-only while the UI collects local dates/times                       | Medium user-visible financial accuracy risk |
| P1       | Production dependency audit reports three high and one moderate vulnerability                 | High operational risk until remediated      |
| P2       | Unbounded reads, missing indexes, and no resource/query controls                              | Medium availability/performance risk        |
| P2       | API lifecycle, observability, and deployment hardening are incomplete                         | Medium operational risk                     |
| P2       | API contracts, types, and organization need service-layer boundaries and consistent semantics | Medium maintainability risk                 |

## Findings

### F-01: Cross-user transaction modification and deletion

Severity: High
Priority: P0
Category: Authorization / IDOR

Evidence: [transaction.controller.ts](../../apps/api/src/controllers/transaction.controller.ts), [transaction.route.ts](../../apps/api/src/routes/transaction.route.ts)

`updateTransactions` uses `Transaction.findByIdAndUpdate(_id, ...)`, and `deleteTransaction` uses `Transaction.findByIdAndDelete(_id)`. Neither query includes `user: req.user._id`. Authentication proves only that the caller has a valid account; it does not prove ownership of the supplied transaction ID.

Why this matters: any authenticated user who obtains or guesses another transaction ID can change its amount/date or delete it. The update hooks also adjust the affected transaction's metric documents, so this can corrupt another user's dashboard as well as their transaction data.

Recommended fix:

- Query by both `_id` and `user`, for example `{ _id: transactionId, user: userId }`.
- Return `404` for both missing and non-owned records to avoid an ownership oracle.
- Put ownership-scoped repository methods behind a service boundary so individual controllers cannot omit the tenant predicate.
- Add tests proving user A cannot read, update, or delete user B's transaction.

### F-02: Refresh token lifecycle is not safely designed

Severity: High
Priority: P0
Category: Authentication / session management

Evidence: [user.ts](../../packages/db/src/models/user.ts), [auth.controller.ts](../../apps/api/src/controllers/auth.controller.ts), [verifyJwt.middleware.ts](../../apps/api/src/middlewares/verifyJwt.middleware.ts), [AuthContextProvider.tsx](../../apps/web/src/AuthContextProvider.tsx)

`generateRefreshToken` stores the complete signed JWT in the user document. Refresh compares the incoming cookie with that raw value, but `refreshHandler` issues only a new access token; it does not rotate the refresh token. The web client has no logout request, and the API has no logout/revocation endpoint. A stolen refresh token remains usable until expiry or until a new login overwrites the single stored token. A database read or backup exposure also gives an immediately usable refresh credential.

Additional design limitation: one refresh token per user means a login on one device invalidates the previous device, while there is no session/device record to support selective revocation or incident response.

Recommended fix:

- Store a cryptographic hash of a random opaque refresh token, not the raw JWT. Store token ID, user ID, expiry, created/last-used timestamps, and revoked/replaced metadata in a session collection.
- Rotate the refresh token on every successful refresh using an atomic compare-and-swap operation. Detect reuse of a replaced token and revoke the session family.
- Add logout/revoke-current-session and revoke-all-sessions operations that clear the cookie and persist revocation.
- Validate JWT algorithm, issuer, audience, required subject/ID claims, and key presence explicitly.
- Use a separate session model so multiple devices and incident response are possible.

### F-03: Denormalized metrics are not transactionally consistent

Severity: High
Priority: P0
Category: Data integrity / concurrency

Evidence: [transaction.ts](../../packages/db/src/models/transaction.ts), [metrics.ts](../../packages/db/src/models/metrics.ts), [metrics.controller.ts](../../apps/api/src/controllers/metrics.controller.ts)

Transaction create/update/delete operations and their metric updates are separate MongoDB operations driven by asynchronous Mongoose middleware. There is no MongoDB session/transaction covering the source transaction and the corresponding metric changes. Concurrent edits can use stale pre-update snapshots, one operation can succeed while its metric update fails, and a process crash can leave the cache permanently wrong. `Metric` is also used as the source for total balance, so a stale cache changes a core financial result.

The `calculateMetricForMonth` fallback repairs a missing month but is not a general reconciliation mechanism. Concurrent upserts can also race around the unique `{ user, month }` index.

Recommended fix:

- Prefer calculating balances and summaries from transactions, with indexes and bounded queries, until measured performance requires materialization.
- If materialized metrics remain, update transaction and metric documents in one MongoDB transaction/session, or use an explicit outbox/event worker with idempotent rebuilds.
- Add a reconciliation command/job that recomputes every month and detects drift.
- Define behavior for failed metric updates and surface operational alerts rather than returning success with stale financial data.
- Add concurrency and failure-injection tests for create, update across months, and delete.

### F-04: Authentication is vulnerable to brute force and user enumeration

Severity: High
Priority: P1
Category: Authentication abuse

Evidence: [auth.controller.ts](../../apps/api/src/controllers/auth.controller.ts), [auth.route.ts](../../apps/api/src/routes/auth.route.ts), [server.ts](../../apps/api/src/server.ts)

Login returns `404 NOT_FOUND` when the account does not exist and `401 INVALID_PASSWORD` when it does. This lets an attacker distinguish valid usernames/emails. There is no rate limit, progressive delay, lockout policy, or monitoring on login/register/refresh endpoints. Password validation only requires six characters and there is no normalization of email or username.

Recommended fix:

- Return one generic authentication failure for unknown users and bad passwords, with consistent timing where practical.
- Add IP and account-keyed rate limiting, failure counters, alerts, and a bounded lockout/backoff policy.
- Normalize email and username at validation/storage boundaries and define case-sensitivity rules.
- Raise the password policy and consider breached-password screening, while retaining bcrypt with a reviewed cost factor.
- Add audit events for login success, failure, refresh reuse, logout, and password changes.

### F-05: Access-token extraction is overly permissive and claims are not validated

Severity: Medium
Priority: P1
Category: Authentication boundary

Evidence: [verifyJwt.middleware.ts](../../apps/api/src/middlewares/verifyJwt.middleware.ts), [user.ts](../../packages/db/src/models/user.ts), [express.d.ts](../../apps/api/src/types/express.d.ts)

The access middleware accepts a token from the request body, the Authorization header, or a cookie. The header is split without checking the `Bearer` scheme. Accepting credentials in request bodies increases accidental logging and creates multiple authentication paths to secure. `jwt.verify` checks signature and expiry but the application does not enforce issuer, audience, algorithm, or required claim shape. The TypeScript payload says `_id` is a string, while Mongoose user IDs are normally ObjectIds.

Recommended fix:

- Accept access tokens only from a validated `Authorization: Bearer <token>` header, or use one deliberate cookie-based model with CSRF protection.
- Remove body-token support and do not keep an access token in an auth cookie unless the entire CSRF model is designed for it.
- Configure explicit JWT algorithms, issuer, audience, and required claims; validate decoded claims with a schema.
- Use a canonical `userId: string` claim and convert/validate it at the boundary.

### F-06: Input validation is incomplete and error reporting is inconsistent

Severity: Medium
Priority: P1
Category: Validation / error handling

Evidence: [validator.ts](../../apps/api/src/validators/validator.ts), [auth.ts](../../packages/validation/src/auth.ts), [transaction.ts](../../packages/validation/src/transaction.ts), [error.middleware.ts](../../apps/api/src/middlewares/error.middleware.ts)

Only selected routes use Zod validation. Delete and currency update bodies are manually checked, and update validation does not validate that the ID is a MongoDB ObjectId. Invalid IDs therefore reach Mongoose and become unhandled `CastError` responses. Mongoose validation errors, document-not-found cases, and many database errors also fall through to a generic `500`.

For Zod errors, the middleware stores `issue.message` in a field named `code`, then looks that message up in `ERROR_MESSAGES`. Default Zod messages such as invalid number/date/type messages are not keys in the shared error map, so clients can receive `undefined` validation messages. The error middleware logs unknown errors without request correlation or structured redaction.

Recommended fix:

- Validate every body, path parameter, and query parameter at the route boundary, including ObjectId syntax, currency enum, and non-empty update payloads.
- Use a stable validation error code plus the Zod issue path/message as separate fields; never map arbitrary prose as an enum key.
- Normalize `CastError`, `ValidationError`, duplicate keys, timeout, and transient database failures to deliberate status/code pairs.
- Return generic internal messages to clients and log structured errors with request ID, route, user ID where safe, and redaction.

### F-07: Currency update bypasses schema validators

Severity: Medium
Priority: P1
Category: Data integrity

Evidence: [transaction.controller.ts](../../apps/api/src/controllers/transaction.controller.ts), [user.ts](../../packages/db/src/models/user.ts), [transactions/index.ts](../../packages/shared/src/enums/transactions/index.ts)

`updateCurrency` checks only truthiness and calls `findByIdAndUpdate` without `runValidators: true`. Mongoose update validators are not enabled by default, so values outside `USD`, `EUR`, `GBP`, and `INR` can be persisted even though the schema declares an enum. The route is also located under the transaction router, which obscures its ownership and API contract.

Recommended fix:

- Validate currency with the shared Zod enum and use `{ runValidators: true, new: true }` on the update.
- Move the endpoint to a user/profile/settings route and return `404` if the authenticated user no longer exists.
- Add a test for each supported currency and an invalid value.

### F-08: Timezone semantics can misstate a user's financial day and month

Severity: Medium
Priority: P1
Category: Date/time correctness

Evidence: [metrics.controller.ts](../../apps/api/src/controllers/metrics.controller.ts), [transaction.controller.ts](../../apps/api/src/controllers/transaction.controller.ts), [TransactionForm.tsx](../../apps/web/src/components/transactions/TransactionForm.tsx), [Dashboard.tsx](../../apps/web/src/pages/Dashboard.tsx)

The UI collects local date/time and serializes an instant with `toISOString()`. The API then groups and filters all activity by UTC calendar boundaries. A user in a non-UTC timezone can create a transaction on one local day and see it counted on another UTC day or month. The user model stores currency but no timezone, and date-only dashboard ranges are interpreted as UTC.

Recommended fix:

- Decide whether the product is instant-based or user-local-calendar-based and document that contract.
- For local financial reporting, store a user IANA timezone and use it in MongoDB aggregation (`$dateToString`, `$dateDiff`) and range construction.
- Keep instants in UTC for storage, but translate local date boundaries to UTC before querying.
- Add tests around DST transitions, month boundaries, and users in positive/negative UTC offsets.

### F-09: Transaction listing is unbounded and under-indexed

Severity: Medium
Priority: P2
Category: Availability / performance

Evidence: [transaction.controller.ts](../../apps/api/src/controllers/transaction.controller.ts), [transaction.ts](../../packages/db/src/models/transaction.ts), [server.ts](../../apps/api/src/server.ts)

`getTransactions` returns every transaction for a user with no pagination, maximum page size, date filter, or projection. The transaction schema has no `{ user: 1, date: -1 }` index, despite the exact ownership-and-date sort used by the endpoint. Large accounts can cause high memory use, slow responses, and expensive client rendering.

Recommended fix:

- Add cursor pagination with a bounded limit and a stable `(date, _id)` sort.
- Add the compound user/date index and review explain plans for list and metrics queries.
- Support server-side date filtering and field projection.
- Add request-level timeouts and maximum query windows for reporting endpoints.

### F-10: API semantics are inconsistent and success can hide missing resources

Severity: Medium
Priority: P2
Category: API design

Evidence: [transaction.controller.ts](../../apps/api/src/controllers/transaction.controller.ts), [api-response.ts](../../apps/api/src/utils/api-response.ts)

Transaction IDs are sent in request bodies instead of resource paths, a partial update is called `PUT`, update of a missing transaction returns `200` with `null`, and delete uses `400` for a missing record while other not-found cases use `404`. Response messages contain spelling variants and the response envelope exposes status code both in HTTP and JSON without a documented contract.

Recommended fix:

- Use resource-oriented routes such as `PATCH /transactions/:id` and `DELETE /transactions/:id`.
- Make all resource lookups ownership-scoped and return consistent `404` behavior.
- Define a versioned API contract, consistent envelope/error schema, and OpenAPI or equivalent generated documentation.
- Return only the fields needed by clients and use typed DTOs rather than raw Mongoose documents.

### F-11: Startup and runtime hardening are incomplete

Severity: Medium
Priority: P2
Category: Operations / security

Evidence: [index.ts](../../apps/api/src/index.ts), [server.ts](../../apps/api/src/server.ts), [auth.controller.ts](../../apps/api/src/controllers/auth.controller.ts), [.env.example](../../apps/api/.env.example)

The application uses non-null assertions for secrets and starts only after MongoDB connects, but the connection failure handler only logs the error; it does not fail the process decisively or expose health/readiness endpoints. `PORT` is not validated. There is no graceful shutdown, connection event handling, request ID, security-header middleware, rate limiter, or explicit production HTTPS/proxy policy. CORS is configured from one environment value with no startup validation or allowlist parsing.

Recommended fix:

- Validate configuration at startup with a schema, including strong secret length, allowed origins, port, cookie settings, and MongoDB TLS requirements.
- Fail fast with a non-zero exit on startup failure, and implement graceful SIGTERM shutdown.
- Add liveness/readiness endpoints and structured logging/metrics.
- Add security headers, strict CORS allowlisting, rate limits, and explicit reverse-proxy/HTTPS configuration.
- Set cookie `maxAge` and JWT expiry from one configuration source and clear cookies on logout.

### F-12: Production dependency vulnerabilities require remediation

Severity: High
Priority: P1
Category: Supply chain

Evidence: `npm audit --omit=dev --json` run during this audit; dependency declarations are in [package-lock.json](../../package-lock.json) and workspace package manifests.

The production audit reported four total vulnerabilities: three high and one moderate. Affected transitive packages were `brace-expansion`, `fast-uri`, `undici`, and `ip-address`; the report indicated fixes are available. The exact exploitability depends on which consuming code paths are present, but vulnerable production dependency trees should not be accepted without a documented exception.

Recommended fix:

- Run the package manager's non-breaking fix/update path, inspect the resulting lockfile, then rerun the audit.
- Identify the parent package for each transitive dependency and upgrade that parent where necessary.
- Build and exercise the API after the lockfile change; do not blindly force major upgrades.
- Add dependency auditing to CI and pin/monitor lockfile changes.

## Additional Architectural Observations

### Persistence model

- User password hashing is correctly placed in a `pre("save")` hook for normal document saves, but future update-based password changes would bypass it unless explicitly protected. A dedicated credential service should own password changes.
- The user schema has unique indexes for username/email but no normalization strategy, so `User@example.com` and `user@example.com` can be separate accounts depending on MongoDB collation and application behavior.
- Financial amounts use JavaScript/MongoDB `Number`. Repeated arithmetic can produce floating-point artifacts. Use integer minor units or Decimal128 with a documented currency scale.
- Transaction documents do not record a currency snapshot, description, category, or source. This may become a data-model constraint if users can change their display currency later.
- Metric documents correctly have a unique user/month index, but the transaction collection lacks the ownership/date index needed by its dominant access path.

### TypeScript and organization

- The backend has controllers doing authentication, persistence, authorization, date policy, and response shaping in the same functions. Introduce route schemas, services, repositories, and DTOs gradually, starting with an ownership-scoped transaction service.
- `IUser._id` is typed as `string` while model operations use ObjectIds. Define model document types separately from API DTOs and avoid returning raw Mongoose documents.
- The `Transaction` model is not declared with the `ITransaction` generic, weakening type safety around returned documents and middleware.
- `req.user` is optional throughout authenticated controllers. After authentication middleware, use a typed authenticated request or an assertion helper so missing identity cannot silently become a query with `undefined`.
- The shared `ERROR_CODES` list includes capabilities such as rate limiting and forbidden access that are not currently wired into consistent behavior.

### Testing and delivery

- There is no backend unit, integration, API contract, or end-to-end test framework, and no CI workflow was found. This is especially risky for authorization and metric hooks, which require database-backed tests.
- The minimum initial suite should cover authentication, refresh rotation/reuse, cross-user transaction access, invalid IDs, validation response shape, metric updates, concurrent writes, and timezone boundaries.
- Add CI stages for typecheck, lint, tests with a disposable MongoDB, dependency audit, and migration/index verification.

## Prioritized Remediation Plan

### Phase 0: Contain exploitable risk

1. Fix ownership predicates for transaction update/delete and add regression tests before further feature work.
2. Disable body-token authentication and enforce a strict Bearer header parser.
3. Add rate limiting and generic login failures; temporarily monitor and alert on repeated failures.
4. Rotate JWT signing secrets if any real secret has been exposed or committed, and validate required environment configuration at startup.
5. Remediate the four production dependency findings and record the resulting lockfile/audit result.

### Phase 1: Correct session and data integrity

1. Replace the single raw refresh-token field with hashed, server-side sessions.
2. Implement rotation, reuse detection, logout, revoke-current, and revoke-all behavior.
3. Choose a source-of-truth strategy for metrics. Prefer transaction-derived queries initially; otherwise add MongoDB transactions plus idempotent rebuild/reconciliation.
4. Add currency Zod validation and `runValidators: true` to all update operations.
5. Normalize MongoDB cast, validation, duplicate, and transient errors into stable API errors.

### Phase 2: Establish correct contracts and scale limits

1. Define API DTOs and a versioned resource-oriented contract.
2. Add cursor pagination, bounded reporting windows, server-side filters, projections, and the user/date transaction index.
3. Decide timezone semantics, store the user timezone, and test DST/month boundary behavior.
4. Adopt integer minor units or Decimal128 for money.
5. Move business logic from controllers/model hooks into testable services and repositories.

### Phase 3: Production readiness

1. Add structured logs, request IDs, health/readiness endpoints, graceful shutdown, and database observability.
2. Add security headers, strict CORS configuration, HTTPS/proxy policy, and secret/config validation.
3. Add CI for typecheck, lint, integration tests, dependency audit, and lockfile review.
4. Add OpenAPI documentation and contract checks between the API and web client.

## Verification Baseline

- Editor/repository error scan: no current TypeScript errors were reported for the backend and shared packages.
- `npm audit --omit=dev --json`: 4 production vulnerabilities reported, consisting of 3 high and 1 moderate, all marked fixable by the audit output.
- Worktree status at audit start: pre-existing untracked `.archify/` directory; it was not modified.
- No source files, package manifests, lockfiles, or configuration files were modified by this audit. The only new artifact is this report.
