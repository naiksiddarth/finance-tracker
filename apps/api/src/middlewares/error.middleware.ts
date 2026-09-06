import type { Request, Response, NextFunction } from "express"
import z from "zod"

import { DBERRORS } from "@finance-tracker/shared/constants/errorCodes"
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

  if (err.message.includes(DBERRORS.DUPLICATE_EMAIL)) {
    message = DBERRORS.DUPLICATE_EMAIL
    statusCode = 409
  } else if (err.message.includes(DBERRORS.DUPLICATE_USERNAME)) {
    message = DBERRORS.DUPLICATE_USERNAME
    statusCode = 409
  } else if (err instanceof z.ZodError) {
    console.log(err.issues)
    data = err.issues
    statusCode = 400
  }

  res.status(statusCode).json(new ApiResponse(statusCode, data, message))
}

export { handleError }
