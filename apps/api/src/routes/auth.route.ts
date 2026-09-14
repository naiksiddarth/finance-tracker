import { Router } from "express"

import {
  registerHandler,
  loginHandler,
  refreshHandler,
} from "../controllers/auth.controller.ts"

import { registerSchema, loginSchema } from "@finance-tracker/validation/auth"
import { validate } from "../validators/validator.ts"
import { verifyRefreshToken } from "../middlewares/verifyJwt.middleware.ts"

const authRouter = Router()

authRouter.post("/register", validate(registerSchema), registerHandler)
authRouter.post("/login", validate(loginSchema), loginHandler)
authRouter.post("/refresh", verifyRefreshToken, refreshHandler)

export { authRouter }
