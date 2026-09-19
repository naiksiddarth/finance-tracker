import { cn } from "@workspace/ui/lib/utils"
import type { Transaction } from "../../data/mock-data"
import { TransactionTypeBadge } from "../finance/TransactionTypeBadge"
import { TableCell, TableRow } from "@workspace/ui/components/table"

interface TransactionRowProps {
  transaction: Transaction
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const isCredit = transaction.type === "credit"
  const amountPrefix = isCredit ? "+" : "-"
  const amountColor = isCredit ? "text-success" : "text-destructive"

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(transaction.amount)

  return (
    <TableRow className="hover:bg-muted transition-colors border-border">
      <TableCell className="p-4 numeric-sm text-muted-foreground align-top">
        {transaction.date}
      </TableCell>
      <TableCell className="p-4">
        <div className="font-medium text-foreground">{transaction.description}</div>
        {transaction.subtitle && (
          <div className="body-sm text-muted-foreground">{transaction.subtitle}</div>
        )}
      </TableCell>
      <TableCell className="p-4 align-top">
        <TransactionTypeBadge category={transaction.category} />
      </TableCell>
      <TableCell className={cn("p-4 text-right numeric-md font-semibold align-top", amountColor)}>
        {amountPrefix}{formattedAmount}
      </TableCell>
    </TableRow>
  )
}
