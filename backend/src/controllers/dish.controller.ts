
import type { NextFunction, Request, Response } from 'express'

import {
    getAllDishes,
    addDish,
    modifyDish,
    removeDish,
    randomize,
    getDishById,
    searchDishesByIngredients,
} from '../services/dish.service.js'

function isDatabaseError(
    error: unknown,
    code: string,
): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === code
    )
}

function isValidId(id: string): boolean {
    return /^\d+$/.test(id) && BigInt(id) > 0n
}

export async function getDishes(
    _req: Request,
    res: Response,
): Promise<void> {
    try {
        const dishes = await getAllDishes()
        res.status(200).json({ data: dishes, total: dishes.length })
    } catch (error) {
        console.error('Failed to get dishes:', error)
        res.status(500).json({ message: 'Cannot retrieve dishes' })
    }
}

export async function createDish(
    req: Request,
    res: Response,
): Promise<void> {
    const name =
        typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const categoryId =
        typeof req.body?.category_id === 'string' ||
            typeof req.body?.category_id === 'number'
            ? String(req.body.category_id)
            : ''

    if (!name || name.length > 200 || !isValidId(categoryId)) {
        res.status(400).json({
            message: 'A valid name and category_id are required',
        })
        return
    }

    try {
        const dish = await addDish(name, categoryId)
        res.status(201).json({ data: dish })
    } catch (error) {
        if (isDatabaseError(error, '23505')) {
            res.status(409).json({ message: 'Dish name already exists' })
            return
        }

        if (isDatabaseError(error, '23503')) {
            res.status(400).json({ message: 'Category does not exist' })
            return
        }

        console.error('Failed to create dish:', error)
        res.status(500).json({ message: 'Cannot create dish' })
    }
}

export async function updateDish(
    req: Request,
    res: Response,
): Promise<void> {
    const { id } = req.params

    if (typeof id !== 'string') {
        res.status(400).json({ message: 'Invalid dish id' })
        return
    }
    const name =
        typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const categoryId =
        typeof req.body?.category_id === 'string' ||
            typeof req.body?.category_id === 'number'
            ? String(req.body.category_id)
            : ''

    if (!isValidId(id) || !name || name.length > 200 ||
        !isValidId(categoryId)) {
        res.status(400).json({
            message: 'A valid id, name and category_id are required',
        })
        return
    }

    try {
        const dish = await modifyDish(id, name, categoryId)

        if (!dish) {
            res.status(404).json({ message: 'Dish not found' })
            return
        }

        res.status(200).json({ data: dish })
    } catch (error) {
        if (isDatabaseError(error, '23505')) {
            res.status(409).json({ message: 'Dish name already exists' })
            return
        }

        if (isDatabaseError(error, '23503')) {
            res.status(400).json({ message: 'Category does not exist' })
            return
        }

        console.error('Failed to update dish:', error)
        res.status(500).json({ message: 'Cannot update dish' })
    }
}

export async function deleteDish(
    req: Request,
    res: Response,
): Promise<void> {
    const { id } = req.params

    if (typeof id !== 'string') {
        res.status(400).json({ message: 'Invalid dish id' })
        return
    }

    if (!isValidId(id)) {
        res.status(400).json({ message: 'Invalid dish id' })
        return
    }

    try {
        const removed = await removeDish(id)

        if (!removed) {
            res.status(404).json({ message: 'Dish not found' })
            return
        }

        res.status(200).json({ message: 'Dish removed from active catalog' })
    } catch (error) {
        console.error('Failed to remove dish:', error)
        res.status(500).json({ message: 'Cannot remove dish' })
    }
}

export async function randomDishes(
    req: Request,
    res: Response,
): Promise<void> {
    const body = req.body

    if (
        !body ||
        typeof body !== 'object' ||
        !['meal', 'single'].includes(body.mode)
    ) {
        res.status(400).json({
            message: 'mode must be meal or single',
        })
        return
    }

    const categoryId =
        typeof body.category_id === 'string' ||
        typeof body.category_id === 'number'
            ? String(body.category_id)
            : undefined

    if (categoryId !== undefined && !isValidId(categoryId)) {
        res.status(400).json({
            message: 'Invalid category_id',
        })
        return
    }

    let dishIds: string[] | undefined

    if (body.dish_ids !== undefined) {
        if (
            !Array.isArray(body.dish_ids) ||
            !body.dish_ids.every(
                (id: unknown) =>
                    (typeof id === 'string' || typeof id === 'number') &&
                    isValidId(String(id)),
            )
        ) {
            res.status(400).json({
                message: 'dish_ids must be an array of valid IDs',
            })
            return
        }

        dishIds = Array.from(
            new Set<string>(
                (body.dish_ids as Array<string | number>).map((id) => String(id)),
            ),
        )
    }

    if (categoryId && dishIds) {
        res.status(400).json({
            message: 'Choose category_id or dish_ids, not both',
        })
        return
    }

    if (body.mode === 'meal' && (categoryId || dishIds)) {
        res.status(400).json({
            message: 'Meal mode does not accept category_id or dish_ids',
        })
        return
    }

    if (body.mode === 'single' && body.meal_type !== undefined) {
        res.status(400).json({
            message: 'meal_type is only available in meal mode',
        })
        return
    }

    if (
        body.mode === 'meal' &&
        body.meal_type !== undefined &&
        !['rice', 'one_dish', 'auto'].includes(body.meal_type)
    ) {
        res.status(400).json({
            message: 'meal_type must be rice, one_dish or auto',
        })
        return
    }

    try {
        const result = await randomize({
            mode: body.mode,
            mealType: body.meal_type,
            categoryId,
            dishIds,
        })

        res.status(200).json({ data: result })
    } catch (error) {
        console.error('Failed to randomize dishes:', error)
        res.status(500).json({
            message: 'Cannot randomize dishes',
        })
    }
}

export async function getDish(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params

  if (typeof id !== 'string' || !isValidId(id)) {
    res.status(400).json({ message: 'Invalid dish id' })
    return
  }

  try {
    const dish = await getDishById(id)

    if (!dish) {
      res.status(404).json({ message: 'Dish not found' })
      return
    }

    res.status(200).json({ data: dish })
  } catch (error) {
    console.error('Failed to get dish:', error)
    res.status(500).json({ message: 'Cannot retrieve dish' })
  }
}

export async function getDishesByIngredients(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawIds = req.query.ids

    if (typeof rawIds !== 'string' || rawIds.trim() === '') {
      res.status(400).json({
        message: 'Vui lòng chọn ít nhất một nguyên liệu.',
      })
      return
    }

    const ingredientIds = rawIds.split(',').map((id) => id.trim())

    if (
      ingredientIds.some(
        (id) => !/^[1-9]\d*$/.test(id),
      )
    ) {
      res.status(400).json({
        message: 'Danh sách ID nguyên liệu không hợp lệ.',
      })
      return
    }

    const dishes = await searchDishesByIngredients(ingredientIds)

    res.status(200).json({
      data: dishes,
      total: dishes.length,
    })
  } catch (error) {
    next(error)
  }
}
