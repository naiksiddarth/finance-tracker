import mongoose, { Model } from "mongoose"
import bcrypt from "bcrypt"
import jwt, { type SignOptions } from "jsonwebtoken"

import {
  Currency,
  CurrencyValues,
} from "@finance-tracker/shared/constants/transactions"

export interface IUser {
  _id: string
  username: string
  name: string
  email: string
  currency: Currency
  password: string
  profilePicture: string
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>
  generateRefreshToken(): string
  generateAccessToken(): string
}

export type UserModel = Model<IUser, {}, IUserMethods>

export const UserSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
  },
  profilePicture: {
    type: String,
    default: "default-profile-picture.png",
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  currency: {
    type: String,
    enum: CurrencyValues,
    default: "USD",
  },
  password: {
    type: String,
    required: true,
  },
})

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return
  }
  this.password = await bcrypt.hash(this.password, 10)
})

UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password)
}

UserSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    { _id: this._id, username: this.username, email: this.email },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: (process.env.ACCESS_TOKEN_EXPIRATION ||
        "15m") as SignOptions["expiresIn"],
    }
  )
}

UserSchema.methods.generateRefreshToken = function (): string {
  const refreshToken = jwt.sign(
    { _id: this._id, username: this.username, email: this.email },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: (process.env.REFRESH_TOKEN_EXPIRATION ||
        "7d") as SignOptions["expiresIn"],
    }
  )
  return refreshToken
}

const User = mongoose.model<IUser, UserModel>("User", UserSchema)

export { User }
