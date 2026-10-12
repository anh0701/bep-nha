
import type { MenuResponse, MenusResponse } from '../types/menu'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function handleResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ?? 'Không thể tải dữ liệu thực đơn.',
    )
  }

  return result as T
}

export async function getSavedMenus(): Promise<MenusResponse> {
  const response = await fetch(`${API_BASE_URL}/menus`)
  return handleResponse<MenusResponse>(response)
}

export async function getSavedMenuById(
  id: string,
): Promise<MenuResponse> {
  const response = await fetch(
    `${API_BASE_URL}/menus/${encodeURIComponent(id)}`,
  )

  return handleResponse<MenuResponse>(response)
}
