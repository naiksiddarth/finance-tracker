import { Router } from "express"

import { getUser, updateCurrency } from "../controllers/user.controller.ts"
import { verifyAccessToken } from "../middlewares/verifyJwt.middleware.ts"

const userRouter = Router()

userRouter.get("/", verifyAccessToken, getUser)
userRouter.put("/currency", verifyAccessToken, updateCurrency)


export { userRouter }
