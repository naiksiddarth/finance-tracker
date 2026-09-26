import mongoose from "mongoose"
import { Metric } from "@finance-tracker/db/metrics"
import { asyncHandler } from "../utils/async-handler.ts"
import { ApiResponse } from "../utils/api-response.ts"

const getMetrics = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user!._id)
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
