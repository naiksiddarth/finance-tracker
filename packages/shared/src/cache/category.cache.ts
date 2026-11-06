import { Category, type ICategory } from "@finance-tracker/db/category"

let defaultCategories: ICategory[] = []

export async function loadDefaultCategories() {
  defaultCategories = await Category.find({
    isDefault: true,
  }).lean()

  return defaultCategories
}

export function getDefaultCategories() {
  return defaultCategories
}
