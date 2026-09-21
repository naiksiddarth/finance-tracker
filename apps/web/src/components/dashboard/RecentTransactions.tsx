import { ArrowRight } from "lucide-react"
import { TransactionTable } from "../transactions/TransactionTable"
import type { Transaction } from "../../data/mock-data"

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h2 className="headline-sm font-semibold text-foreground">
            Recent Transactions
          </h2>
          <p className="body-sm text-muted-foreground">
            Latest postings and cleared debits
          </p>
        </div>
        <a
          className="inline-flex items-center gap-1 label-md font-medium text-primary hover:underline"
          href="#"
        >
          <span>View all transactions</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
      <TransactionTable transactions={transactions} />
    </div>
  )
}
