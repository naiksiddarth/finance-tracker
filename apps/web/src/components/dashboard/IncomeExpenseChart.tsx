import { CheckCircle2 } from "lucide-react"

interface IncomeExpenseChartProps {
  data: {
    label: string
    incomeHeight: string
    expenseHeight: string
    incomeTitle: string
    expenseTitle: string
  }[]
  weeklyAvg: number
}

export function IncomeExpenseChart({
  data,
  weeklyAvg,
}: IncomeExpenseChartProps) {
  const formattedWeeklyAvg = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(weeklyAvg)

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="headline-sm font-semibold text-foreground">
            Income vs. Expenses
          </h2>
          <p className="body-sm text-muted-foreground">
            Weekly distribution comparison across October
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 label-sm text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-success"></span>
            <span>Income</span>
          </div>
          <div className="flex items-center gap-1.5 label-sm text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-destructive"></span>
            <span>Expenses</span>
          </div>
        </div>
      </div>

      <div className="p-6 pt-4">
        <div className="flex h-56 flex-col justify-between">
          <div className="relative flex flex-1 items-end justify-between gap-6 border-b border-border px-4 pb-2">
            {/* Background Lines */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-40">
              <div className="w-full border-b border-dashed border-border"></div>
              <div className="w-full border-b border-dashed border-border"></div>
              <div className="w-full border-b border-dashed border-border"></div>
              <div className="w-full"></div>
            </div>

            {/* Bars */}
            {data.map((item, index) => (
              <div
                key={index}
                className="relative z-10 flex h-full w-full items-end justify-center gap-2"
              >
                <div
                  className="w-6 rounded-t-sm bg-success transition-all hover:opacity-90 sm:w-8"
                  style={{ height: item.incomeHeight }}
                  title={item.incomeTitle}
                ></div>
                <div
                  className="w-6 rounded-t-sm bg-destructive transition-all hover:opacity-90 sm:w-8"
                  style={{ height: item.expenseHeight }}
                  title={item.expenseTitle}
                ></div>
              </div>
            ))}
          </div>

          {/* X-Axis Labels */}
          <div className="flex items-center justify-between px-4 pt-3 label-sm text-muted-foreground">
            {data.map((item, index) => (
              <div key={index} className="w-full text-center">
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 body-sm text-muted-foreground">
          <span>
            Weekly avg. spend:{" "}
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
