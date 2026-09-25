import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import type { Transaction } from "../../data/mock-data"
import { TransactionTypeBadge } from "../finance/TransactionTypeBadge"
import { TableCell, TableRow } from "@workspace/ui/components/table"
import { TransactionModal } from "./TransactionModal"
import { useAuth } from "@/hooks/use-auth"
import { formatCurrency } from "@/lib/currency"

interface TransactionRowProps {
  transaction: Transaction
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const { currency } = useAuth()
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)

  const isCredit = transaction.type === "credit"
  const amountPrefix = isCredit ? "+" : "-"
  const amountColor = isCredit ? "text-success" : "text-destructive"

  const formattedAmount = formatCurrency(transaction.amount, currency)

  return (
    <>
      <TableRow
        className="cursor-pointer border-border transition-colors hover:bg-muted"
        onClick={() => setIsEditModalOpen(true)}
      >
        <TableCell className="p-4 align-top numeric-sm text-muted-foreground">
          {transaction.date}
        </TableCell>
        <TableCell className="p-4">
          <div className="font-medium text-foreground">
            {transaction.description}
          </div>
          {transaction.subtitle && (
            <div className="body-sm text-muted-foreground">
              {transaction.subtitle}
            </div>
          )}
        </TableCell>
        <TableCell className="p-4 align-top">
          <TransactionTypeBadge category={transaction.category} />
        </TableCell>
        <TableCell
          className={cn(
            "p-4 text-right align-top numeric-md font-semibold",
            amountColor
          )}
        >
          {amountPrefix}
          {formattedAmount}
        </TableCell>
      </TableRow>
      <TransactionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        mode="edit"
      />
    </>
  )
}
