import { Router } from "express"

import {
  createTransaction,
  getTransactions,
  updateTransactions,
  deleteTransaction,
} from "../controllers/transaction.controller.ts"

import { verifyAccessToken } from "../middlewares/verifyJwt.middleware.ts"
import { validate } from "../validators/validator.ts"

import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
} from "@finance-tracker/validation/transaction"

const transactionRouter = Router()

transactionRouter.post(
  "/",
  verifyAccessToken,
  validate(CreateTransactionSchema),
  createTransaction
)

transactionRouter.get("/", verifyAccessToken, getTransactions)

transactionRouter.put(
  "/",
  verifyAccessToken,
  validate(UpdateTransactionSchema),
  updateTransactions
)

transactionRouter.delete("/", verifyAccessToken, deleteTransaction)


export { transactionRouter }
