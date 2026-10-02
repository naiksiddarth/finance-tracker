import type { Request, Response, NextFunction } from "express"

const artificialDelay = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.ARTIFICIAL_DELAY !== "true") {
    return next()
  }

  const delay = 1000 + Math.random() * 2000

  setTimeout(next, delay)
}

export { artificialDelay }
