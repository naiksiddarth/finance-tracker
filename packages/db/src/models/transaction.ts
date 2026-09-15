import mongoose from "mongoose"

import { TransactionTypeValues } from "@finance-tracker/shared/constants/transactions"
import type { TransactionType } from "@finance-tracker/shared/constants/transactions"

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

export const Transaction = mongoose.model("Transaction", TransactionSchema)
