import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

import { authRouter } from "./routes/auth.route.ts"
import { transactionRouter } from "./routes/transaction.route.ts"
import { metricsRouter } from "./routes/metrics.route.ts"
import { userRouter } from "./routes/user.route.ts"

import { handleError } from "./middlewares/error.middleware.ts"
import { artificialDelay } from "./middlewares/artificial-delay.middleware.ts"

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
)
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use("/public", express.static("public"))
app.use(
  "/uploads",
  express.static("uploads", { maxAge: "1y", immutable: true })
)
app.use(cookieParser())

app.use(artificialDelay)
app.use("/api/auth", authRouter)
app.use("/api/transaction", transactionRouter)
app.use("/api/metrics", metricsRouter)
app.use("/api/user", userRouter)

app.use(handleError)

export { app }
