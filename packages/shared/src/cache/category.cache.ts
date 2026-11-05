import { Category } from "../../../db/src/models/category.ts";

let defaultCategories: unknown[] = [];

export async function loadDefaultCategories() {
  defaultCategories = await Category.find({
    isDefault: true,
  }).lean();

  return defaultCategories;
}

export function getDefaultCategories() {
  return defaultCategories;
}