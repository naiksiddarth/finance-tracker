import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  Download,
  CalendarDays,
  ChevronDown,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import { Card, CardContent } from "@workspace/ui/components/card"
import { MetricCard } from "../components/finance/MetricCard"
import { IncomeExpenseChart } from "../components/dashboard/IncomeExpenseChart"
import { RecentTransactions } from "../components/dashboard/RecentTransactions"
import { SpendingByCategory } from "../components/dashboard/SpendingByCategory"
import { BudgetSnapshot } from "../components/dashboard/BudgetSnapshot"
import {
  MOCK_TRANSACTIONS,
  MOCK_METRICS,
  MOCK_CATEGORY_SPENDING,
  MOCK_BUDGET_SNAPSHOT,
  MOCK_CASH_FLOW,
} from "../data/mock-data"

export function Dashboard() {
  const metricIcons = [
    <Wallet key="1" className="h-5 w-5 text-muted-foreground" />,
    <ArrowDownCircle key="2" className="h-5 w-5 text-success" />,
    <ArrowUpCircle key="3" className="h-5 w-5 text-destructive" />,
    <PiggyBank key="4" className="h-5 w-5 text-muted-foreground" />,
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* PAGE HEADER ROW */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="headline-lg text-foreground">Dashboard</h1>
          <p className="mt-0.5 body-md text-muted-foreground">
            Welcome back, Alex. Here is your financial overview for October.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-8 items-center gap-1.5 rounded-lg border-border bg-card px-3 label-md text-foreground transition-colors hover:bg-muted"
          >
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>October 2024</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>

          {/* Date Range Filter Pill Group */}
          <ButtonGroup className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-0.5 *:data-[slot=button]:rounded-md!">
            <Button
              variant="default"
              size="sm"
              className="h-7 rounded-md px-3 label-md"
            >
              This Month
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-md px-3 label-md text-muted-foreground"
            >
              Last 30 Days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-md px-3 label-md text-muted-foreground"
            >
              Year to Date
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {/* TOP METRIC CARDS */}
      <section className="my-6 grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_METRICS.map((metric, index) => {
          let iconContainerClass = ""
          let valueClass = ""

          if (index === 1) {
            // Income
            iconContainerClass =
              "w-7 h-7 rounded-lg bg-success/20 flex items-center justify-center"
            valueClass = "text-success"
          } else if (index === 2) {
            // Expenses
            iconContainerClass =
              "w-7 h-7 rounded-lg bg-destructive/20 flex items-center justify-center"
            valueClass = "text-destructive"
          }

          return (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              trend={metric.trend as any}
              trendValue={metric.trendValue}
              subtitle={metric.subtitle}
              icon={metricIcons[index]}
              iconContainerClass={iconContainerClass}
              valueClass={valueClass}
            />
          )
        })}
      </section>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="mb-12 grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="space-y-gutter lg:col-span-7">
          <IncomeExpenseChart data={MOCK_CASH_FLOW} weeklyAvg={961.3} />
          <RecentTransactions transactions={MOCK_TRANSACTIONS} />
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-gutter lg:col-span-5">
          <SpendingByCategory categories={MOCK_CATEGORY_SPENDING} />
          <BudgetSnapshot snapshot={MOCK_BUDGET_SNAPSHOT} />

          {/* QUICK SHORTCUT */}
          <Card className="gap-0 rounded-lg border border-border bg-muted p-5 shadow-sm ring-0">
            <CardContent className="flex items-center justify-between gap-3 p-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <div className="label-md font-semibold text-foreground">
                    Export Tax & Ledger Report
                  </div>
                  <div className="body-sm text-muted-foreground">
                    Download verified CSV / PDF statements
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg border-border bg-card px-3 label-md font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Export
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
