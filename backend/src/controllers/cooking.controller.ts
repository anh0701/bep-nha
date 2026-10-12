
import type { Request, Response } from 'express'
import { recordCooking } from '../services/cooking.service.js'
import {
  getCookingCalendar as fetchCookingCalendar,
  getCookingSessionsByDate as fetchCookingSessionsByDate,
  getCookedDishIds as fetchCookedDishIds,
} from '../services/cooking.service.js'

export async function postCookingSession(
  req: Request,
  res: Response,
): Promise<void> {
  const { dishIds, cookedAt } = req.body ?? {}

  if (
    !Array.isArray(dishIds) ||
    !dishIds.every((id) => typeof id === 'string') ||
    (
      cookedAt !== undefined &&
      typeof cookedAt !== 'string'
    )
  ) {
    res.status(400).json({
      message: 'Invalid request body.',
    })
    return
  }

  try {
    const session = await recordCooking({
      dishIds,
      cookedAt,
    })

    res.status(201).json({
      data: session,
    })
  } catch (error) {
    if (error instanceof Error) {
      const validationErrors: Record<string, string> = {
        DISH_IDS_REQUIRED: 'Please select at least one dish.',
        DUPLICATE_DISH_IDS: 'Duplicate dish IDs are not allowed.',
        INVALID_DISH_IDS: 'One or more dish IDs are invalid.',
        INVALID_COOKED_AT: 'The cooking date or time is invalid.',
      }

      const message = validationErrors[error.message]

      if (message) {
        res.status(400).json({ message })
        return
      }
    }

    // PostgreSQL báo lỗi foreign key nếu món không tồn tại.
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === '23503'
    ) {
      res.status(400).json({
        message: 'One or more selected dishes do not exist.',
      })
      return
    }

    console.error('Failed to record cooking session:', error)

    res.status(500).json({
      message: 'Failed to record cooking session.',
    })
  }
}

export async function getCookingCalendar(
  req: Request,
  res: Response,
): Promise<void> {
  const month = req.query.month

  console.log('[controller] req.query =', req.query)
  console.log('[controller] month =', month)
  console.log('[controller] typeof month =', typeof month)

  if (
    typeof month !== 'string' ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
  ) {
    res.status(400).json({
      message: 'month must use YYYY-MM format.',
    })
    return
  }

  try {
    const data = await fetchCookingCalendar(month)
    res.status(200).json({ data })
  } catch (error) {
    console.error('Failed to fetch cooking calendar:', error)
    res.status(500).json({
      message: 'Failed to fetch cooking calendar.',
    })
  }
}

export async function getCookingSessionsByDate(
  req: Request,
  res: Response,
): Promise<void> {
  const date = req.query.date

  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    res.status(400).json({
      message: 'date must use YYYY-MM-DD format.',
    })
    return
  }

  const parsedDate = new Date(`${date}T00:00:00Z`)

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    res.status(400).json({
      message: 'date is invalid.',
    })
    return
  }

  try {
    const data = await fetchCookingSessionsByDate(date)
    res.status(200).json({ data })
  } catch (error) {
    console.error('Failed to fetch cooking sessions:', error)
    res.status(500).json({
      message: 'Failed to fetch cooking sessions.',
    })
  }
}

export async function getCookedDishIds(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const data = await fetchCookedDishIds()
    res.status(200).json({ data })
  } catch (error) {
    console.error('Failed to fetch cooked dish IDs:', error)
    res.status(500).json({
      message: 'Failed to fetch cooked dish IDs.',
    })
  }
}
