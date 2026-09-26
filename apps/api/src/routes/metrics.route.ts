import { Router } from "express"

import { getMetrics } from "../controllers/metrics.controller.ts"
import { verifyAccessToken } from "../middlewares/verifyJwt.middleware.ts"

const metricsRouter = Router()

metricsRouter.get("/", verifyAccessToken, getMetrics)

export { metricsRouter }
