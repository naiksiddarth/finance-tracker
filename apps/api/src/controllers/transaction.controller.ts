import mongoose from "mongoose"

import { asyncHandler } from "../utils/async-handler.ts"
import { ApiResponse } from "../utils/api-response.ts"
import { AppError } from "../utils/api-errors.ts"
import { ERROR_CODES } from "@finance-tracker/shared/constants/errorCodes"
import {
  Transaction,
  updateMetric,
  type ITransaction,
} from "@finance-tracker/db/transaction"
import type { CreateTransaction } from "@finance-tracker/validation/transaction"

type TransactionDocument = mongoose.HydratedDocument<ITransaction>

const createTransaction = asyncHandler(async (req, res) => {
  const data: CreateTransaction = req.body

  let transaction: TransactionDocument | undefined

  const session = await mongoose.startSession()
  try {
    transaction = await session.withTransaction(async () => {
      const [createdTransaction] = await Transaction.create(
        [
          {
            user: req.user?._id,
            amount: data.amount,
            type: data.type,
            date: new Date(data.date),
          },
        ],
        { session }
      )
      if (!createdTransaction) {
        throw new AppError(
          500,
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          "Transaction could not be created"
        )
      }
      await updateMetric(createdTransaction, 1, session)
      return createdTransaction
    })
  } finally {
    session.endSession()
  }

  if (!transaction) {
    throw new AppError(
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Transaction could not be created"
    )
  }

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

  let updatedTransaction: TransactionDocument | null = null
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async (session) => {
      const previousTransaction = await Transaction.findOne({
        _id: _id,
        user: req.user?._id,
      }).session(session)

      if (!previousTransaction) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, "Transaction not found")
      }

      await updateMetric(previousTransaction, -1, session)
      const nextTransaction = await Transaction.findOneAndUpdate(
        {
          _id: _id,
          user: req.user?._id,
        },
        updateFields,
        { returnDocument: "after", session }
      )
      if (!nextTransaction) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, "Transaction not found")
      }
      updatedTransaction = nextTransaction
      await updateMetric(updatedTransaction, 1, session)
    })
  } finally {
    session.endSession()
  }
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

const deleteTransaction = asyncHandler(async (req, res) => {
  const { _id } = req.body
  if (!_id) {
    throw new AppError(400, ERROR_CODES.BAD_REQUEST, "Transaction id missing")
  }
  const session = await mongoose.startSession()
  let deletedTransaction: TransactionDocument | null = null
  try {
    await session.withTransaction(async () => {
      const removedTransaction = await Transaction.findOneAndDelete({
        _id: _id,
        user: req.user?._id,
      }).session(session)
      if (!removedTransaction) {
        throw new AppError(400, ERROR_CODES.NOT_FOUND, "Transaction not found")
      }
      deletedTransaction = removedTransaction
      await updateMetric(removedTransaction, -1, session)
    })
  } finally {
    session.endSession()
  }

  res
    .status(200)
    .json(new ApiResponse(200, deletedTransaction, "Transaction deleted"))
})

export {
  createTransaction,
  getTransactions,
  updateTransactions,
  deleteTransaction,
}
