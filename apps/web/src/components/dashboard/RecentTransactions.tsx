import { ArrowRight } from "lucide-react"
import { TransactionTable } from "../transactions/TransactionTable"
import type { Transaction } from "../../data/mock-data"

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-6 pb-4 flex items-center justify-between">
        <div>
          <h2 className="headline-sm text-foreground font-semibold">Recent Transactions</h2>
          <p className="body-sm text-muted-foreground">Latest postings and cleared debits</p>
        </div>
        <a className="label-md text-primary font-medium hover:underline inline-flex items-center gap-1" href="#">
          <span>View all transactions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
      <TransactionTable transactions={transactions} />
    </div>
  )
}
