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
          <TableRow className="bg-muted border-y border-border hover:bg-muted">
            <TableHead className="h-9 px-4 label-sm text-muted-foreground font-medium uppercase tracking-wider">Date</TableHead>
            <TableHead className="h-9 px-4 label-sm text-muted-foreground font-medium uppercase tracking-wider">Description</TableHead>
            <TableHead className="h-9 px-4 label-sm text-muted-foreground font-medium uppercase tracking-wider">Category</TableHead>
            <TableHead className="h-9 px-4 label-sm text-muted-foreground font-medium uppercase tracking-wider text-right">Amount</TableHead>
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
