import { ApiResponse } from "../utils/api-response.ts"
import { AppError } from "../utils/api-errors.ts"
import { asyncHandler } from "../utils/async-handler.ts"
import { ERROR_CODES } from "@finance-tracker/shared/constants/errorCodes"
import { Category } from "@finance-tracker/db/category"
import { getDefaultCategories } from "@finance-tracker/shared/cache/category"

const getCategories = asyncHandler(async (req, res) => {
  const defaultCategories = getDefaultCategories()

  const userDefinedCategories = await Category.find({
    userId: req.user?._id,
  }).lean()

  if (!userDefinedCategories) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, "Categories not found")
  }

  return res.json(
    new ApiResponse(
      200,
      { defaultCategories, userDefinedCategories },
      "Categories fetched successfully"
    )
  )
})

const createCategory = asyncHandler(async (req, res) => {
  const userId = req.user?._id
  const { name, description, type } = req.body

  const category = await Category.create({
    userId: userId,
    name,
    description,
    type,
  })

  return res.json(
    new ApiResponse(201, category, "Category created successfully")
  )
})

export { getCategories, createCategory }
