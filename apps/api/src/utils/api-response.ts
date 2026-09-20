class ApiResponse<T = unknown> {
  public statusCode: number
  public data: T | null
  public message: string
  public success: boolean
  public code?: string

  constructor(
    statusCode: number,
    data: T | null = null,
    message: string = "Success",
    code?: string,
  ) {
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400

    if (code) {
      this.code = code
    }
  }
}

export { ApiResponse }