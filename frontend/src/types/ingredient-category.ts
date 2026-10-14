export interface IngredientCategory {
  id: string
  name: string
  created_at?: string
}

export interface IngredientCategoryListResponse {
  data: IngredientCategory[]
}
