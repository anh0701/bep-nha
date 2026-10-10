
import type { Request, Response } from 'express'
import { getAllDishes } from '../services/dish.service.js'

export async function getDishes(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const dishes = await getAllDishes()

    res.status(200).json({
      data: dishes,
      total: dishes.length,
    })
  } catch (error) {
    console.error('Failed to get dishes:', error)

    res.status(500).json({
      message: 'Cannot retrieve dishes',
    })
  }
}
