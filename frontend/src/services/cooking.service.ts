import type {
  CookingCalendarDay,
  CookingSession,
  CreateCookingSessionInput,
} from '../types/cooking'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getCookingCalendar(
  month: string,
): Promise<CookingCalendarDay[]> {
  const response = await fetch(
    `${API_BASE_URL}/cooking-sessions/calendar?month=${encodeURIComponent(month)}`,
  )

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ?? `Failed to fetch cooking calendar: ${response.status}`,
    )
  }

  return result.data as CookingCalendarDay[]
}

export async function getCookingSessionsByDate(
  date: string,
): Promise<CookingSession[]> {
  const response = await fetch(
    `${API_BASE_URL}/cooking-sessions/by-date?date=${encodeURIComponent(date)}`,
  )

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ?? `Failed to fetch cooking sessions: ${response.status}`,
    )
  }

  return result.data as CookingSession[]
}

export async function createCookingSession(
  input: CreateCookingSessionInput,
): Promise<CookingSession> {
  const response = await fetch(
    `${API_BASE_URL}/cooking-sessions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  )

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ?? `Failed to create cooking session: ${response.status}`,
    )
  }

  return result.data as CookingSession
}

export async function getCookedDishIds(): Promise<string[]> {
  const response = await fetch(
    `${API_BASE_URL}/cooking-sessions/cooked-dishes`,
  )

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      result?.message ?? 'Không thể tải trạng thái món đã nấu.',
    )
  }

  if (!Array.isArray(result?.data)) {
    throw new Error('Dữ liệu trạng thái món đã nấu không hợp lệ.')
  }

  return result.data as string[]
}
