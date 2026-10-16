export interface Ingredient {
  id: string
  name: string
  ingredient_category_id: string
  ingredient_category_name: string
  default_unit_id: string
  default_unit: string
  is_active: boolean
  is_allergen: boolean
  created_at?: string
  updated_at?: string
}

export interface IngredientListResponse {
  data: Ingredient[]
}

export interface IngredientFormData {
  name: string
  ingredient_category_id: string
  default_unit_id: string
  is_allergen: boolean
}

export interface IngredientStatusInput {
  is_active: boolean
}
