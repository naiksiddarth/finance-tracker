import { CheckCircle2 } from "lucide-react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useAuth } from "@/hooks/use-auth"
import { formatCurrency } from "@/lib/currency"

interface IncomeExpenseChartProps {
  data: {
    label: string
    income: number
    expense: number
  }[]
  period: "week" | "month"
  weeklyAvg: number
  isLoading: boolean
}

export function IncomeExpenseChart({
  data,
  period,
  weeklyAvg,
  isLoading,
}: IncomeExpenseChartProps) {
  const { currency } = useAuth()
  const formattedWeeklyAvg = formatCurrency(weeklyAvg, currency)

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="headline-sm font-semibold text-foreground">
            Income vs. Expenses
          </h2>
          <p className="body-sm text-muted-foreground">
            {period === "month" ? "Monthly" : "Weekly"} income and expense
            comparison
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 label-sm text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-success"></span>
            <span>Income</span>
          </div>
          <div className="flex items-center gap-1.5 label-sm text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive"></span>
            <span>Expenses</span>
          </div>
        </div>
      </div>

      <div className="p-6 pt-4">
        <div className="h-56 w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-40 w-full animate-pulse rounded-md bg-muted" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) =>
                    formatCurrency(value, currency)
                  }
                  width={64}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(Number(value) || 0, currency),
                    name === "income" ? "Income" : "Expenses",
                  ]}
                  labelFormatter={(label) => label}
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                  }}
                />
                {data.length === 1 ? (
                  <>
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="var(--success)"
                      radius={[4, 4, 0, 0]}
                      animationDuration={500}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="expense"
                      name="Expenses"
                      fill="var(--destructive)"
                      radius={[4, 4, 0, 0]}
                      animationDuration={500}
                      animationEasing="ease-out"
                    />
                  </>
                ) : (
                  <>
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="var(--success)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "var(--success)" }}
                      activeDot={{ r: 6 }}
                      animationDuration={500}
                      animationEasing="ease-out"
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      name="Expenses"
                      stroke="var(--destructive)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "var(--destructive)" }}
                      activeDot={{ r: 6 }}
                      animationDuration={500}
                      animationEasing="ease-out"
                    />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 body-sm text-muted-foreground">
          <span>
            {period === "month" ? "Monthly" : "Weekly"} avg. spend:{" "}
            <strong className="numeric-sm text-foreground">
              {formattedWeeklyAvg}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1 label-md text-success">
            <CheckCircle2 className="h-4 w-4" />
            Optimal burn-rate maintained
          </span>
        </div>
      </div>
    </div>
  )
}
