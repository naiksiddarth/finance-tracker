import type { Request, Response, NextFunction } from "express"
import mongoose from "mongoose"
import z from "zod"

import {
  ERROR_CODES,
  type ErrorCode,
} from "@finance-tracker/shared/constants/errorCodes"

import { ApiResponse } from "../utils/api-response.ts"
import { AppError } from "../utils/api-errors.ts"

function handleError(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = 500
  let code: ErrorCode = ERROR_CODES.INTERNAL_SERVER_ERROR
  let message = "Internal server error"
  let data: unknown = null

  /*
   * Application errors
   *
   * Errors that you intentionally throw from controllers/services.
   */
  if (err instanceof AppError) {
    statusCode = err.statusCode
    code = err.code
    message = err.message
    data = err.data
  }

  /*
   * Zod validation errors
   */
  else if (err instanceof z.ZodError) {
    statusCode = 400
    code = ERROR_CODES.VALIDATION_ERROR
    message = "Validation failed"

    data = err.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    }))
  }

  /*
   * MongoDB duplicate-key errors
   */
  else if (
    err instanceof mongoose.mongo.MongoServerError &&
    err.code === 11000
  ) {
    statusCode = 409
    code = ERROR_CODES.DUPLICATE
    message = "Resource already exists"

    const duplicateFields = Object.keys(err.keyValue ?? {})

    if (duplicateFields.includes("email")) {
      code = ERROR_CODES.DUPLICATE_EMAIL
      message = "Email is already registered"
    }

    if (duplicateFields.includes("username")) {
      code = ERROR_CODES.DUPLICATE_USERNAME
      message = "Username is already registered"
    }

    data = null
  }

  /*
   * Unknown/unexpected errors
   */
  else {
    console.error(err)
  }

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, data, message, code))
}

export { handleError }
