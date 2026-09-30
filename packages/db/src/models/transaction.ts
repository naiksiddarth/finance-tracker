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
  const week = Math.floor((transaction.date.getUTCDate() - 1) / 7) + 1
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
          weeklySummary: {
            $let: {
              vars: {
                summaries: { $ifNull: ["$weeklySummary", []] },
              },
              in: {
                $cond: [
                  { $in: [week, "$$summaries.week"] },
                  {
                    $map: {
                      input: "$$summaries",
                      as: "summary",
                      in: {
                        $cond: [
                          { $eq: ["$$summary.week", week] },
                          {
                            week,
                            income: { $add: ["$$summary.income", income] },
                            expense: { $add: ["$$summary.expense", expense] },
                            netCashFlow: {
                              $add: ["$$summary.netCashFlow", income - expense],
                            },
                          },
                          "$$summary",
                        ],
                      },
                    },
                  },
                  multiplier > 0
                    ? {
                        $concatArrays: [
                          "$$summaries",
                          [
                            {
                              week,
                              income,
                              expense,
                              netCashFlow: income - expense,
                            },
                          ],
                        ],
                      }
                    : "$$summaries",
                ],
              },
            },
          },
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

export async function calculateMetricForMonth(
  userId: mongoose.Types.ObjectId,
  month: Date
) {
  const nextMonth = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)
  )
  const weeklyResults = await Transaction.aggregate<{
    _id: number
    income: number
    expense: number
    netCashFlow: number
  }>([
    {
      $match: {
        user: userId,
        date: { $gte: month, $lt: nextMonth },
      },
    },
    {
      $addFields: {
        week: {
          $add: [
            {
              $floor: {
                $divide: [{ $subtract: ["$date", month] }, 86_400_000 * 7],
              },
            },
            1,
          ],
        },
      },
    },
    {
      $group: {
        _id: "$week",
        income: {
          $sum: {
            $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0],
          },
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0],
          },
        },
        netCashFlow: {
          $sum: {
            $cond: [
              { $eq: ["$type", "credit"] },
              "$amount",
              { $multiply: ["$amount", -1] },
            ],
          },
        },
      },
    },
  ])

  const weeklySummary = weeklyResults.map(
    ({ _id: week, income, expense, netCashFlow }) => ({
      week,
      income,
      expense,
      netCashFlow,
    })
  )
  const totals = weeklySummary.reduce(
    (result, summary) => ({
      income: result.income + summary.income,
      expense: result.expense + summary.expense,
      netCashFlow: result.netCashFlow + summary.netCashFlow,
    }),
    { income: 0, expense: 0, netCashFlow: 0 }
  )

  return Metric.findOneAndUpdate(
    { user: userId, month },
    {
      $set: {
        user: userId,
        month,
        ...totals,
        weeklySummary,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
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
