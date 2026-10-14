
import type { Request, Response } from 'express'

import {
    getIngredientsOfDish,
    setIngredientsOfDish,
} from '../services/dish-ingredient.service.js'

import type {
    DishIngredientInput,
    IngredientRole,
} from '../repositories/dish-ingredient.repository.js'

function isValidId(id: string): boolean {
    return /^\d+$/.test(id) && BigInt(id) > 0n
}

function parseIngredients(
    body: unknown,
): DishIngredientInput[] | null {
    if (
        typeof body !== 'object' ||
        body === null ||
        !('ingredients' in body) ||
        !Array.isArray(body.ingredients)
    ) {
        return null
    }

    const parsed: DishIngredientInput[] = []

    for (const value of body.ingredients) {
        if (typeof value !== 'object' || value === null) {
            return null
        }

        const item = value as Record<string, unknown>

        const ingredientId =
            typeof item.ingredient_id === 'string' ||
                typeof item.ingredient_id === 'number'
                ? String(item.ingredient_id)
                : ''

        if (!isValidId(ingredientId)) {
            return null
        }

        if (
            typeof item.quantity_per_person !== 'number' ||
            !Number.isFinite(item.quantity_per_person) ||
            item.quantity_per_person <= 0
        ) {
            return null
        }

        if (
            typeof item.unit !== 'string' ||
            !item.unit.trim() ||
            item.unit.trim().length > 30
        ) {
            return null
        }

        if (
            item.ingredient_role !== 'main' &&
            item.ingredient_role !== 'minor'
        ) {
            return null
        }

        if (
            item.is_optional !== undefined &&
            typeof item.is_optional !== 'boolean'
        ) {
            return null
        }

        if (
            item.preparation_note !== undefined &&
            item.preparation_note !== null &&
            typeof item.preparation_note !== 'string'
        ) {
            return null
        }

        if (
            typeof item.preparation_note === 'string' &&
            item.preparation_note.length > 500
        ) {
            return null
        }

        parsed.push({
            ingredient_id: ingredientId,
            quantity_per_person: item.quantity_per_person,
            unit: item.unit.trim(),
            ingredient_role: item.ingredient_role as IngredientRole,
            is_optional: item.is_optional === true,
            preparation_note:
                typeof item.preparation_note === 'string'
                    ? item.preparation_note.trim() || null
                    : null,
        })
    }

    return parsed
}

const validationMessages = [
    'ID nguyên liệu không hợp lệ.',
    'Không được chọn trùng nguyên liệu.',
    'Định lượng phải lớn hơn 0.',
    'Đơn vị phải có từ 1 đến 30 ký tự.',
    'Vai trò nguyên liệu không hợp lệ.',
    'Trạng thái nguyên liệu tùy chọn không hợp lệ.',
    'Ghi chú sơ chế không được vượt quá 500 ký tự.',
]

export async function getDishIngredients(
    req: Request,
    res: Response,
): Promise<void> {
    const { id } = req.params
    if (typeof id !== 'string') {
        res.status(400).json({ message: 'Invalid dish id' })
        return
    }

    if (!isValidId(id)) {
        res.status(400).json({
            message: 'ID món ăn không hợp lệ.',
        })
        return
    }

    try {
        const ingredients = await getIngredientsOfDish(id)

        if (ingredients === null) {
            res.status(404).json({
                message: 'Không tìm thấy món ăn hoặc món đã ngừng hoạt động.',
            })
            return
        }

        res.status(200).json({
            data: ingredients,
            total: ingredients.length,
        })
    } catch (error) {
        console.error('Failed to get dish ingredients:', error)
        res.status(500).json({
            message: 'Không thể lấy danh sách nguyên liệu của món ăn.',
        })
    }
}

export async function updateDishIngredients(
    req: Request,
    res: Response,
): Promise<void> {
    const { id } = req.params
    if (typeof id !== 'string') {
        res.status(400).json({ message: 'Invalid dish id' })
        return
    }

    if (!isValidId(id)) {
        res.status(400).json({
            message: 'ID món ăn không hợp lệ.',
        })
        return
    }

    const ingredients = parseIngredients(req.body)

    if (ingredients === null) {
        res.status(400).json({
            message: 'Danh sách nguyên liệu không hợp lệ.',
        })
        return
    }

    try {
        const result = await setIngredientsOfDish(id, ingredients)

        if (result === null) {
            res.status(404).json({
                message: 'Không tìm thấy món ăn hoặc món đã ngừng hoạt động.',
            })
            return
        }

        res.status(200).json({
            data: result,
            total: result.length,
        })
    } catch (error) {
        if (
            error instanceof Error &&
            validationMessages.includes(error.message)
        ) {
            res.status(400).json({
                message: error.message,
            })
            return
        }

        if (
            typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            error.message ===
            'Một hoặc nhiều nguyên liệu không tồn tại hoặc đã ngừng hoạt động.'
        ) {
            res.status(400).json({
                message: error.message,
            })
            return
        }

        console.error('Failed to update dish ingredients:', error)
        res.status(500).json({
            message: 'Không thể cập nhật nguyên liệu của món ăn.',
        })
    }
}
