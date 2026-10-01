# Dashboard Financial Metrics Trace

Date: 2026-10-01
Scope: Transaction persistence, Mongoose metric maintenance, metrics API calculations, dashboard date ranges, React rendering, and boundary-case tests.
Method: Source trace plus integration tests against MongoDB Memory Server and deterministic frontend utility tests. No production metric arithmetic was changed.

## End-to-End Data Flow

### 1. Transaction input and persistence

The transaction form collects a browser-local date and time, creates a local `Date`, then serializes it with `toISOString()`. The API validates an ISO datetime and stores the resulting instant in MongoDB as `Transaction.date`.

Evidence: [TransactionForm.tsx](../../apps/web/src/components/transactions/TransactionForm.tsx), [transaction.ts](../../packages/db/src/models/transaction.ts)

The stored transaction contains:

- `type: "credit"` for income.
- `type: "debit"` for expense.
- Positive `amount`.
- An absolute UTC instant in `date`.
- The authenticated user's ObjectId.

### 2. Metric cache maintenance

Transaction model hooks update one `Metric` document per UTC month:

```text
income      += amount for credit, otherwise 0
expense     += amount for debit, otherwise 0
netCashFlow = income - expense
```

Weekly buckets are calculated as UTC calendar-day groups:

```text
week = floor((UTC day of month - 1) / 7) + 1
```

Thus days 1-7 are Week 1, 8-14 Week 2, 15-21 Week 3, 22-28 Week 4, and 29-31 Week 5.

Evidence: [transaction.ts](../../packages/db/src/models/transaction.ts)

### 3. Metrics API

Evidence: [metrics.controller.ts](../../apps/api/src/controllers/metrics.controller.ts)

For a complete UTC calendar month, the API:

1. Converts query dates to UTC midnight.
2. Reads `Metric` by `{ user, month }`, or rebuilds it from transactions if absent.
3. Reads lifetime `totalBalance` from all of that user's metric documents.
4. Returns the selected month's income, expense, net cash flow, and weekly summary.

For an arbitrary date range, the API:

1. Matches the authenticated user and `date >= startAt`.
2. Uses `date < endDate + one UTC day`, making `endDate` inclusive through 23:59:59.999 UTC.
3. Groups by UTC week for ranges of five weeks or less.
4. Groups by UTC month for ranges longer than five weeks.
5. Sums the returned buckets for range income, expense, and net cash flow.
6. Separately reads lifetime `totalBalance` from `Metric`.

### 4. React dashboard

Evidence: [Dashboard.tsx](../../apps/web/src/pages/Dashboard.tsx), [IncomeExpenseChart.tsx](../../apps/web/src/components/dashboard/IncomeExpenseChart.tsx)

- Metric cards display API `totalBalance`, `income`, `expense`, and `netCashFlow` directly.
- The chart displays API `cashFlowSummary.summary` directly.
- The dashboard calculates `averageExpense` by summing each returned bucket's expense and dividing by the number of buckets.
- Transactions are fetched separately, sorted client-side, and sliced to five rows.
- Category spending and budget snapshot panels still use mock data and are not derived from the API metrics.

## Mathematical Verification

### Total balance

Current implementation:

```text
totalBalance = sum(metric.netCashFlow for every month belonging to the user)
```

This is a lifetime balance, not a selected-range balance. The tests verify that transactions outside the requested range still contribute to `totalBalance` while they do not contribute to range `income`, `expense`, or `netCashFlow`.

This is mathematically correct only if every metric document is synchronized with its transactions. The existing asynchronous Mongoose hooks are not atomic with transaction writes, so a stale metric cache can make total balance wrong even though the aggregation formula itself is correct.

### Income and expense

For each selected transaction:

```text
income  = sum(amount where type == credit)
expense = sum(amount where type == debit)
```

The implementation uses `$cond` expressions in both range aggregation and month rebuild. Tests cover mixed credit/debit values and verify that the two categories do not overlap.

### Net cash flow

```text
netCashFlow = income - expense
```

The range aggregation sums positive credits and negative debits directly. The metric cache derives the same value from accumulated income and expense. Existing and new tests verify equality for positive, negative, and zero results.

### Date filtering

The API applies this half-open UTC interval:

```text
[startDateT00:00:00.000Z, endDate + 1 UTC day)
```

This correctly includes:

- A transaction exactly at the beginning of the start date.
- A transaction at `23:59:59.999Z` on the end date.

It correctly excludes:

- `23:59:59.999Z` on the day before the start date.
- `00:00:00.000Z` on the day after the end date.

## Boundary Test Results

### Backend tests

Evidence: [metrics.test.ts](../../apps/api/tests/metrics.test.ts)

