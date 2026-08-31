import { Router } from "express"

import {
  registerHandler,
  loginHandler,
} from "../controllers/auth.controller.ts"
import { registerSchema, loginSchema } from "@finance-tracker/validation"
import { validate } from "../validators/validator.ts"

const authRouter = Router()

authRouter.post("/register", validate(registerSchema), registerHandler)
authRouter.post("/login", validate(loginSchema), loginHandler)

export { authRouter }
