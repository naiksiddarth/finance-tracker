import "dotenv/config"
import { app } from "./server.js"
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI
const PORT = process.env.PORT

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set. Add it to apps/api/.env")
}
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB")
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
  })
  .catch((err) => console.error("MongoDB connection error:", err))
