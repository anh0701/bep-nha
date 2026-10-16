import type { Unit, UnitListResponse } from '../types/unit'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getUnits(): Promise<Unit[]> {
  const response = await fetch(`${API_BASE_URL}/units`)
  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ?? `API request failed: ${response.status}`,
    )
  }

  return (result as UnitListResponse).data
}
