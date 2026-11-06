import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/api/client"
import type { Category } from "@/types/category"

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiRequest<{ data: Category[] }>("/category")
      return response.data
    },
  })
}
