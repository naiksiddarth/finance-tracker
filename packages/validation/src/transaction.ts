import z from "zod"

import { TransactionTypeValues } from "@finance-tracker/shared/constants/transactions"

export const CreateTransactionSchema = z.object({
  // user: z.string(),
  amount: z.number().positive(),
  type: z.enum(TransactionTypeValues),
})

export type CreateTransaction =
  z.infer<typeof CreateTransactionSchema>