import type {
  IngredientCategoryListResponse,
} from '../types/ingredient-category'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getIngredientCategories(): Promise<IngredientCategoryListResponse> {
  const response = await fetch(`${API_BASE_URL}/ingredient-categories`)

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ?? `API request failed: ${response.status}`,
    )
  }

  return result as IngredientCategoryListResponse
}
