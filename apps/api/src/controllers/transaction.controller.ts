import mongoose from "mongoose"

import { asyncHandler } from "../utils/async-handler.ts"
import { ApiResponse } from "../utils/api-response.ts"
import { AppError } from "../utils/api-errors.ts"
import { ERROR_CODES } from "@finance-tracker/shared/constants/errorCodes"
import { Transaction, updateMetric } from "@finance-tracker/db/transaction"
import type { CreateTransaction } from "@finance-tracker/validation/transaction"
import { User } from "@finance-tracker/db/user"

const createTransaction = asyncHandler(async (req, res) => {
  const data: CreateTransaction = req.body

  let transaction: any = null

  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
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
      transaction = createdTransaction
      await updateMetric(transaction, 1, session)
    })
  } catch (error) {
    throw error
  } finally {
    session.endSession()
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

  let updatedTransaction: any = null
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
      updatedTransaction = await Transaction.findOneAndUpdate(
        {
          _id: _id,
          user: req.user?._id,
        },
        updateFields,
        { returnDocument: "after", session }
      )
      await updateMetric(updatedTransaction, 1, session)
    })
  } catch (error) {
    throw error
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
  let deletedTransaction: any = null
  try {
    await session.withTransaction(async () => {
      deletedTransaction =
        await Transaction.findOneAndDelete({_id: _id, user: req.user?._id}).session(session)
      if (!deletedTransaction) {
        throw new AppError(400, ERROR_CODES.NOT_FOUND, "Transaction not found")
      }
      await updateMetric(deletedTransaction, -1, session)
    })
  } catch (error) {
    throw error
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
