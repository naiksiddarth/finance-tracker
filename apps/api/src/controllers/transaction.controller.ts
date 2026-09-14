import { asyncHandler } from "../utils/async-handler.ts"
import { ApiResponse } from "../utils/api-response.ts"

import { Transaction } from "@finance-tracker/db/models/transaction"
import type { CreateTransaction } from "@finance-tracker/validation/transaction"

const createTransaction = asyncHandler(async (req, res) => {
  const data: CreateTransaction = req.body
  const transaction = await Transaction.create({
    user: req.user?._id,
    amount: data.amount,
    type: data.type,
  })
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        transaction.toObject(),
        "Transaction created succesfully"
      )
    )
})

export { createTransaction }
