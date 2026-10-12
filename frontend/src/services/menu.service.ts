
import type {
  CreateManualMenuInput,
  MenuResponse,
  MenusResponse,
  UpdateManualMenuInput,
} from '../types/menu'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function handleResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ?? 'Không thể xử lý dữ liệu thực đơn.',
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

export async function createManualMenu(
  input: CreateManualMenuInput,
): Promise<MenuResponse> {
  const response = await fetch(`${API_BASE_URL}/menus`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  return handleResponse<MenuResponse>(response)
}

export async function updateManualMenu(
  id: string,
  input: UpdateManualMenuInput,
): Promise<MenuResponse> {
  const response = await fetch(
    `${API_BASE_URL}/menus/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  )

  return handleResponse<MenuResponse>(response)
}

export async function deleteManualMenu(id: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/menus/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    const result = await response.json().catch(() => null)

    throw new Error(
      result?.message ?? 'Không thể xóa thực đơn.',
    )
  }
}
