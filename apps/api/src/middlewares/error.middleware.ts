import type { Request, Response, NextFunction } from "express"
import { DBERRORS } from "@finance-tracker/shared/errorCodes"

import { ApiResponse } from "../utils/api-response.ts"

function handleError(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = err.statusCode || 500
  let message = err.message || "Internal Server Error"
  let data = err.data || null

  if(err.message.includes(DBERRORS.DUPLICATE_EMAIL)) {
    message = DBERRORS.DUPLICATE_EMAIL
    statusCode = 409
  }

  if(err.message.includes(DBERRORS.DUPLICATE_USERNAME)) {
    message = DBERRORS.DUPLICATE_USERNAME
    statusCode = 409
  }

  res.status(statusCode).json(new ApiResponse(statusCode, data, message))
}

export { handleError }
