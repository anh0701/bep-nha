import type {
  GetIngredientsPaginatedParams,
  Ingredient,
  IngredientFormData,
  IngredientListResponse,
  PaginatedIngredientResponse,
} from '../types/ingredient'

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

export async function getIngredients(
  search = '',
): Promise<IngredientListResponse> {
  const params = new URLSearchParams()

  if (search.trim()) {
    params.set('search', search.trim())
  }

  const query = params.toString()
  const url = `${API_BASE_URL}/ingredients${query ? `?${query}` : ''}`

  const response = await fetch(url)

  return parseResponse<IngredientListResponse>(response)
}

export async function createIngredient(
  formData: IngredientFormData,
): Promise<Ingredient> {
  const response = await fetch(`${API_BASE_URL}/ingredients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })

  const result = await parseResponse<{ data: Ingredient }>(response)

  return result.data
}

export async function updateIngredient(
  id: string,
  formData: IngredientFormData,
): Promise<Ingredient> {
  const response = await fetch(`${API_BASE_URL}/ingredients/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })

  const result = await parseResponse<{ data: Ingredient }>(response)

  return result.data
}

export async function updateIngredientStatus(
  id: string,
  isActive: boolean,
): Promise<Ingredient> {
  const response = await fetch(
    `${API_BASE_URL}/ingredients/${id}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_active: isActive }),
    },
  )

  const result = await parseResponse<{ data: Ingredient }>(response)

  return result.data
}

export async function getIngredientsPaginated({
  page,
  limit,
  search = '',
  categoryId,
}: GetIngredientsPaginatedParams): Promise<PaginatedIngredientResponse> {
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
    `${API_BASE_URL}/ingredients?${params.toString()}`,
  )

  if (!response.ok) {
    throw new Error('Không thể tải danh sách nguyên liệu')
  }

  return response.json() as Promise<PaginatedIngredientResponse>
}
