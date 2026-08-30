import mongoose, { Model } from "mongoose"
import bcrypt from "bcrypt"
import { DBERRORS } from "@finance-tracker/shared/errorCodes"

export interface IUser {
  username: string
  email: string
  password: string
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>
}

export type UserModel = Model<IUser, {}, IUserMethods>

export const UserSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>({
  username: {
    type: String,
    required: true,
    unique: [true, DBERRORS.DUPLICATE_USERNAME],
  },
  email: {
    type: String,
    required: true,
    unique: [true, DBERRORS.DUPLICATE_EMAIL],
  },
  password: {
    type: String,
    required: true,
  },
})

UserSchema.pre("save", async function() {
  if (!this.isModified("password")){return}
  this.password = await bcrypt.hash(this.password, 10)
})

UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password)
}

const User = mongoose.model<IUser, UserModel>("User", UserSchema)

export { User }

