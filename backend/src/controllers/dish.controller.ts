
import type { Request, Response } from 'express'
import {
    getAllDishes,
    addDish,
    modifyDish,
    removeDish,
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
