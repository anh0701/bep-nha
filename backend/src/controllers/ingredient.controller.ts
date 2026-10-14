
import type { Request, Response } from 'express'

import {
    getAllIngredients,
    getIngredientById,
    addIngredient,
    modifyIngredient,
    modifyIngredientStatus,
} from '../services/ingredient.service.js'

import type {
    IngredientInput,
} from '../repositories/ingredient.repository.js'

function isValidId(id: string): boolean {
    return /^\d+$/.test(id) && BigInt(id) > 0n
}

function parseIngredientInput(
    body: unknown,
): IngredientInput | null {
    if (typeof body !== 'object' || body === null) {
        return null
    }

    const input = body as Record<string, unknown>

    if (
        typeof input.name !== 'string' ||
        !input.name.trim() ||
        input.name.trim().length > 100 ||
        (
            input.ingredient_group !== undefined &&
            input.ingredient_group !== null &&
            typeof input.ingredient_group !== 'string'
        ) ||
        (
            typeof input.ingredient_group === 'string' &&
            input.ingredient_group.trim().length > 100
        ) ||
        typeof input.default_unit !== 'string' ||
        !input.default_unit.trim() ||
        input.default_unit.trim().length > 30
    ) {
        return null
    }

    return {
        name: input.name,
        ingredient_group:
            typeof input.ingredient_group === 'string'
                ? input.ingredient_group
                : null,
        default_unit: input.default_unit,
    }
}

function handleIngredientError(
    error: unknown,
    res: Response,
    fallbackMessage: string,
) {
    if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
    ) {
        res.status(409).json({
            message: 'Tên nguyên liệu này đã tồn tại.',
        })
        return
    }

    console.error(fallbackMessage, error)

    res.status(500).json({
        message: fallbackMessage,
    })
}

export async function getIngredients(
    req: Request,
    res: Response,
) {
    const search =
        typeof req.query.search === 'string'
            ? req.query.search.trim()
            : undefined

    try {
        const ingredients = await getAllIngredients(search)

        res.json({ data: ingredients })
    } catch (error) {
        handleIngredientError(
            error,
            res,
            'Không thể lấy danh sách nguyên liệu.',
        )
    }
}

export async function getIngredient(
    req: Request,
    res: Response,
) {
    const { id } = req.params

    if (typeof id !== 'string') {
        res.status(400).json({ message: 'Invalid dish id' })
        return
    }

    if (!isValidId(id)) {
        res.status(400).json({
            message: 'ID nguyên liệu không hợp lệ.',
        })
        return
    }

    try {
        const ingredient = await getIngredientById(id)

        if (!ingredient) {
            res.status(404).json({
                message: 'Không tìm thấy nguyên liệu.',
            })
            return
        }

        res.json({ data: ingredient })
    } catch (error) {
        handleIngredientError(
            error,
            res,
            'Không thể lấy thông tin nguyên liệu.',
        )
    }
}

export async function createIngredient(
    req: Request,
    res: Response,
) {
    const input = parseIngredientInput(req.body)

    if (!input) {
        res.status(400).json({
            message: 'Thông tin nguyên liệu không hợp lệ.',
        })
        return
    }

    try {
        const ingredient = await addIngredient(input)

        res.status(201).json({ data: ingredient })
    } catch (error) {
        if (error instanceof Error) {
            const validationMessages = [
                'Tên nguyên liệu không được để trống.',
                'Tên nguyên liệu không được vượt quá 100 ký tự.',
                'Nhóm nguyên liệu không được vượt quá 100 ký tự.',
                'Đơn vị mặc định không được để trống.',
                'Đơn vị mặc định không được vượt quá 30 ký tự.',
            ]

            if (validationMessages.includes(error.message)) {
                res.status(400).json({ message: error.message })
                return
            }
        }

        handleIngredientError(
            error,
            res,
            'Không thể tạo nguyên liệu.',
        )
    }
}

export async function updateIngredient(
    req: Request,
    res: Response,
) {
    const { id } = req.params
    const input = parseIngredientInput(req.body)

    if (typeof id !== 'string') {
        res.status(400).json({ message: 'Invalid dish id' })
        return
    }

    if (!isValidId(id) || !input) {
        res.status(400).json({
            message: 'ID hoặc thông tin nguyên liệu không hợp lệ.',
        })
        return
    }

    try {
        const ingredient = await modifyIngredient(id, input)

        if (!ingredient) {
            res.status(404).json({
                message: 'Không tìm thấy nguyên liệu.',
            })
            return
        }

        res.json({ data: ingredient })
    } catch (error) {
        if (error instanceof Error) {
            const validationMessages = [
                'Tên nguyên liệu không được để trống.',
                'Tên nguyên liệu không được vượt quá 100 ký tự.',
                'Nhóm nguyên liệu không được vượt quá 100 ký tự.',
                'Đơn vị mặc định không được để trống.',
                'Đơn vị mặc định không được vượt quá 30 ký tự.',
            ]

            if (validationMessages.includes(error.message)) {
                res.status(400).json({ message: error.message })
                return
            }
        }

        handleIngredientError(
            error,
            res,
            'Không thể cập nhật nguyên liệu.',
        )
    }
}

export async function updateIngredientStatus(
    req: Request,
    res: Response,
) {
    const { id } = req.params
    const body = req.body as Record<string, unknown> | null
    if (typeof id !== 'string') {
        res.status(400).json({ message: 'Invalid dish id' })
        return
    }

    if (
        !isValidId(id) ||
        !body ||
        typeof body.is_active !== 'boolean'
    ) {
        res.status(400).json({
            message: 'ID hoặc trạng thái nguyên liệu không hợp lệ.',
        })
        return
    }

    try {
        const ingredient = await modifyIngredientStatus(
            id,
            body.is_active,
        )

        if (!ingredient) {
            res.status(404).json({
                message: 'Không tìm thấy nguyên liệu.',
            })
            return
        }

        res.json({ data: ingredient })
    } catch (error) {
        handleIngredientError(
            error,
            res,
            'Không thể thay đổi trạng thái nguyên liệu.',
        )
    }
}
