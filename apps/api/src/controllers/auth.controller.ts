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
  const createdUser = await User.findById(user._id).select("-password")
  const response = new ApiResponse(
    201,
    createdUser,
    "User registered successfully"
  )
  res.status(201).json(response)
})

export { registerHandler }
