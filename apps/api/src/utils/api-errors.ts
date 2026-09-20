import type { ErrorCode } from "@finance-tracker/shared/constants/errorCodes"

class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    public message: string,
    public data: unknown = null
  ) {
    super(message)

    this.name = "ApiError"
  }
}

export { AppError }
