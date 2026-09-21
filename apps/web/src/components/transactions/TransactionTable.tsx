import type { Transaction } from "../../data/mock-data"
import { TransactionRow } from "./TransactionRow"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

interface TransactionTableProps {
  transactions: Transaction[]
}

export function TransactionTable({ transactions }: TransactionTableProps) {
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
              Category
            </TableHead>
            <TableHead className="h-9 px-4 text-right label-sm font-medium tracking-wider text-muted-foreground uppercase">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="body-md">
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
