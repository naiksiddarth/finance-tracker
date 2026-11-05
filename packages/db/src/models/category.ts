import mongoose from "mongoose"

export interface ICategory {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  name: string
  isDefault: boolean
  description?: string
  createdAt: Date
  updatedAt: Date
}

export const CategorySchema = new mongoose.Schema<ICategory>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

CategorySchema.index(
  { userId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      userId: { $type: "objectId" },
    },
  }
)

CategorySchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDefault: true,
    },
  }
)

export const Category = mongoose.model<ICategory>("Category", CategorySchema)
