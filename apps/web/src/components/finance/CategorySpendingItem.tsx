import { cn } from "@workspace/ui/lib/utils"

interface CategorySpendingItemProps {
  name: string
  amount: number
  percentage: number
  colorClass: string
}

export function CategorySpendingItem({
  name,
  amount,
  percentage,
  colorClass,
}: CategorySpendingItemProps) {
  // Format amount as currency
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between body-sm">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", colorClass)}></span>
          <span className="font-medium text-foreground">{name}</span>
        </div>
        <div className="numeric-sm text-foreground">
          {formattedAmount}{" "}
          <span className="font-normal text-muted-foreground">
            ({percentage}%)
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-1.5 rounded-full", colorClass)}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}
