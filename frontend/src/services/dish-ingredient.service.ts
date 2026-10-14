import type { IngredientRole } from "../types/dish-ingredient"

export interface DishIngredient {
  ingredient_id: string
  ingredient_name: string
  ingredient_category_id: string
  ingredient_category_name: string
  quantity_per_person: number
  unit: string
  ingredient_role: IngredientRole
  is_optional: boolean
  preparation_note: string | null
}

export interface DishIngredientInput {
  ingredient_id: string
  quantity_per_person: number
  unit: string
  ingredient_role: IngredientRole
  is_optional: boolean
  preparation_note: string | null
}

export interface DishIngredientListResponse {
  data: DishIngredient[]
  total: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function parseResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ?? `API request failed: ${response.status}`,
    )
  }

  return result as T
}

export async function getDishIngredients(
  dishId: string,
): Promise<DishIngredientListResponse> {
  const response = await fetch(
    `${API_BASE_URL}/dishes/${dishId}/ingredients`,
  )

  return parseResponse<DishIngredientListResponse>(response)
}

export async function setDishIngredients(
  dishId: string,
  ingredients: DishIngredientInput[],
): Promise<DishIngredientListResponse> {
  const response = await fetch(
    `${API_BASE_URL}/dishes/${dishId}/ingredients`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ingredients }),
    },
  )

  return parseResponse<DishIngredientListResponse>(response)
}
