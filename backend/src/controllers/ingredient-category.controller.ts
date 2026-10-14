import type { Request, Response } from 'express'
import {
  getAllIngredientCategories,
} from '../services/ingredient-category.service.js'

export async function getIngredientCategories(
  _req: Request,
  res: Response,
) {
  try {
    const categories = await getAllIngredientCategories()

    res.json({ data: categories })
  } catch (error) {
    console.error('Không thể lấy danh mục nguyên liệu.', error)

    res.status(500).json({
      message: 'Không thể lấy danh sách danh mục nguyên liệu.',
    })
  }
}
