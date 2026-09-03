import type { JwtPayload } from "jsonwebtoken"

export interface AuthUserPayload extends JwtPayload {
  _id: string
  username: string
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload
    }
  }
}
