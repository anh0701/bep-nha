import type {
  Dish,
  DishByIngredientsResponse,
  DishFormData,
  DishListResponse,
  GetDishesPaginatedParams,
  PaginatedDishResponse,
} from '../types/dish'
import type { DishIngredientListResponse } from '../types/dish-ingredient'

import type {
  RandomRequest,
  RandomResult,
} from '../types/random'

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

export async function deleteDish(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/dishes/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const result = await response.json().catch(() => null)

    throw new Error(
      result?.message ?? `Failed to delete dish: ${response.status}`,
    )
  }
}

export async function randomizeDishes(
  request: RandomRequest,
): Promise<RandomResult> {
  const response = await fetch(`${API_BASE_URL}/random`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(request),
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ?? `Failed to randomize dishes: ${response.status}`,
    )
  }

  if (!result?.data || !Array.isArray(result.data.items)) {
    throw new Error('Invalid response from random API')
  }

  return result.data as RandomResult
}

export async function getDishById(id: string): Promise<Dish> {
  const response = await fetch(`${API_BASE_URL}/dishes/${id}`)

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ?? `Failed to fetch dish: ${response.status}`,
    )
  }

  if (!result?.data) {
    throw new Error('Invalid response from dish detail API')
  }

  return result.data as Dish
}

export async function getDishIngredients(
  dishId: string,
): Promise<DishIngredientListResponse> {
  const response = await fetch(
    `${API_BASE_URL}/dishes/${dishId}/ingredients`,
  )

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ??
        `Không thể lấy nguyên liệu của món ăn (${response.status}).`,
    )
  }

  return result as DishIngredientListResponse
}

export async function getDishesByIngredients(
  ingredientIds: string[],
): Promise<DishByIngredientsResponse> {
  const params = new URLSearchParams({
    ids: ingredientIds.join(','),
  })

  const response = await fetch(
    `${API_BASE_URL}/by-ingredients?${params.toString()}`,
  )

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ??
        `Không thể tìm món theo nguyên liệu (${response.status}).`,
    )
  }

  if (!result || !Array.isArray(result.data)) {
    throw new Error('Dữ liệu trả về từ API tìm món không hợp lệ.')
  }

  return result as DishByIngredientsResponse
}

export async function getDishesPaginated({
  page,
  limit,
  search = '',
  categoryId,
}: GetDishesPaginatedParams): Promise<PaginatedDishResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (search.trim()) {
    params.set('search', search.trim())
  }

  if (categoryId && categoryId !== 'all') {
    params.set('categoryId', categoryId)
  }

  const response = await fetch(
    `${API_BASE_URL}/dishes?${params.toString()}`,
  )

  if (!response.ok) {
    throw new Error('Không thể tải danh sách món ăn')
  }

  return response.json() as Promise<PaginatedDishResponse>
}
