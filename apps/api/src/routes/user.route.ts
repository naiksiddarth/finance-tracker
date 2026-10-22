import { Router } from "express"

import { getUserHandler } from "../controllers/user.controller.ts"
import { verifyAccessToken } from "../middlewares/verifyJwt.middleware.ts"

const userRouter = Router()

userRouter.get("/", verifyAccessToken, getUserHandler)

export { userRouter }
