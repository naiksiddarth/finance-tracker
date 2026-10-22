import mongoose from "mongoose"

export interface ICategory {
  _id: mongoose.Schema.Types.ObjectId
  userId: mongoose.Schema.Types.ObjectId
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new mongoose.Schema<ICategory>(
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
    description: {
      type: String,
    },
  },
  { timestamps: true }
)

export const Category = mongoose.model<ICategory>("Category", CategorySchema)
