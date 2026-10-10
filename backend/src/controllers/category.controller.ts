
import type { Request, Response } from 'express'
import { getAllCategories } from '../services/category.service.js'

export async function getCategories(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const categories = await getAllCategories()

    res.status(200).json({
      data: categories,
      total: categories.length,
    })
  } catch (error) {
    console.error('Failed to get categories:', error)

    res.status(500).json({
      message: 'Cannot retrieve categories',
    })
  }
}
