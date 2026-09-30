import mongoose from "mongoose"
import { Metric } from "@finance-tracker/db/metrics"
import {
  calculateMetricForMonth,
  Transaction,
} from "@finance-tracker/db/transaction"
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

interface WeeklySummary {
  week: number
  income: number
  expense: number
  netCashFlow: number
}

function getWeekCount(startDate: Date, endDate: Date) {
  const dayCount =
    Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1

  return Math.ceil(dayCount / 7)
}

function normalizeWeeklySummary(
  startDate: Date,
  endDate: Date,
  summaries: WeeklySummary[] = []
) {
  const summaryByWeek = new Map(
    summaries.map((summary) => [summary.week, summary])
  )

  return Array.from(
    { length: getWeekCount(startDate, endDate) },
    (_, index) => {
      const week = index + 1
      const summary = summaryByWeek.get(week)

      return {
        week,
        label: `Week ${week}`,
        income: summary?.income ?? 0,
        expense: summary?.expense ?? 0,
        netCashFlow: summary?.netCashFlow ?? 0,
      }
    }
  )
}

async function getTotalBalance(userId: mongoose.Types.ObjectId) {
  const [balanceResult] = await Metric.aggregate<{ totalBalance: number }>([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        totalBalance: { $sum: "$netCashFlow" },
      },
    },
    { $project: { _id: 0, totalBalance: 1 } },
  ])

  return balanceResult?.totalBalance ?? 0
}

const getMetrics = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user!._id)
  const { startDate, endDate } = MetricsQuerySchema.parse(req.query)

  if (startDate && endDate) {
    const startAt = toUtcDate(startDate)
    const endAt = toUtcDate(endDate)

    if (isCompleteMonth(startAt, endAt)) {
      const storedMetric = await Metric.findOne({
        user: userId,
        month: startAt,
      }).lean()
      const metric =
        storedMetric ?? (await calculateMetricForMonth(userId, startAt))
      const totalBalance = await getTotalBalance(userId)
      const weeklySummary = normalizeWeeklySummary(
        startAt,
        endAt,
        metric?.weeklySummary
      )

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            income: metric?.income ?? 0,
            expense: metric?.expense ?? 0,
            netCashFlow: metric?.netCashFlow ?? 0,
            totalBalance,
            weeklySummary,
          },
          "Metrics fetched successfully"
        )
      )
    }

    const endExclusive = getNextDay(endAt)
    const [rangeResults, totalBalance] = await Promise.all([
      Transaction.aggregate<{
        _id: number
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
          $addFields: {
            week: {
              $add: [
                {
                  $floor: {
                    $divide: [
                      {
                        $dateDiff: {
                          startDate: startAt,
                          endDate: "$date",
                          unit: "day",
                          timezone: "UTC",
                        },
                      },
                      7,
                    ],
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
      ]),
      getTotalBalance(userId),
    ])
    const weeklySummary = normalizeWeeklySummary(
      startAt,
      endAt,
      rangeResults.map(({ _id, income, expense, netCashFlow }) => ({
        week: _id,
        income,
        expense,
        netCashFlow,
      }))
    )
    const rangeMetrics = weeklySummary.reduce(
      (totals, summary) => ({
        income: totals.income + summary.income,
        expense: totals.expense + summary.expense,
        netCashFlow: totals.netCashFlow + summary.netCashFlow,
      }),
      { income: 0, expense: 0, netCashFlow: 0 }
    )

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          income: rangeMetrics?.income ?? 0,
          expense: rangeMetrics?.expense ?? 0,
          netCashFlow: rangeMetrics?.netCashFlow ?? 0,
          totalBalance,
          weeklySummary,
        },
        "Metrics fetched successfully"
      )
    )
  }

  const currentDate = new Date()
  const currentMonth = new Date(
    Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1)
  )

  const storedMetric = await Metric.findOne({
    user: userId,
    month: currentMonth,
  }).lean()
  const currentMetric =
    storedMetric ?? (await calculateMetricForMonth(userId, currentMonth))
  const totalBalance = await getTotalBalance(userId)

  res.status(200).json(
    new ApiResponse(
      200,
      {
        income: currentMetric?.income ?? 0,
        expense: currentMetric?.expense ?? 0,
        netCashFlow: currentMetric?.netCashFlow ?? 0,
        totalBalance,
        weeklySummary: normalizeWeeklySummary(
          currentMonth,
          new Date(
            Date.UTC(
              currentMonth.getUTCFullYear(),
              currentMonth.getUTCMonth() + 1,
              0
            )
          ),
          currentMetric?.weeklySummary
        ),
      },
      "Metrics fetched successfully"
    )
  )
})

export { getMetrics }
