import * as React from "react"
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { apiRequest } from "@/api/client"
import { formatCurrency } from "@/lib/currency"
import { notifyTransactionsChanged } from "@/lib/transactions"
import { useAuth } from "@/hooks/use-auth"
import { TransactionTable } from "@/components/transactions/TransactionTable"
import type { Transaction } from "@/types/finance"

import type { Currency } from "@finance-tracker/shared/constants/transactions"

type TransactionFilter = "all" | "credit" | "debit"
type SortOrder = "newest" | "oldest" | "highest" | "lowest"

const SHORTCUT_TOOLTIP_DELAY = 3000

function toTransaction(apiTransaction: {
  _id: string
  amount: number
  type: "credit" | "debit"
  date: string
}): Transaction {
  const isCredit = apiTransaction.type === "credit"

  return {
    id: apiTransaction._id,
    date: apiTransaction.date,
    displayDate: new Date(apiTransaction.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    description: isCredit ? "Income transaction" : "Expense transaction",
    subtitle: isCredit ? "Incoming credit" : "Debit transaction",
    category: "Uncategorized",
    type: apiTransaction.type,
    amount: apiTransaction.amount,
  }
}

export function Transactions() {
  const { currency } = useAuth()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<TransactionFilter>("all")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("newest")
  const [selectedTransaction, setSelectedTransaction] =
    React.useState<Transaction | null>(null)

  async function loadTransactions() {
    try {
      setIsLoading(true)
      const response = await apiRequest<{
        data: Array<{
          _id: string
          amount: number
          type: "credit" | "debit"
          date: string
        }>
      }>("/transaction")
      setTransactions(response.data.map(toTransaction))
    } catch (error) {
      console.error("Failed to load transactions", error)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    void Promise.resolve().then(() => loadTransactions())
  }, [])

  const categories = Array.from(
    new Set(transactions.map((transaction) => transaction.category))
  )

  const filteredTransactions = [...transactions]
    .filter((transaction) => {
      const searchValue = search.toLowerCase().trim()
      const matchesSearch = searchValue
        ? `${transaction.description} ${transaction.subtitle ?? ""} ${transaction.category}`
            .toLowerCase()
            .includes(searchValue)
        : true
      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter
      const matchesCategory =
        categoryFilter === "all" || transaction.category === categoryFilter

      return matchesSearch && matchesType && matchesCategory
    })
    .sort((first, second) => {
      if (sortOrder === "highest" || sortOrder === "lowest") {
        return sortOrder === "highest"
          ? second.amount - first.amount
          : first.amount - second.amount
      }

      const firstDate = new Date(first.date).getTime()
      const secondDate = new Date(second.date).getTime()
      return sortOrder === "newest"
        ? secondDate - firstDate
        : firstDate - secondDate
    })

  const totalInflow = filteredTransactions
    .filter((transaction) => transaction.type === "credit")
    .reduce((total, transaction) => total + transaction.amount, 0)
  const totalOutflow = filteredTransactions
    .filter((transaction) => transaction.type === "debit")
    .reduce((total, transaction) => total + transaction.amount, 0)
  const netSavings = totalInflow - totalOutflow

  async function handleDelete(transaction: Transaction) {
    try {
      await apiRequest("/transaction", {
        method: "DELETE",
        body: JSON.stringify({ _id: transaction.id }),
      })
      setSelectedTransaction(null)
      await loadTransactions()
      notifyTransactionsChanged()
    } catch (error) {
      console.error("Failed to delete transaction", error)
    }
  }

  function clearFilters() {
    setSearch("")
    setTypeFilter("all")
    setCategoryFilter("all")
  }

  const hasFilters =
    Boolean(search) || typeFilter !== "all" || categoryFilter !== "all"

  return (
    <div className="flex flex-col gap-5 pb-10">
      <section className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="headline-lg text-foreground">Transactions</h1>
          <p className="body-md text-muted-foreground">
            View, filter, search, and manage all your income and expenses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ShortcutTooltip shortcut="⌘ + E">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="size-4" />
              Export CSV
            </Button>
          </ShortcutTooltip>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricSummary
          title="Total Inflow"
          value={totalInflow}
          currency={currency}
          icon={<ArrowDown className="size-4" />}
          tone="success"
          subtitle="within current view"
        />
        <MetricSummary
          title="Total Outflow"
          value={totalOutflow}
          currency={currency}
          icon={<ArrowUp className="size-4" />}
          tone="destructive"
          subtitle="within current view"
        />
        <MetricSummary
          title="Net Savings"
          value={netSavings}
          currency={currency}
          icon={<SlidersHorizontal className="size-4" />}
          tone="primary"
          subtitle={`${filteredTransactions.length} entries included`}
        />
        <MetricSummary
          title="Transactions Processed"
          value={filteredTransactions.length}
          icon={<Check className="size-4" />}
          tone="primary"
          subtitle="in current view"
        />
      </section>

      <Card className="rounded-lg border-border shadow-sm">
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <ShortcutTooltip shortcut="/" className="min-w-0 flex-1">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="h-9 pl-9"
              />
            </div>
          </ShortcutTooltip>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as TransactionFilter)}
          >
            <SelectTrigger className="h-9 w-full lg:w-44">
              <SelectValue>
                {typeFilter === "all"
                  ? "All types"
                  : typeFilter === "debit"
                    ? "Debits (Expenses)"
                    : "Credits (Income)"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="debit">Debits (Expenses)</SelectItem>
              <SelectItem value="credit">Credits (Income)</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value ?? "all")}
          >
            <SelectTrigger className="h-9 w-full lg:w-40">
              <SelectValue>
                {categoryFilter === "all" ? "All categories" : categoryFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-9 justify-between gap-2 lg:w-40"
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4" /> Oct 1 - Oct 31
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
          <Select
            value={sortOrder}
            onValueChange={(value) => setSortOrder(value as SortOrder)}
          >
            <SelectTrigger className="h-9 w-full lg:w-40">
              <SelectValue>
                {sortOrder === "newest"
                  ? "Newest first"
                  : sortOrder === "oldest"
                    ? "Oldest first"
                    : sortOrder === "highest"
                      ? "Highest amount"
                      : "Lowest amount"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="highest">Highest amount</SelectItem>
              <SelectItem value="lowest">Lowest amount</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          {search && (
            <FilterChip
              label={`Search: "${search}"`}
              onClear={() => setSearch("")}
            />
          )}
          {typeFilter !== "all" && (
            <FilterChip
              label={`Type: ${typeFilter === "credit" ? "Credits" : "Debits"}`}
              onClear={() => setTypeFilter("all")}
            />
          )}
          {categoryFilter !== "all" && (
            <FilterChip
              label={`Category: ${categoryFilter}`}
              onClear={() => setCategoryFilter("all")}
            />
          )}
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3" /> Oct 1 - Oct 31, 2024
          </span>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-xs"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <Card className="min-w-0 overflow-hidden rounded-lg border-border shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                Loading transactions...
              </div>
            ) : filteredTransactions.length ? (
              <TransactionTable
                transactions={filteredTransactions}
                showActions
                onDelete={setSelectedTransaction}
              />
            ) : (
              <div className="flex h-72 flex-col items-center justify-center gap-2 p-6 text-center">
                <Search className="size-7 text-muted-foreground" />
                <p className="font-medium text-foreground">
                  No transactions found
                </p>
                <p className="text-sm text-muted-foreground">
                  Try changing your filters or search terms.
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Reset filters
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
              <span>
                Showing {filteredTransactions.length} of {transactions.length}{" "}
                transactions
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="secondary" size="sm">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={selectedTransaction !== null}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete transaction?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2 text-sm">
              <span className="truncate text-foreground">
                {selectedTransaction.description}
              </span>
              <span className="font-mono font-semibold text-destructive">
                {formatCurrency(selectedTransaction.amount, currency)}
              </span>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedTransaction(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedTransaction && void handleDelete(selectedTransaction)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricSummary({
  title,
  value,
  currency,
  icon,
  tone,
  subtitle,
}: {
  title: string
  value: number
  currency?: Currency
  icon: React.ReactNode
  tone: "success" | "destructive" | "primary"
  subtitle: string
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-primary"
  return (
    <Card className="rounded-lg border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {title}
          </span>
          <span className={`rounded bg-muted p-1.5 ${toneClass}`}>{icon}</span>
        </div>
        <p className={`mt-2 font-mono text-2xl font-semibold ${toneClass}`}>
          {currency ? formatCurrency(value, currency) : value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function FilterChip({
  label,
  onClear,
}: {
  label: string
  onClear: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-1 text-xs text-foreground">
      <span>{label}</span>
      <button
        type="button"
        aria-label={`Remove ${label} filter`}
        onClick={onClear}
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

function ShortcutTooltip({
  shortcut,
  className,
  children,
}: {
  shortcut: string
  className?: string
  children: React.ReactNode
}) {
  const [isVisible, setIsVisible] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTooltipTimer() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }

  function startTooltipTimer() {
    timeoutRef.current = setTimeout(
      () => setIsVisible(true),
      SHORTCUT_TOOLTIP_DELAY
    )
  }

  React.useEffect(() => clearTooltipTimer, [])

  return (
    <span
      className={`relative inline-flex ${className ?? ""}`}
      onMouseEnter={startTooltipTimer}
      onMouseLeave={clearTooltipTimer}
    >
      {children}
      {isVisible && (
        <span
          role="tooltip"
          className="absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md"
        >
          Shortcut: {shortcut}
        </span>
      )}
    </span>
  )
}
