import * as React from "react"
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  Download,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import { Card, CardContent } from "@workspace/ui/components/card"
import { useAuth } from "@/hooks/use-auth"
import { formatCurrency } from "@/lib/currency"
import { apiRequest } from "@/api/client"
import { TRANSACTIONS_CHANGED_EVENT } from "@/lib/transactions"
import type { Transaction } from "../data/mock-data"

import { MetricCard } from "../components/finance/MetricCard"
import { IncomeExpenseChart } from "../components/dashboard/IncomeExpenseChart"
import { RecentTransactions } from "../components/dashboard/RecentTransactions"
import { SpendingByCategory } from "../components/dashboard/SpendingByCategory"
import { BudgetSnapshot } from "../components/dashboard/BudgetSnapshot"
import {
  MOCK_TRANSACTIONS,
  MOCK_CATEGORY_SPENDING,
  MOCK_BUDGET_SNAPSHOT,
} from "../data/mock-data"
import {
  getDashboardDateRange,
  type DashboardDateRange,
} from "@/lib/dashboard-date-range"

interface DashboardMetrics {
  income: number
  expense: number
  netCashFlow: number
  totalBalance: number
  cashFlowSummary: {
    period: "week" | "month"
    summary: {
      label: string
      income: number
      expense: number
      netCashFlow: number
    }[]
  }
}

export function Dashboard() {
  const { currency } = useAuth()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = React.useState(true)
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null)
  const [isLoadingMetrics, setIsLoadingMetrics] = React.useState(true)
  const [selectedPeriod, setSelectedPeriod] = React.useState<
    "thisMonth" | "last30Days" | "yearToDate"
  >("thisMonth")
  const [dateRange, setDateRange] = React.useState<DashboardDateRange>(() =>
    getDashboardDateRange("thisMonth", new Date())
  )

  React.useEffect(() => {
    async function loadMetrics() {
      try {
        setIsLoadingMetrics(true)
        setMetrics(null)
        const query = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })
        const response = await apiRequest<{ data: DashboardMetrics }>(
          `/metrics?${query.toString()}`
        )
        setMetrics(response.data)
      } catch (error) {
        console.error("Failed to load metrics", error)
      } finally {
        setIsLoadingMetrics(false)
      }
    }

    void loadMetrics()

    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, loadMetrics)

    return () => {
      window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, loadMetrics)
    }
  }, [dateRange])

  React.useEffect(() => {
    async function loadTransactions() {
      try {
        const response = await apiRequest<{
          data: Array<{
            _id: string
            amount: number
            type: "debit" | "credit"
            date: string
          }>
        }>("/transaction")
        // console.log(response.data)

        setTransactions(
          [...response.data]
            .sort(
              (first, second) =>
                new Date(second.date).getTime() - new Date(first.date).getTime()
            )
            .slice(0, 5)
            .map((transaction) => ({
              id: transaction._id,
              date: transaction.date,
              displayDate: new Date(transaction.date).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                }
              ),
              description:
                transaction.type === "credit"
                  ? "Income transaction"
                  : "Expense transaction",
              category: transaction.type === "credit" ? "Income" : "Expense",
              type: transaction.type,
              amount: transaction.amount,
            }))
        )
      } catch (error) {
        console.error("Failed to load transactions", error)
      } finally {
        setIsLoadingTransactions(false)
      }
    }

    void loadTransactions()

    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, loadTransactions)

    return () => {
      window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, loadTransactions)
    }
  }, [])

  const metricIcons = [
    <Wallet key="1" className="h-5 w-5 text-muted-foreground" />,
    <ArrowDownCircle key="2" className="h-5 w-5 text-success" />,
    <ArrowUpCircle key="3" className="h-5 w-5 text-destructive" />,
    <PiggyBank key="4" className="h-5 w-5 text-muted-foreground" />,
  ]

  const metricCards = [
    {
      title: "Total Balance",
      value: metrics?.totalBalance,
      trend: "up" as const,
      trendValue: undefined,
      subtitle: "across all transactions",
    },
    {
      title: "Total Income",
      value: metrics?.income,
      trend: undefined,
      trendValue: undefined,
      subtitle: "this month",
    },
    {
      title: "Total Expenses",
      value: metrics?.expense,
      trend: undefined,
      trendValue: undefined,
      subtitle: "this month",
    },
    {
      title: "Net Cash Flow",
      value: metrics?.netCashFlow,
      trend:
        metrics && metrics.netCashFlow >= 0
          ? ("up" as const)
          : ("down" as const),
      trendValue: undefined,
      subtitle: "this month",
    },
  ]

  function selectPeriod(period: "thisMonth" | "last30Days" | "yearToDate") {
    setIsLoadingMetrics(true)
    setMetrics(null)
    setSelectedPeriod(period)
    setDateRange(getDashboardDateRange(period, new Date()))
  }

  const cashFlowSummary = metrics?.cashFlowSummary ?? {
    period: "week" as const,
    summary: [],
  }
  const averageExpense = cashFlowSummary.summary.length
    ? cashFlowSummary.summary.reduce(
        (total, summary) => total + summary.expense,
        0
      ) / cashFlowSummary.summary.length
    : 0

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
          {/* Date Range Filter Pill Group */}
          <ButtonGroup className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-0.5 *:data-[slot=button]:rounded-md!">
            <Button
              variant={selectedPeriod === "thisMonth" ? "default" : "ghost"}
              size="sm"
              className={`h-7 rounded-md px-3 label-md ${
                selectedPeriod === "thisMonth"
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
              }`}
              onClick={() => selectPeriod("thisMonth")}
            >
              This Month
            </Button>
            <Button
              variant={selectedPeriod === "last30Days" ? "default" : "ghost"}
              size="sm"
              className={`h-7 rounded-md px-3 label-md ${
                selectedPeriod === "last30Days"
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
              }`}
              onClick={() => selectPeriod("last30Days")}
            >
              Last 30 Days
            </Button>
            <Button
              variant={selectedPeriod === "yearToDate" ? "default" : "ghost"}
              size="sm"
              className={`h-7 rounded-md px-3 label-md ${
                selectedPeriod === "yearToDate"
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
              }`}
              onClick={() => selectPeriod("yearToDate")}
            >
              Year to Date
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {/* TOP METRIC CARDS */}
      <section className="my-6 grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric, index) => {
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
              value={
                isLoadingMetrics || metric.value === undefined
                  ? "..."
                  : formatCurrency(metric.value, currency)
              }
              trend={metric.trend}
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
          <IncomeExpenseChart
            data={cashFlowSummary.summary}
            period={cashFlowSummary.period}
            weeklyAvg={averageExpense}
            isLoading={isLoadingMetrics}
          />
          <RecentTransactions
            transactions={
              isLoadingTransactions ? MOCK_TRANSACTIONS : transactions
            }
          />
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
