import type { Transaction } from "@/types/finance"
import { TransactionRow } from "./TransactionRow"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

const SHOW_TRANSACTION_CATEGORY = false

interface TransactionTableProps {
  transactions: Transaction[]
  showActions?: boolean
  onDelete?: (transaction: Transaction) => void
}

export function TransactionTable({
  transactions,
  showActions = false,
  onDelete,
}: TransactionTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table className="w-full text-left">
        <TableHeader>
          <TableRow className="border-y border-border bg-muted hover:bg-muted">
            <TableHead className="h-9 px-4 label-sm font-medium tracking-wider text-muted-foreground uppercase">
              Date
            </TableHead>
            <TableHead className="h-9 px-4 label-sm font-medium tracking-wider text-muted-foreground uppercase">
              Description
            </TableHead>
            <TableHead className="h-9 px-4 label-sm font-medium tracking-wider text-muted-foreground uppercase">
              Type
            </TableHead>
            {SHOW_TRANSACTION_CATEGORY && (
              <TableHead className="h-9 px-4 label-sm font-medium tracking-wider text-muted-foreground uppercase">
                Category
              </TableHead>
            )}
            <TableHead className="h-9 px-4 text-right label-sm font-medium tracking-wider text-muted-foreground uppercase">
              Amount
            </TableHead>
            {showActions && (
              <TableHead className="h-9 px-4 text-right label-sm font-medium tracking-wider text-muted-foreground uppercase">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody className="body-md">
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              showCategory={SHOW_TRANSACTION_CATEGORY}
              showActions={showActions}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
