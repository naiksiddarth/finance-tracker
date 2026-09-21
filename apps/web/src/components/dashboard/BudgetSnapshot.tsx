import { AlertTriangle, CheckCircle } from "lucide-react"
import type { BudgetSnapshot as BudgetSnapshotType } from "../../data/mock-data"
import { cn } from "@workspace/ui/lib/utils"

interface BudgetSnapshotProps {
  snapshot: BudgetSnapshotType
}

export function BudgetSnapshot({ snapshot }: BudgetSnapshotProps) {
  const percentageUsed = Math.round((snapshot.spent / snapshot.limit) * 100)

  const formattedSpent = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(snapshot.spent)
  const formattedLimit = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(snapshot.limit)

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3">
        <h2 className="headline-sm font-semibold text-foreground">
          Monthly Budget Snapshot
        </h2>
        <span className="numeric-sm font-semibold text-foreground">
          {percentageUsed}% Used
        </span>
      </div>

      <div className="mt-2">
        <div className="mb-1.5 flex justify-between body-sm text-muted-foreground">
          <span>{formattedSpent} spent</span>
          <span className="numeric-sm text-muted-foreground">
            {formattedLimit} limit
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${percentageUsed}%` }}
          ></div>
        </div>
      </div>

      <div className="mt-5 space-y-2.5 border-t border-border pt-4">
        {snapshot.alerts.map((alert, index) => {
          const isWarning = alert.status === "warning"
          return (
            <div
              key={index}
              className={cn(
                "flex items-start justify-between rounded-lg border p-3",
                isWarning
                  ? "border-destructive/20 bg-destructive/20"
                  : "border-success/20 bg-success/20"
              )}
            >
              <div className="flex items-start gap-2.5">
                {isWarning ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                ) : (
                  <CheckCircle className="mt-0.5 h-4 w-4 text-success" />
                )}
                <div>
                  <div className="label-md font-semibold text-foreground">
                    {alert.title}
                  </div>
                  <div className="body-sm text-muted-foreground">
                    {alert.description}
                  </div>
                </div>
              </div>
              <span
                className={cn(
                  "label-sm font-semibold",
                  isWarning ? "text-destructive" : "text-success"
                )}
              >
                {isWarning ? "Warning" : "On Track"}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
