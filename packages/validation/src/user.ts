import z from "zod"
import { ERROR_CODES } from "@finance-tracker/shared/constants/errorCodes"
import { CurrencyValues } from "@finance-tracker/shared/constants/transactions"

export const updateCurrencySchema = z.object({
  currency: z.enum(CurrencyValues),
})
