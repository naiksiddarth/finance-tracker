import { Router } from "express"
import { registerHandler } from "../controllers/auth.controller.ts"
import { registerSchema, loginSchema } from "@finance-tracker/validation"
import { validate } from "../validators/validator.ts"

const authRouter = Router()

authRouter.post("/register", validate(registerSchema), registerHandler)

export {authRouter}
