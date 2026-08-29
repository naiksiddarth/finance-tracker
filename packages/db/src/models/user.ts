import mongoose from "mongoose"
import bcrypt from "bcrypt"

export const UserSchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: true,
  },
})

UserSchema.pre("save", async function() {
  if (!this.isModified("password")){return}
  this.password = await bcrypt.hash(this.password, 10)
})

const User = mongoose.model("User", UserSchema)

export { User }
