import { Router } from "express"

import {
  createTransaction,
  getTransactions,
} from "../controllers/transaction.controller.ts"

import { verifyAccessToken } from "../middlewares/verifyJwt.middleware.ts"
import { validate } from "../validators/validator.ts"

import { CreateTransactionSchema } from "@finance-tracker/validation/transaction"

const transactionRouter = Router()

transactionRouter.post(
  "/",
  verifyAccessToken,
  validate(CreateTransactionSchema),
  createTransaction
)

transactionRouter.get("/", verifyAccessToken, getTransactions)

export { transactionRouter }
