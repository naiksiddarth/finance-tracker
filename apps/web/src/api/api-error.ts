import type { ErrorCode } from "@finance-tracker/shared/constants/errorCodes"

class ApiError extends Error {
  public statusCode: number
  public code: ErrorCode
  public message: string
  public data: unknown

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    data: unknown = null
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.message = message
    this.data = data
    this.name = "ApiError"
  }
}

export { ApiError }
