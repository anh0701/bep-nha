import type {
  Dish,
  DishFormData,
  DishListResponse,
} from '../types/dish'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getDishes(): Promise<DishListResponse> {
  const response = await fetch(`${API_BASE_URL}/dishes`)

  if (!response.ok) {
    throw new Error(`Failed to fetch dishes: ${response.status}`)
  }

  return response.json() as Promise<DishListResponse>
}

export async function createDish(
  formData: DishFormData,
): Promise<Dish> {
  const response = await fetch(`${API_BASE_URL}/dishes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ?? `Failed to create dish: ${response.status}`,
    )
  }

  return result.data as Dish
}

export async function updateDish(
  id: string,
  formData: DishFormData,
): Promise<Dish> {
  const response = await fetch(`${API_BASE_URL}/dishes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ?? `Failed to update dish: ${response.status}`,
    )
  }

  return result.data as Dish
}
