import { asyncHandler } from "../utils/async-handler.ts"
import { ApiResponse } from "../utils/api-response.ts"
import { AppError } from "../utils/api-errors.ts"
import { ERROR_CODES } from "@finance-tracker/shared/constants/errorCodes"

import {User } from "@finance-tracker/db/user"

const getUserHandler = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    if (!user) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, "User not found")
    }

    return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"))

})

export { getUserHandler }