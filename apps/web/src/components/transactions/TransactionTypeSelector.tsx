import { cn } from "@workspace/ui/lib/utils"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

export type TransactionType = "expense" | "income"

interface TransactionTypeSelectorProps {
  value: TransactionType
  onChange: (value: TransactionType) => void
  className?: string
}

export function TransactionTypeSelector({
  value,
  onChange,
  className,
}: TransactionTypeSelectorProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 rounded-lg border border-border bg-background p-1",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange("expense")}
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-md px-4 py-3 text-sm transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          value === "expense"
            ? "border border-destructive/20 bg-destructive/10 text-destructive shadow-sm"
            : "border border-transparent text-muted-foreground hover:bg-muted/50"
        )}
      >
        <div className="flex items-center gap-2">
          <ArrowUpRight
            className={cn("h-4 w-4", value === "expense" && "text-destructive")}
          />
          <span className="font-semibold text-foreground">Expense (Debit)</span>
        </div>
        <span
          className={cn(
            "text-xs",
            value === "expense" ? "text-destructive" : "text-muted-foreground"
          )}
        >
          Money Out
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange("income")}
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-md px-4 py-3 text-sm transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          value === "income"
            ? "border border-success/20 bg-success/10 text-success shadow-sm"
            : "border border-transparent text-muted-foreground hover:bg-muted/50"
        )}
      >
        <div className="flex items-center gap-2">
          <ArrowDownRight
            className={cn("h-4 w-4", value === "income" && "text-success")}
          />
          <span className="font-semibold text-foreground">Income (Credit)</span>
        </div>
        <span
          className={cn(
            "text-xs",
            value === "income" ? "text-success" : "text-muted-foreground"
          )}
        >
          Money In
        </span>
      </button>
    </div>
  )
}
