import { categorySchema } from "@finance-tracker/validation/category"
import { validate } from "../validators/validator.ts"
import { verifyAccessToken } from "../middlewares/verifyJwt.middleware.ts"
import {
  createCategory,
  getCategories,
} from "../controllers/category.controller.ts"
import { Router } from "express"

const categoryRouter = Router()

categoryRouter.get("/", verifyAccessToken, getCategories)
categoryRouter.post(
  "/",
  verifyAccessToken,
  validate(categorySchema),
  createCategory
)
export { categoryRouter }
