import mongoose from "mongoose"

import { TransactionTypeValues } from "@finance-tracker/shared/constants/transactions"
import type { TransactionType } from "@finance-tracker/shared/constants/transactions"
import { Metric } from "./metrics.ts"

export interface ITransaction {
  user: mongoose.Types.ObjectId
  amount: number
  type: TransactionType
  date: Date
}

const TransactionSchema = new mongoose.Schema<ITransaction>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: TransactionTypeValues,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const transactionsBeforeUpdate = new WeakMap<object, ITransaction>()

async function updateMetric(
  transaction: ITransaction,
  multiplier = 1
): Promise<void> {
  const month = new Date(
    Date.UTC(
      transaction.date.getUTCFullYear(),
      transaction.date.getUTCMonth(),
      1
    )
  )
  const income =
    transaction.type === "credit" ? transaction.amount * multiplier : 0
  const expense =
    transaction.type === "debit" ? transaction.amount * multiplier : 0

  await Metric.findOneAndUpdate(
    { user: transaction.user, month },
    [
      {
        $set: {
          user: transaction.user,
          month,
          income: { $add: [{ $ifNull: ["$income", 0] }, income] },
          expense: { $add: [{ $ifNull: ["$expense", 0] }, expense] },
        },
      },
      {
        $set: {
          netCashFlow: { $subtract: ["$income", "$expense"] },
        },
      },
    ],
    { upsert: multiplier > 0, new: true, updatePipeline: true }
  )
}

TransactionSchema.post("save", async function (transaction) {
  await updateMetric(transaction)
})

TransactionSchema.pre("findOneAndUpdate", async function () {
  const transaction = await this.model.findOne(this.getQuery()).lean()

  if (transaction) {
    transactionsBeforeUpdate.set(this, transaction as ITransaction)
  }
})

TransactionSchema.post("findOneAndUpdate", async function (transaction) {
  const previousTransaction = transactionsBeforeUpdate.get(this)
  transactionsBeforeUpdate.delete(this)

  if (previousTransaction) {
    await updateMetric(previousTransaction, -1)
  }

  if (transaction) {
    await updateMetric(transaction, 1)
  }
})

TransactionSchema.post("findOneAndDelete", async function (transaction) {
  if (transaction) {
    await updateMetric(transaction, -1)
  }
})

export const Transaction = mongoose.model("Transaction", TransactionSchema)
