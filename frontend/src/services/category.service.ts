
import type { CategoryListResponse } from '../types/category'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getCategories(): Promise<CategoryListResponse> {
  const response = await fetch(`${API_BASE_URL}/categories`)

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`)
  }

  return response.json() as Promise<CategoryListResponse>
}
