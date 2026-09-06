import type { Request, Response, NextFunction } from "express"
import z from "zod"
import mongoose from "mongoose"
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

  if (err.name === "MongoServerError") {
    message = DBERRORS.DUPLICATE_EMAIL
    statusCode = 409
    data = { code: err.code, duplicate: err.keyValue }
    // data = err
  } else if (err instanceof z.ZodError) {
    console.log(err.issues)
    data = err.issues
    statusCode = 400
  }

  res.status(statusCode).json(new ApiResponse(statusCode, data, message))
}

export { handleError }
