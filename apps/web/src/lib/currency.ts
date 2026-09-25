import type { Currency } from "@finance-tracker/shared/constants/transactions"

export function formatCurrency(amount: number, currency: Currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}
