import z from "zod"

import { TransactionTypeValues } from "@finance-tracker/shared/constants/transactions"

export const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(TransactionTypeValues),
  date: z.iso.datetime({ offset: true }),
})

export type CreateTransaction = z.infer<typeof CreateTransactionSchema>

export const UpdateTransactionSchema = z.object({
  _id: z.string(),
  amount: z.number().positive().optional(),
  date: z.iso.datetime({ offset: true }).optional(),
})

export type UpdateTransaction = z.infer<typeof UpdateTransactionSchema>
