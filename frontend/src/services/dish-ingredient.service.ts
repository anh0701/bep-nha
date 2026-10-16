import type { DishIngredientInput, DishIngredientListResponse } from "../types/dish-ingredient"

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
