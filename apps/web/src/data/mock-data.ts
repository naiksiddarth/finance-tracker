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
  value: number
  trend?: "up" | "down" | "neutral"
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
    value: 24850.4,
    trend: "up",
    trendValue: "+4.2%",
    subtitle: "from last month",
  },
  {
    title: "Total Income",
    value: 7420.0,
    trend: "down",
    subtitle: "2 deposits this month",
  },
  {
    title: "Total Expenses",
    value: 3845.2,
    trend: "up",
    subtitle: "54% of monthly budget",
  },
  {
    title: "Net Cash Flow",
    value: 3574.8,
    trendValue: "48.2% saved",
    subtitle: "positive trajectory",
  },
]

export const MOCK_CATEGORY_SPENDING: CategorySpending[] = [
  { name: "Housing", amount: 1450.0, percentage: 38, colorClass: "bg-primary" },
  {
    name: "Groceries",
    amount: 620.0,
    percentage: 16,
    colorClass: "bg-primary",
  },
  {
    name: "Dining Out",
    amount: 340.0,
    percentage: 9,
    colorClass: "bg-primary",
  },
  { name: "Transport", amount: 215.0, percentage: 6, colorClass: "bg-primary" },
  {
    name: "Entertainment",
    amount: 180.0,
    percentage: 5,
    colorClass: "bg-primary",
  },
]

export const MOCK_BUDGET_SNAPSHOT: BudgetSnapshot = {
  spent: 3845.2,
  limit: 5000.0,
  alerts: [
    {
      title: "Dining Out Limit Alert",
      description: "92% used (340 / 370 max limit)",
      status: "warning",
    },
    {
      title: "Groceries on Schedule",
      description: "62% used (620 / 1,000 max limit)",
      status: "success",
    },
  ],
}

export const MOCK_CASH_FLOW = [
  {
    label: "Week 1 (Oct 1-7)",
    incomeHeight: "85%",
    expenseHeight: "42%",
    incomeAmount: 3710,
    expenseAmount: 1420,
  },
  {
    label: "Week 2 (Oct 8-14)",
    incomeHeight: "20%",
    expenseHeight: "60%",
    incomeAmount: 450,
    expenseAmount: 980,
  },
  {
    label: "Week 3 (Oct 15-21)",
    incomeHeight: "75%",
    expenseHeight: "38%",
    incomeAmount: 3260,
    expenseAmount: 810,
  },
  {
    label: "Week 4 (Oct 22-28)",
    incomeHeight: "15%",
    expenseHeight: "32%",
    incomeAmount: 0,
    expenseAmount: 635,
  },
]
