import { cn } from "@workspace/ui/lib/utils"

interface CategorySpendingItemProps {
  name: string
  amount: number
  percentage: number
  colorClass: string
}

export function CategorySpendingItem({ name, amount, percentage, colorClass }: CategorySpendingItemProps) {
  // Format amount as currency
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)

  return (
    <div>
      <div className="flex justify-between items-center body-sm mb-1.5">
        <div className="flex items-center gap-2">
          <span className={cn("w-2.5 h-2.5 rounded-full", colorClass)}></span>
          <span className="font-medium text-foreground">{name}</span>
        </div>
        <div className="numeric-sm text-foreground">
          {formattedAmount} <span className="text-muted-foreground font-normal">({percentage}%)</span>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div className={cn("h-1.5 rounded-full", colorClass)} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  )
}
