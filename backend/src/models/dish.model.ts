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

export interface DishPaginationParams {
  page: number
  limit: number
  search: string
  categoryId?: string
}

export interface PaginatedDishes {
  data: Dish[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export interface RandomDishCandidate extends Dish {
  meal_role: 'main' | 'vegetable' | 'soup' | 'one_dish' | 'side'
  category_cook_count: string
  cooked_recently: boolean
  allergen_warnings: string[]
}

export interface IngredientMatchDish {
  id: string
  name: string
  category_id: string
  category: string
  meal_role: 'main' | 'vegetable' | 'soup' | 'one_dish' | 'side' | null
  matched_count: number
  total_ingredients: number
  missing_count: number
  matched_ingredients: string[]
  missing_ingredients: string[]
  match_percentage: number
  can_cook_now: boolean
}