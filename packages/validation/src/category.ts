import z from "zod"
import {
  CategoryType,
  categoryTypeValues,
} from "@finance-tracker/shared/constants/category"

export const categorySchema = z.object({
  name: z.string().min(3, "Name is required"),
  description: z.string().optional(),
  type: z.enum(categoryTypeValues, {
    message: "Type is required",
  }),
})
