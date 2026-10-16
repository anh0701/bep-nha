import type { Request, Response } from 'express'
import { getAllUnits } from '../services/unit.service.js'

export async function getUnits(
    _req: Request,
    res: Response,
) {
    try {
        const units = await getAllUnits()
        res.json({ data: units })
    } catch (error) {
        console.error('Không thể lấy danh sách đơn vị.', error)

        res.status(500).json({
            message: 'Không thể lấy danh sách đơn vị.',
        })
    }
}