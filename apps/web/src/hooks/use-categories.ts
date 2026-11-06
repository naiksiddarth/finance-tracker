import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/api/client"
import type { Category } from "@/types/category"

interface CategoriesResponse {
  defaultCategories: Category[]
  userDefinedCategories: Category[]
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiRequest<{ data: CategoriesResponse }>(
        "/category"
      )
      return [
        ...response.data.defaultCategories,
        ...response.data.userDefinedCategories,
      ]
    },
  })
}
