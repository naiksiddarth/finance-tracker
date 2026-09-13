export const TransactionType = {
  DEBIT: "debit",
  CREDIT: "credit",
} as const

export const TransactionTypeValues= Object.values(TransactionType)

export type TransactionType = typeof TransactionTypeValues[number]
