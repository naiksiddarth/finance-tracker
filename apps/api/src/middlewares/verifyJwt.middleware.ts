import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"

import { asyncHandler } from "../utils/async-handler.ts"
import { AppError } from "../utils/api-errors.ts"
import { ERROR_CODES } from "@finance-tracker/shared/constants/errorCodes"
import type { AuthUserPayload } from "../types/express.d.ts"

export const verifyAccessToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const accessToken =
      req.body?.accessToken ||
      req.headers.authorization?.split(" ")[1] ||
      req.cookies?.accessToken

    if (!accessToken) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, "No Access Token Found")
    }

    const decodeToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET!
    )

    if (typeof decodeToken === "string") {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, "Invalid token payload")
    }

    req.user = decodeToken as AuthUserPayload
    next()
  }
)

export const verifyRefreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies?.refreshToken

    if (!refreshToken) {
      throw new AppError(
        401,
        ERROR_CODES.UNAUTHORIZED,
        "No Refresh Token Found"
      )
    }

    const decodeToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    )

    if (typeof decodeToken === "string") {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, "Invalid token payload")
    }

    req.user = decodeToken as AuthUserPayload
    next()
  }
)
