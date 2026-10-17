import type { PaginatedResponse } from "./pagination"

export type MealRole =
  | 'main'
  | 'vegetable'
  | 'soup'
  | 'one_dish'
  | 'side'

export interface Dish {
  id: string
  name: string
  category_id: string
  category: string
  is_active: boolean
  meal_role: MealRole | null
}

export interface DishListResponse {
  data: Dish[]
  total: number
}

export interface DishFormData {
  name: string
  category_id: string
  meal_role: MealRole
}

export interface DishByIngredients {
  id: string
  name: string
  category_id: string
  category: string
  meal_role: 'main' | 'vegetable' | 'soup' | 'one_dish' | 'side'
  total_ingredients: number
  matched_count: number
  missing_count: number
  matched_ingredients: string[]
  missing_ingredients: string[]
  match_percentage: number
  can_cook_now: boolean
}

export interface DishByIngredientsResponse {
  data: DishByIngredients[]
  total: number
}

export interface PaginatedDishResponse
  extends PaginatedResponse<Dish> {}

export interface GetDishesPaginatedParams {
  page: number
  limit: number
  search?: string
  categoryId?: string
}
