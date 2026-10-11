
import type { Request, Response } from 'express'
import { getAllSavedMenus, getSavedMenuById } from '../services/menu.service.js'

export async function getMenus(
    _req: Request,
    res: Response,
) {
    try {
        const menus = await getAllSavedMenus()

        res.json({
            data: menus,
        })
    } catch (error) {
        console.error('Failed to get saved menus:', error)

        res.status(500).json({
            message: 'Không thể lấy danh sách thực đơn đã lưu.',
        })
    }
}


export async function getMenuById(
    req: Request,
    res: Response,
) {
    const { id } = req.params

    if (typeof id !== 'string') {
        res.status(400).json({ message: 'Invalid dish id' })
        return
    }

    if (!/^\d+$/.test(id)) {
        res.status(400).json({
            message: 'ID thực đơn không hợp lệ.',
        })
        return
    }

    try {
        const menu = await getSavedMenuById(id)

        if (!menu) {
            res.status(404).json({
                message: 'Không tìm thấy thực đơn.',
            })
            return
        }

        res.json({
            data: menu,
        })
    } catch (error) {
        console.error('Failed to get saved menu:', error)

        res.status(500).json({
            message: 'Không thể lấy chi tiết thực đơn.',
        })
    }
}
