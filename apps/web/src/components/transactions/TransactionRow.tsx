import * as React from "react"
import { Pencil, Trash2 } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import type { Transaction } from "@/types/finance"
import { TransactionTypeBadge } from "../finance/TransactionTypeBadge"
import { TableCell, TableRow } from "@workspace/ui/components/table"
import { TransactionModal } from "./TransactionModal"
import { useAuth } from "@/hooks/use-auth"
import { formatCurrency } from "@/lib/currency"

interface TransactionRowProps {
  transaction: Transaction
  showCategory?: boolean
  showActions?: boolean
  onDelete?: (transaction: Transaction) => void
}

export function TransactionRow({
  transaction,
  showCategory = true,
  showActions = false,
  onDelete,
}: TransactionRowProps) {
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
          {transaction.displayDate ?? transaction.date}
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
          <TransactionTypeBadge category={isCredit ? "Credit" : "Debit"} />
        </TableCell>
        {showCategory && (
          <TableCell className="p-4 align-top">
            <TransactionTypeBadge category={transaction.category} />
          </TableCell>
        )}
        <TableCell
          className={cn(
            "p-4 text-right align-top numeric-md font-semibold",
            amountColor
          )}
        >
          {amountPrefix}
          {formattedAmount}
        </TableCell>
        {showActions && (
          <TableCell className="p-2 text-right align-top">
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Edit transaction"
                onClick={(event) => {
                  event.stopPropagation()
                  setIsEditModalOpen(true)
                }}
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete transaction"
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete?.(transaction)
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </TableCell>
        )}
      </TableRow>
      <TransactionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        mode="edit"
        transaction={transaction}
      />
    </>
  )
}
