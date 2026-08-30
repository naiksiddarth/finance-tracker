import { User } from "@finance-tracker/db"
import { asyncHandler } from "../utils/async-handler.ts"
import { ApiResponse } from "../utils/api-response.ts"

const registerHandler = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body
  const user = await User.create({
    username,
    email,
    password,
  })
  const userObject = user.toObject()
  const { password: _password, ...userWithoutPassword } = userObject

  const response = new ApiResponse(
    201,
    userWithoutPassword,
    "User registered successfully"
  )
  res.status(201).json(response)
})

const loginHandler = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body

  const user = await User.findOne({ $or: [{ email }, { username }] })

  if (!user) {
    throw new ApiResponse(404, "", "User not found")
  }
  const matchPassword = await user.comparePassword(password)

  if (!matchPassword) {
    throw new ApiResponse(401, "", "Invalid password")
  }
  const userObject = user.toObject()
  const { password: _password, ...userWithoutPassword } = userObject

  const response = new ApiResponse(
    200,
    userWithoutPassword,
    "User logged in successfully"
  )
  res.status(200).json(response)
})

export { registerHandler, loginHandler }
