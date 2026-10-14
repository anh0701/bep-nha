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

type ParseResult =
    | { data: DishIngredientInput[]; error?: never }
    | { data?: never; error: string }

function parseIngredients(body: unknown): ParseResult {
    if (
        typeof body !== 'object' ||
        body === null ||
        !('ingredients' in body) ||
        !Array.isArray(body.ingredients)
    ) {
        return { error: 'Vui lòng gửi danh sách nguyên liệu hợp lệ.' }
    }

    const parsed: DishIngredientInput[] = []
    const seenIds = new Set<string>()

    for (const value of body.ingredients) {
        if (typeof value !== 'object' || value === null) {
            return { error: 'Thông tin nguyên liệu không hợp lệ.' }
        }

        const item = value as Record<string, unknown>

        const ingredientId =
            typeof item.ingredient_id === 'string'
                ? item.ingredient_id
                : typeof item.ingredient_id === 'number' &&
                    Number.isSafeInteger(item.ingredient_id)
                    ? String(item.ingredient_id)
                    : ''

        if (!isValidId(ingredientId)) {
            return { error: 'ID nguyên liệu không hợp lệ.' }
        }

        const normalizedId = BigInt(ingredientId).toString()

        if (seenIds.has(normalizedId)) {
            return { error: 'Không được chọn trùng nguyên liệu.' }
        }

        seenIds.add(normalizedId)

        if (
            typeof item.quantity_per_person !== 'number' ||
            !Number.isFinite(item.quantity_per_person) ||
            item.quantity_per_person <= 0
        ) {
            return { error: 'Định lượng phải lớn hơn 0.' }
        }

        if (
            typeof item.unit !== 'string' ||
            !item.unit.trim() ||
            item.unit.trim().length > 30
        ) {
            return {
                error: 'Đơn vị phải có từ 1 đến 30 ký tự.',
            }
        }

        if (
            item.ingredient_role !== 'main' &&
            item.ingredient_role !== 'minor'
        ) {
            return { error: 'Vai trò nguyên liệu không hợp lệ.' }
        }

        if (
            item.is_optional !== undefined &&
            typeof item.is_optional !== 'boolean'
        ) {
            return {
                error: 'Trạng thái nguyên liệu tùy chọn không hợp lệ.',
            }
        }

        if (
            item.preparation_note !== undefined &&
            item.preparation_note !== null &&
            typeof item.preparation_note !== 'string'
        ) {
            return { error: 'Ghi chú sơ chế không hợp lệ.' }
        }

        const preparationNote =
            typeof item.preparation_note === 'string'
                ? item.preparation_note.trim() || null
                : null

        if (
            preparationNote !== null &&
            preparationNote.length > 500
        ) {
            return {
                error: 'Ghi chú sơ chế không được vượt quá 500 ký tự.',
            }
        }

        parsed.push({
            ingredient_id: normalizedId,
            quantity_per_person: item.quantity_per_person,
            unit: item.unit.trim(),
            ingredient_role: item.ingredient_role as IngredientRole,
            is_optional: item.is_optional === true,
            preparation_note: preparationNote,
        })
    }

    return { data: parsed }
}

export async function getDishIngredients(
    req: Request,
    res: Response,
): Promise<void> {
    const { id } = req.params

    if (typeof id !== 'string' || !isValidId(id)) {
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

    if (typeof id !== 'string' || !isValidId(id)) {
        res.status(400).json({
            message: 'ID món ăn không hợp lệ.',
        })
        return
    }

    const parsed = parseIngredients(req.body)

    if (!parsed.data) {
        res.status(400).json({
            message: parsed.error ?? 'Danh sách nguyên liệu không hợp lệ.',
        })
        return
    }

    try {
        const result = await setIngredientsOfDish(
            id,
            parsed.data,
        )

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
        if (error instanceof Error) {
            const validationMessages = [
                'ID nguyên liệu không hợp lệ.',
                'Không được chọn trùng nguyên liệu.',
                'Định lượng phải lớn hơn 0.',
                'Đơn vị phải có từ 1 đến 30 ký tự.',
                'Vai trò nguyên liệu không hợp lệ.',
                'Trạng thái nguyên liệu tùy chọn không hợp lệ.',
                'Ghi chú sơ chế không được vượt quá 500 ký tự.',
                'Một hoặc nhiều nguyên liệu không tồn tại hoặc đã ngừng hoạt động.',
            ]

            if (validationMessages.includes(error.message)) {
                res.status(400).json({
                    message: error.message,
                })
                return
            }
        }

        console.error('Failed to update dish ingredients:', error)
        res.status(500).json({
            message: 'Không thể cập nhật nguyên liệu của món ăn.',
        })
    }
}
