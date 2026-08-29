import express from "express"

const app = express()

app.get("/", (_, res) => {
  res.status(200).json({ msg: "hello" })
})

export { app }
