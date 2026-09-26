import mongoose from "mongoose"

interface IMetricSchema {
  user: mongoose.Types.ObjectId
  month: Date
  income: number
  expense: number
  netCashFlow: number
}

const MetricSchema = new mongoose.Schema<IMetricSchema>({
  user: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  month: {
    type: Date,
    required: true,
  },
  income: {
    type: Number,
    required: true,
  },
  expense: {
    type: Number,
    required: true,
  },
  netCashFlow: {
    type: Number,
    required: true,
  },
})

MetricSchema.index({ user: 1, month: 1 }, { unique: true })

const Metric = mongoose.model("Metric", MetricSchema)

export { Metric }
