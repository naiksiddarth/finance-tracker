import { Router } from "express"

import { getUser, updateCurrency } from "../controllers/user.controller.ts"
import { verifyAccessToken } from "../middlewares/verifyJwt.middleware.ts"
import { validate } from "../validators/validator.ts"
import { updateCurrencySchema } from "@finance-tracker/validation/user"

const userRouter = Router()

userRouter.get("/", verifyAccessToken, getUser)
userRouter.put("/currency", verifyAccessToken, validate(updateCurrencySchema), updateCurrency)


export { userRouter }
