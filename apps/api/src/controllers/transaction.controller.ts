import { asyncHandler } from "../utils/async-handler.ts"
import { ApiResponse } from "../utils/api-response.ts"

import { Transaction } from "@finance-tracker/db/transaction"
import type { CreateTransaction } from "@finance-tracker/validation/transaction"
import { User } from "@finance-tracker/db/user"

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

const updateTransactions = asyncHandler(async (req, res) => {
  const { _id, amount, date } = req.body
  const updateFields: { amount?: number; date?: Date } = {}

  if (amount !== undefined) {
    updateFields.amount = amount
  }

  if (date !== undefined) {
    updateFields.date = new Date(date)
  }

  const updatedTransaction = await Transaction.findByIdAndUpdate(
    _id,
    updateFields,
    { new: true }
  )
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedTransaction,
        "Transaction Updated Succesfully"
      )
    )
})

const updateCurrency = asyncHandler(async (req, res) => {
  const { currency } = req.body

  if (!currency) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Currency is required"))
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { currency },
    { new: true }
  ).select("username email currency")

  res
    .status(200)
    .json(new ApiResponse(200, user, "Currency updated successfully"))
})

export {
  createTransaction,
  getTransactions,
  updateCurrency,
  updateTransactions,
}
