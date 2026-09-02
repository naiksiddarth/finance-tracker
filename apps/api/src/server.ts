import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

import { authRouter } from "./routes/auth.route.ts"
import { handleError } from "./middlewares/error.middleware.ts"

const app = express()

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
)
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/auth", authRouter)

app.use(handleError)

export { app }
