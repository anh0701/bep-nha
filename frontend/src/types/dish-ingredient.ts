export type IngredientRole = 'main' | 'minor'

export interface DishIngredient {
  ingredient_id: string
  ingredient_name: string
  ingredient_category_id: string
  ingredient_category_name: string
  quantity_per_person: number
  unit_id: string
  unit: string
  ingredient_role: IngredientRole
  is_optional: boolean
  preparation_note: string | null
  is_allergen: boolean
}

export interface DishIngredientInput {
  ingredient_id: string
  quantity_per_person: number
  unit_id: string
  ingredient_role: IngredientRole
  is_optional: boolean
  preparation_note: string | null
}

export interface DishIngredientListResponse {
  data: DishIngredient[]
  total: number
}