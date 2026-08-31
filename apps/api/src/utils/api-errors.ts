class ApiError extends Error {
  statusCode: number
  data: any
  message: string
  success: boolean
  constructor(
    statusCode: number,
    data: any,
    message: string = "Success",
    success: boolean = false
  ) {
    super(message)
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = success
  }
}

export { ApiError }
