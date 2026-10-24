import { asyncHandler } from "../utils/async-handler.ts"
import { ApiResponse } from "../utils/api-response.ts"
import { AppError } from "../utils/api-errors.ts"
import { ERROR_CODES } from "@finance-tracker/shared/constants/errorCodes"

import {User } from "@finance-tracker/db/user"

const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    if (!user) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, "User not found")
    }

    return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"))

})

const updateCurrency = asyncHandler(async (req, res) => {
  const { currency } = req.body

  if (!currency) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Currency is required"))
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { currency },
    { returnDocument: "after" }
  ).select("username email currency")

  res
    .status(200)
    .json(new ApiResponse(200, user, "Currency updated successfully"))
})
export { getUser, updateCurrency }