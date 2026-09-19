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

export function IncomeExpenseChart({ data, weeklyAvg }: IncomeExpenseChartProps) {
  const formattedWeeklyAvg = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(weeklyAvg)

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="headline-sm text-foreground font-semibold">Income vs. Expenses</h2>
          <p className="body-sm text-muted-foreground">Weekly distribution comparison across October</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 label-sm text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm bg-success"></span>
            <span>Income</span>
          </div>
          <div className="flex items-center gap-1.5 label-sm text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm bg-destructive"></span>
            <span>Expenses</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 pt-4">
        <div className="h-56 flex flex-col justify-between">
          <div className="relative flex-1 flex items-end justify-between gap-6 px-4 pb-2 border-b border-border">
            {/* Background Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="w-full border-b border-dashed border-border"></div>
              <div className="w-full border-b border-dashed border-border"></div>
              <div className="w-full border-b border-dashed border-border"></div>
              <div className="w-full"></div>
            </div>
            
            {/* Bars */}
            {data.map((item, index) => (
              <div key={index} className="relative z-10 flex items-end gap-2 h-full w-full justify-center">
                <div 
                  className="w-6 sm:w-8 bg-success rounded-t-sm transition-all hover:opacity-90" 
                  style={{ height: item.incomeHeight }} 
                  title={item.incomeTitle}
                ></div>
                <div 
                  className="w-6 sm:w-8 bg-destructive rounded-t-sm transition-all hover:opacity-90" 
                  style={{ height: item.expenseHeight }} 
                  title={item.expenseTitle}
                ></div>
              </div>
            ))}
          </div>
          
          {/* X-Axis Labels */}
          <div className="flex justify-between items-center px-4 pt-3 label-sm text-muted-foreground">
            {data.map((item, index) => (
              <div key={index} className="w-full text-center">{item.label}</div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4 body-sm text-muted-foreground">
          <span>Weekly avg. spend: <strong className="numeric-sm text-foreground">{formattedWeeklyAvg}</strong></span>
          <span className="inline-flex items-center gap-1 label-md text-success">
            <CheckCircle2 className="w-4 h-4" />
            Optimal burn-rate maintained
          </span>
        </div>
      </div>
    </div>
  )
}
