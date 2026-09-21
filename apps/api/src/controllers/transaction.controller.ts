import { asyncHandler } from "../utils/async-handler.ts"
import { ApiResponse } from "../utils/api-response.ts"

import { Transaction } from "@finance-tracker/db/transaction"
import type { CreateTransaction } from "@finance-tracker/validation/transaction"

const createTransaction = asyncHandler(async (req, res) => {
  const data: CreateTransaction = req.body

  const transaction = await Transaction.create({
    user: req.user?._id,
    amount: data.amount,
    type: data.type,
    date: new Date(data.date),
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

const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user?._id }).sort({
    date: -1,
  })
  res
    .status(200)
    .json(new ApiResponse(200, transactions, "Transactions fetch succesfull"))
})

export { createTransaction, getTransactions }
