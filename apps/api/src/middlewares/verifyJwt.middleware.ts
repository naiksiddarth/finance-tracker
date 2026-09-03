import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"

import { asyncHandler } from "../utils/async-handler.ts"
import { ApiError } from "../utils/api-errors.ts"
import { DBERRORS } from "@finance-tracker/shared"
import type { AuthUserPayload } from "../types/express.d.ts"

export const verifyAccessToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const accessToken =
      req.body?.accessToken ||
      req.headers.authorization?.split(" ")[1] ||
      req.cookies?.accessToken

    if (!accessToken) {
      throw new ApiError(401, DBERRORS.UNAUTHORIZED, "No Access Token Found")
    }

    const decodeToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET!
    )

    if (typeof decodeToken === "string") {
      throw new ApiError(401, DBERRORS.UNAUTHORIZED, "Invalid token payload")
    }

    req.user = decodeToken as AuthUserPayload
    next()
  }
)

export const verifyRefreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken =
      req.body?.refreshToken ||
      req.headers.authorization?.split(" ")[1] ||
      req.cookies?.refreshToken

    if (!refreshToken) {
      throw new ApiError(401, DBERRORS.UNAUTHORIZED, "No Refresh Token Found")
    }

    const decodeToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    )

    if (typeof decodeToken === "string") {
      throw new ApiError(401, DBERRORS.UNAUTHORIZED, "Invalid token payload")
    }

    req.user = decodeToken as AuthUserPayload
    next()
  }
)
