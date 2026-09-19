import { TransactionType } from "@finance-tracker/shared/constants/transactions"

export interface Transaction {
  id: string
  date: string
  description: string
  subtitle?: string
  category: string
  type: TransactionType
  amount: number
}

export interface Metric {
  title: string
  value: string
  trend?: string
  trendValue?: string
  subtitle?: string
}

export interface CategorySpending {
  name: string
  amount: number
  percentage: number
  colorClass: string
}

export interface BudgetSnapshot {
  spent: number
  limit: number
  alerts: BudgetAlert[]
}

export interface BudgetAlert {
  title: string
  description: string
  status: "warning" | "success"
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "txn_1",
    date: "Oct 24",
    description: "Acme Corp Payroll",
    subtitle: "Direct Deposit #4829",
    category: "Salary",
    type: "credit",
    amount: 3710.0,
  },
  {
    id: "txn_2",
    date: "Oct 22",
    description: "Metro Properties Rent",
    subtitle: "Monthly Auto-draft",
    category: "Housing",
    type: "debit",
    amount: 1450.0,
  },
  {
    id: "txn_3",
    date: "Oct 20",
    description: "Whole Foods Market",
    subtitle: "Card ending in 4108",
    category: "Groceries",
    type: "debit",
    amount: 124.5,
  },
  {
    id: "txn_4",
    date: "Oct 18",
    description: "City Power & Electric",
    subtitle: "Online Payment",
    category: "Utilities",
    type: "debit",
    amount: 86.4,
  },
  {
    id: "txn_5",
    date: "Oct 15",
    description: "Stripe Transfer",
    subtitle: "Design Consultation Payout",
    category: "Consulting",
    type: "credit",
    amount: 650.0,
  },
]

export const MOCK_METRICS: Metric[] = [
  {
    title: "Total Balance",
    value: "$24,850.40",
    trend: "up",
    trendValue: "+4.2%",
    subtitle: "from last month",
  },
  {
    title: "Total Income",
    value: "+$7,420.00",
    trend: "down",
    subtitle: "2 deposits this month",
  },
  {
    title: "Total Expenses",
    value: "-$3,845.20",
    trend: "up",
    subtitle: "54% of monthly budget",
  },
  {
    title: "Net Cash Flow",
    value: "+$3,574.80",
    trendValue: "48.2% saved",
    subtitle: "positive trajectory",
  },
]

export const MOCK_CATEGORY_SPENDING: CategorySpending[] = [
  { name: "Housing", amount: 1450.0, percentage: 38, colorClass: "bg-primary" },
  { name: "Groceries", amount: 620.0, percentage: 16, colorClass: "bg-secondary" },
  { name: "Dining Out", amount: 340.0, percentage: 9, colorClass: "bg-error" },
  { name: "Transport", amount: 215.0, percentage: 6, colorClass: "bg-outline" },
  { name: "Entertainment", amount: 180.0, percentage: 5, colorClass: "bg-outline-variant" },
]

export const MOCK_BUDGET_SNAPSHOT: BudgetSnapshot = {
  spent: 3845.2,
  limit: 5000.0,
  alerts: [
    {
      title: "Dining Out Limit Alert",
      description: "92% used ($340 / $370 max limit)",
      status: "warning",
    },
    {
      title: "Groceries on Schedule",
      description: "62% used ($620 / $1,000 max limit)",
      status: "success",
    },
  ],
}

export const MOCK_CASH_FLOW = [
  { label: "Week 1 (Oct 1-7)", incomeHeight: "85%", expenseHeight: "42%", incomeTitle: "Week 1 Income: $3,710", expenseTitle: "Week 1 Expenses: $1,420" },
  { label: "Week 2 (Oct 8-14)", incomeHeight: "20%", expenseHeight: "60%", incomeTitle: "Week 2 Income: $450", expenseTitle: "Week 2 Expenses: $980" },
  { label: "Week 3 (Oct 15-21)", incomeHeight: "75%", expenseHeight: "38%", incomeTitle: "Week 3 Income: $3,260", expenseTitle: "Week 3 Expenses: $810" },
  { label: "Week 4 (Oct 22-28)", incomeHeight: "15%", expenseHeight: "32%", incomeTitle: "Week 4 Income: $0", expenseTitle: "Week 4 Expenses: $635" },
]
