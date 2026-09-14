import { Router } from "express"

import { createTransaction } from "../controllers/tansaction.controller.ts"
import { verifyAccessToken } from "../middlewares/verifyJwt.middleware.ts"
import { validate } from "../validators/validator.ts"

import { CreateTransactionSchema } from "@finance-tracker/validation/transaction"

const transactionRouter = Router()

transactionRouter.post(
  "/",
  validate(CreateTransactionSchema),
  verifyAccessToken,
  createTransaction
)

export { transactionRouter }