The backend metric suite covers:

- Mixed credits/debits and weekly sums.
- Complete-month cache reads and zero-filled week buckets.
- Cross-user isolation.
- Missing, reversed, and malformed date ranges.
- Exact month start and end instants.
- Midnight at `00:00:00.000Z`.
- End-of-day at `23:59:59.999Z`.
- Offset timestamps that cross UTC month boundaries.
- Inclusive last-30-days range behavior.

The focused metric result is 7 passing tests.

### Frontend tests

Evidence: [dashboard-date-range.test.ts](../../apps/web/tests/dashboard-date-range.test.ts), [dashboard-date-range.ts](../../apps/web/src/lib/dashboard-date-range.ts)

The frontend suite covers:

- This-month range beginning on the UTC first of the month.
- Last 30 days as an inclusive 30-calendar-day window.
- Last-30-days crossing a month boundary.
- Year-to-date beginning on UTC January 1.

The focused frontend result is 4 passing tests.

## Discrepancies and Risks

### D-01: Local entry time versus UTC reporting

Severity: High user-visible correctness risk

The form lets a user choose local calendar date/time, but the API groups and filters by UTC calendar date/month. A transaction entered as local October 1 can be stored as September 30 UTC for a user east of UTC. A transaction entered late on October 31 in a negative offset can be stored as November 1 UTC.

The automated offset test demonstrates this behavior: a local `2026-10-01T00:15:00+05:30` transaction is excluded from the UTC October range, while a local `2026-10-31T23:45:00-07:00` transaction is also excluded because its UTC instant is November 1.

Recommended resolution:

- Decide whether financial reporting is UTC-calendar-based or user-timezone-calendar-based.
- For user-local reporting, persist an IANA timezone on the user and convert local date boundaries to UTC before querying. Use the same timezone in MongoDB grouping.
- Keep instants in UTC for storage, but do not use UTC month boundaries for a local-calendar product.
- Add DST and positive/negative offset tests after choosing the policy.

### D-02: Dashboard range labels are stale for non-month selections

Severity: Medium

The dashboard's four metric cards always use subtitles such as `this month`, even after selecting `Last 30 Days` or `Year to Date`. The values come from the selected API range, so the displayed label can claim a different period from the number.

Recommended resolution: derive the card subtitle from the selected period or have the API return an explicit display period.

### D-03: Dashboard total balance and range metrics have different scopes

Severity: Medium, documented contract risk

`income`, `expense`, and `netCashFlow` are selected-range values, but `totalBalance` is lifetime-wide. This is mathematically intentional in the current code and is tested, but the UI presents all four cards together without explaining the scope distinction. Users may interpret total balance as the selected range's net cash flow.

Recommended resolution: rename the API/UI field to make lifetime scope explicit, or return a range balance separately. Document the contract in the API schema.

### D-04: Live financial metrics are mixed with mock dashboard data

Severity: Medium product correctness risk

The dashboard uses live API values for the four top cards, chart, and recent transactions, but `SpendingByCategory` and `BudgetSnapshot` receive mock data. The page can therefore show a live total beside category and budget values that do not reconcile with it.

Recommended resolution: either derive all financial panels from the same API source or label/mock-gate the remaining panels until their endpoints exist.

### D-05: Average expense is a period-bucket average, not a daily or weekly average

Severity: Low to medium semantic risk

The frontend computes:

```text
averageExpense = sum(bucket.expense) / number of returned buckets
```

For weekly data this is average expense per returned week. For monthly data it is average expense per returned month. The chart changes its label to `Monthly avg. spend` when the backend returns a monthly period, so the arithmetic is internally consistent, but the prop is named `weeklyAvg` and the metric is not a daily average. This should be renamed or documented to avoid future misuse.

### D-06: Cache consistency can invalidate otherwise correct mathematics

Severity: High data-integrity risk

Complete-month totals and lifetime balance may come from materialized `Metric` documents while arbitrary ranges come directly from `Transaction`. The formulas agree, but the sources can disagree after a failed or concurrent hook update. A user can therefore see different totals for overlapping date selections.

Recommended resolution: use transactions as the source of truth, or update transaction and metric documents atomically with a MongoDB session/outbox and reconciliation process.

## Commands and Results

```text
npm run test:typecheck --workspace api  -> passed
npm run test --workspace api -- --run tests/metrics.test.ts -> 7 passed
npm run test:typecheck --workspace web  -> passed for the dashboard test project
npm run test --workspace web             -> 4 passed
```

The broader API suite still contains expected failing regression tests for pre-existing issues unrelated to metric arithmetic: authorization scoping, malformed JWT/ID error normalization, invalid currency acceptance, and the missing transaction index.
