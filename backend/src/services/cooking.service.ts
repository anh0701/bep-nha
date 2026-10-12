
import {
  createCookingSession,
  findCookedDishIds,
  findCookingCalendar,
  findCookingSessionsByDate,
  type CookingSession,
} from '../repositories/cooking.repository.js'

export interface RecordCookingInput {
  dishIds: string[]
  cookedAt?: string
}

export async function recordCooking(
  input: RecordCookingInput,
): Promise<CookingSession> {
  if (input.dishIds.length === 0) {
    throw new Error('DISH_IDS_REQUIRED')
  }

  if (new Set(input.dishIds).size !== input.dishIds.length) {
    throw new Error('DUPLICATE_DISH_IDS')
  }

  if (
    input.dishIds.some(
      (id) => !/^[1-9]\d*$/.test(id),
    )
  ) {
    throw new Error('INVALID_DISH_IDS')
  }

  if (
    input.cookedAt !== undefined &&
    (
      typeof input.cookedAt !== 'string' ||
      !input.cookedAt.trim() ||
      !Number.isFinite(Date.parse(input.cookedAt))
    )
  ) {
    throw new Error('INVALID_COOKED_AT')
  }

  return createCookingSession(input)
}

export async function getCookingCalendar(month: string) {
  return findCookingCalendar(month)
}

export async function getCookingSessionsByDate(date: string) {
  return findCookingSessionsByDate(date)
}

export async function getCookedDishIds(): Promise<string[]> {
  return findCookedDishIds()
}
