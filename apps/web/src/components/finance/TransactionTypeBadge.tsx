import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"

interface TransactionTypeBadgeProps {
  category: string
}

export function TransactionTypeBadge({ category }: TransactionTypeBadgeProps) {
  // Map standard categories to visual styles based on design
  let badgeStyles;
  
  const categoryLower = category.toLowerCase()
  if (categoryLower === "salary" || categoryLower === "consulting") {
    badgeStyles = "bg-success text-success-foreground border-transparent"
  } else {
    badgeStyles = "bg-secondary text-primary border-transparent"
  }

  return (
    <Badge  
      variant="outline" 
      className={cn("px-2 py-0.5 rounded-lg label-sm font-medium", badgeStyles)}
    >
      {category}
    </Badge>
  )
}
