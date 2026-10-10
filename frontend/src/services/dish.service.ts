
import type { DishListResponse } from '../types/dish'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getDishes(): Promise<DishListResponse> {
  const response = await fetch(`${API_BASE_URL}/dishes`)

  if (!response.ok) {
    throw new Error(`Failed to fetch dishes: ${response.status}`)
  }

  return response.json() as Promise<DishListResponse>
}
