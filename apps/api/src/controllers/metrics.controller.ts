import mongoose from "mongoose"
import { Metric } from "@finance-tracker/db/metrics"
import { Transaction } from "@finance-tracker/db/transaction"
import { MetricsQuerySchema } from "@finance-tracker/validation/metrics"
import { asyncHandler } from "../utils/async-handler.ts"
import { ApiResponse } from "../utils/api-response.ts"

function toUtcDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`)
}

function getNextDay(date: Date) {
  const nextDay = new Date(date)
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)
  return nextDay
}

function isCompleteMonth(startDate: Date, endDate: Date) {
  return (
    startDate.getUTCDate() === 1 &&
    endDate.getUTCFullYear() === startDate.getUTCFullYear() &&
    endDate.getUTCMonth() === startDate.getUTCMonth() &&
    endDate.getUTCDate() ===
      new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0)
      ).getUTCDate()
  )
}

const getMetrics = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user!._id)
  const { startDate, endDate } = MetricsQuerySchema.parse(req.query)

  if (startDate && endDate) {
    const startAt = toUtcDate(startDate)
    const endAt = toUtcDate(endDate)

    if (isCompleteMonth(startAt, endAt)) {
      const metric = await Metric.findOne({
        user: userId,
        month: startAt,
      }).lean()

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            income: metric?.income ?? 0,
            expense: metric?.expense ?? 0,
            netCashFlow: metric?.netCashFlow ?? 0,
            totalBalance: metric?.netCashFlow ?? 0,
          },
          "Metrics fetched successfully"
        )
      )
    }

    const endExclusive = getNextDay(endAt)
    const [rangeMetrics] = await Transaction.aggregate<{
      income: number
      expense: number
      netCashFlow: number
    }>([
      {
        $match: {
          user: userId,
          date: { $gte: startAt, $lt: endExclusive },
        },
      },
      {
        $group: {
          _id: null,
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
      { $project: { _id: 0, income: 1, expense: 1, netCashFlow: 1 } },
    ])

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          income: rangeMetrics?.income ?? 0,
          expense: rangeMetrics?.expense ?? 0,
          netCashFlow: rangeMetrics?.netCashFlow ?? 0,
          totalBalance: rangeMetrics?.netCashFlow ?? 0,
        },
        "Metrics fetched successfully"
      )
    )
  }

  const currentDate = new Date()
  const currentMonth = new Date(
    Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1)
  )

  const [currentMetric, balanceResult] = await Promise.all([
    Metric.findOne({ user: userId, month: currentMonth }).lean(),
    Metric.aggregate<{ totalBalance: number }>([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$netCashFlow" },
        },
      },
      { $project: { _id: 0, totalBalance: 1 } },
    ]),
  ])

  res.status(200).json(
    new ApiResponse(
      200,
      {
        income: currentMetric?.income ?? 0,
        expense: currentMetric?.expense ?? 0,
        netCashFlow: currentMetric?.netCashFlow ?? 0,
        totalBalance: balanceResult[0]?.totalBalance ?? 0,
      },
      "Metrics fetched successfully"
    )
  )
})

export { getMetrics }
