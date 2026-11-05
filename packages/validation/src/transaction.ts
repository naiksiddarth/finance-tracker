import z from "zod"
import { isValidObjectId } from "mongoose"
import { ERROR_CODES } from "@finance-tracker/shared/constants/errorCodes"
import { TransactionTypeValues } from "@finance-tracker/shared/constants/transactions"

export const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(TransactionTypeValues),
  date: z.iso.datetime({ offset: true }),
  category: z.string().refine((val) => isValidObjectId(val), {
    message: ERROR_CODES.INVALID_MONGOOSE_OBJECT_ID,
  }),
  description: z.string().optional(),
})

export type CreateTransaction = z.infer<typeof CreateTransactionSchema>

export const UpdateTransactionSchema = z.object({
  _id: z.string(),
  amount: z.number().positive().optional(),
  date: z.iso.datetime({ offset: true }).optional(),
  category: z
    .string()
    .refine((val) => isValidObjectId(val), {
      message: ERROR_CODES.INVALID_MONGOOSE_OBJECT_ID,
    })
    .optional(),
  description: z.string().optional(),
})

export type UpdateTransaction = z.infer<typeof UpdateTransactionSchema>
