
import type { Dish } from './dish'

export type RandomMode = 'meal' | 'single'

export type RandomMealType = 'rice' | 'one_dish' | 'auto'

export interface RandomDish extends Dish {
  meal_role: 'main' | 'vegetable' | 'soup' | 'one_dish' | 'side'
  category_cook_count: string
  cooked_recently: boolean
  allergen_warnings: string[]

}

export interface RandomRequest {
  mode: RandomMode
  meal_type?: RandomMealType
  category_id?: string
  dish_ids?: string[]
}

export interface RandomResult {
  mode: RandomMode
  mealType?: 'rice' | 'one_dish'
  rice?: boolean
  items: RandomDish[]
  message?: string
}
