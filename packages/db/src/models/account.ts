import mongoose from "mongoose"

export interface IAccount {
  _id: string
  userId: mongoose.Schema.Types.ObjectId
  name: string
  balance: number
  createdAt: Date
  updatedAt: Date
}

const AccountSchema = new mongoose.Schema<IAccount>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            index: true,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            index: true,
            required: true,
        },
        balance: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    { timestamps: true }
)

export const Account = mongoose.model<IAccount>("Account", AccountSchema)