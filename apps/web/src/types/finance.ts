import type { TransactionType } from "@finance-tracker/shared/constants/transactions"

export interface Transaction {
  id: string
  date: string
  displayDate?: string
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
