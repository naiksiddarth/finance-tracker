import mongoose from "mongoose"

export interface ISession {
  userId: mongoose.Types.ObjectId
  refreshTokenHash: string
  createdAt: Date
  updatedAt: Date
}

export const SessionSchema = new mongoose.Schema<ISession>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: (process.env.REFRESH_TOKEN_EXPIRATION || "7d") as string,
    },
  },
  {
    timestamps: {
      updatedAt: true,
    },
  }
)

SessionSchema.index({ userId: 1, refreshTokenHash: 1 }, { unique: true })

export const SessionModel = mongoose.model<ISession>("Session", SessionSchema)
