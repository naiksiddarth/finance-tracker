import type { Request, Response, NextFunction } from "express"
import type { RequestHandler } from "express"


const asyncHandler = (requestHandler: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next)
  }
}

export { asyncHandler }
