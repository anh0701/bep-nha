export interface Ingredient {
  id: string
  name: string
  ingredient_category_id: string
  ingredient_category_name: string
  default_unit_id: string
  default_unit: string
  is_active: boolean
  is_allergen: boolean
  created_at: Date
  updated_at: Date
}

export interface IngredientInput {
  name: string
  ingredient_category_id: string
  default_unit_id: string
  is_allergen?: boolean
}

export interface IngredientPaginationParams {
  page: number
  limit: number
  search?: string
  categoryId?: string
}

export interface PaginatedIngredients {
  data: Ingredient[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}
