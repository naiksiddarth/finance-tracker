import { Router } from "express"

import {
  createTransaction,
  getTransactions,
  updateTransactions,
  updateCurrency,
} from "../controllers/transaction.controller.ts"

import { verifyAccessToken } from "../middlewares/verifyJwt.middleware.ts"
import { validate } from "../validators/validator.ts"

import { CreateTransactionSchema, UpdateTransactionSchema } from "@finance-tracker/validation/transaction"

const transactionRouter = Router()

transactionRouter.post(
  "/",
  verifyAccessToken,
  validate(CreateTransactionSchema),
  createTransaction
)

transactionRouter.get("/", verifyAccessToken, getTransactions)

transactionRouter.put("/", verifyAccessToken, validate(UpdateTransactionSchema), updateTransactions)

transactionRouter.put("/currency", verifyAccessToken, updateCurrency)

export { transactionRouter }
