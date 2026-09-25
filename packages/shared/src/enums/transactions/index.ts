export const TransactionType = {
  DEBIT: "debit",
  CREDIT: "credit",
} as const

export const Currency = {
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  INR: "INR",
} as const

export const CurrencyValues = Object.values(Currency)

export type Currency = (typeof CurrencyValues)[number]

export const CurrencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
}

export const TransactionTypeValues = Object.values(TransactionType)

export type TransactionType = (typeof TransactionTypeValues)[number]
