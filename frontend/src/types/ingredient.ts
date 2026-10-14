
export interface Ingredient {
  id: string
  name: string
  ingredient_group: string | null
  default_unit: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface IngredientListResponse {
  data: Ingredient[]
  total: number
}

export interface IngredientFormData {
  name: string
  ingredient_group: string | null
  default_unit: string
}

export interface IngredientStatusInput {
  is_active: boolean
}
