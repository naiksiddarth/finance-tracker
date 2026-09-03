import mongoose, { Model } from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export interface IUser {
  _id: string
  username: string
  email: string
  password: string
  refreshToken: string
  comparePassword(): Promise<boolean>
  generateRefreshToken(): Promise<string>
  generateAccessToken(): Promise<string>
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>
}

export type UserModel = Model<IUser, {}, IUserMethods>

export const UserSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  refreshToken: {
    type: String,
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

UserSchema.methods.generateAccessToken = async function (): Promise<string> {
  return jwt.sign(
    { _id: this._id, username: this.username, email: this.email },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: "15m" }
  )
}

UserSchema.methods.generateRefreshToken = async function (): Promise<string> {
  const refreshToken = jwt.sign(
    { _id: this._id, username: this.username, email: this.email },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "7d" }
  )
  this.refreshToken = refreshToken
  await this.save()
  return refreshToken
}

const User = mongoose.model<IUser, UserModel>("User", UserSchema)

export { User }
