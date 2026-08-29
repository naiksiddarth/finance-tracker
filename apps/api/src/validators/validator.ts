import type { NextFunction, Request, Response } from "express"
import type { ZodType } from "zod"

const validate =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body)
    next()
  }

export { validate }
