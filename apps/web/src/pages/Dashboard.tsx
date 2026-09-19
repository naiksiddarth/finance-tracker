import { Wallet, ArrowDownCircle, ArrowUpCircle, PiggyBank, Download } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
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
  MOCK_CASH_FLOW
} from "../data/mock-data"

export function Dashboard() {
  const metricIcons = [
    <Wallet key="1" className="w-5 h-5 text-muted-foreground" />,
    <ArrowDownCircle key="2" className="w-5 h-5 text-success" />,
    <ArrowUpCircle key="3" className="w-5 h-5 text-destructive" />,
    <PiggyBank key="4" className="w-5 h-5 text-muted-foreground" />,
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* PAGE HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="headline-lg text-foreground">Dashboard</h1>
          <p className="body-md text-muted-foreground mt-0.5">Welcome back, Alex. Here is your financial overview for October.</p>
        </div>
        {/* Date Range Filter Pill Group */}
        <div className="inline-flex items-center p-0.5 rounded-lg border border-border bg-card self-start md:self-auto">
          <Button variant="default" size="sm" className="h-7 px-3 label-md  rounded-md ">This Month</Button>
          <Button variant="ghost" size="sm" className="h-7 px-3 label-md rounded-md text-muted-foreground">Last 30 Days</Button>
          <Button variant="ghost" size="sm" className="h-7 px-3 label-md rounded-md text-muted-foreground">Year to Date</Button>
        </div>
      </div>

      {/* TOP METRIC CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter my-6">
        {MOCK_METRICS.map((metric, index) => {
          let iconContainerClass = ""
          let valueClass = ""

          if (index === 1) { // Income
            iconContainerClass = "w-7 h-7 rounded-lg bg-success/20 flex items-center justify-center"
            valueClass = "text-success"
          } else if (index === 2) { // Expenses
            iconContainerClass = "w-7 h-7 rounded-lg bg-destructive/20 flex items-center justify-center"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-12">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-gutter">
          <IncomeExpenseChart data={MOCK_CASH_FLOW} weeklyAvg={961.30} />
          <RecentTransactions transactions={MOCK_TRANSACTIONS} />
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 space-y-gutter">
          <SpendingByCategory categories={MOCK_CATEGORY_SPENDING} />
          <BudgetSnapshot snapshot={MOCK_BUDGET_SNAPSHOT} />

          {/* QUICK SHORTCUT */}
          <div className="rounded-lg border border-border bg-muted p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-primary">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <div className="label-md font-semibold text-foreground">Export Tax & Ledger Report</div>
                <div className="body-sm text-muted-foreground">Download verified CSV / PDF statements</div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg border-border bg-card hover:bg-secondary transition-colors label-md font-medium text-foreground">
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
