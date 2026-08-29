import express from "express"
import cors from "cors"

import { authRouter } from "./routes/auth.route.ts"

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

app.use("/auth", authRouter)

export { app }
