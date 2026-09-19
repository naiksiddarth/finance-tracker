import { CategorySpendingItem } from "../finance/CategorySpendingItem"
import type { CategorySpending } from "../../data/mock-data"

interface SpendingByCategoryProps {
  categories: CategorySpending[]
}

export function SpendingByCategory({ categories }: SpendingByCategoryProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="headline-sm text-foreground font-semibold">Spending by Category</h2>
          <p className="body-sm text-muted-foreground">October total breakdown</p>
        </div>
        <span className="numeric-sm text-muted-foreground">{categories.length} Categories</span>
      </div>
      
      <div className="mt-5 space-y-4">
        {categories.map((category) => (
          <CategorySpendingItem 
            key={category.name}
            name={category.name}
            amount={category.amount}
            percentage={category.percentage}
            colorClass={category.colorClass}
          />
        ))}
      </div>
    </div>
  )
}
