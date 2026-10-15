import type { Request, Response } from 'express'
import {
  getAllSavedMenus,
  getSavedMenuById,
  createManualMenu as createManualMenuService,
  updateSavedMenu as updateSavedMenuService,
  deleteSavedMenu as deleteSavedMenuService,
} from '../services/menu.service.js'

export async function getMenus(
  _req: Request,
  res: Response,
) {
  try {
    const menus = await getAllSavedMenus()

    res.json({ data: menus })
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
    res.status(400).json({ message: 'Invalid menu id' })
    return
  }

  if (!isValidMenuId(id)) {
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

    res.json({ data: menu })
  } catch (error) {
    console.error('Failed to get saved menu:', error)

    res.status(500).json({
      message: 'Không thể lấy chi tiết thực đơn.',
    })
  }
}

function isValidMenuInput(
  body: unknown,
): body is { name: string; dishIds: string[] } {
  if (typeof body !== 'object' || body === null) {
    return false
  }

  const input = body as Record<string, unknown>

  return (
    typeof input.name === 'string' &&
    input.name.trim().length > 0 &&
    input.name.trim().length <= 100 &&
    Array.isArray(input.dishIds) &&
    input.dishIds.length > 0 &&
    input.dishIds.every(
      (id) => typeof id === 'string' && /^\d+$/.test(id),
    )
  )
}

function isValidMenuId(id: string): boolean {
  return /^\d+$/.test(id)
}

export async function createManualMenu(
  req: Request,
  res: Response,
) {
  if (!isValidMenuInput(req.body)) {
    res.status(400).json({
      message: 'Tên thực đơn và danh sách ID món không hợp lệ.',
    })
    return
  }

  try {
    const menu = await createManualMenuService(
      req.body.name,
      req.body.dishIds,
    )

    res.status(201).json({ data: menu })
  } catch (error) {
    if (error instanceof Error) {
      const validationMessages = [
        'Tên thực đơn không được để trống.',
        'Tên thực đơn không được vượt quá 100 ký tự.',
        'Thực đơn phải có ít nhất một món.',
        'Một hoặc nhiều món không tồn tại hoặc đã ngừng hoạt động.',
      ]

      if (validationMessages.includes(error.message)) {
        res.status(400).json({ message: error.message })
        return
      }
    }

    console.error('Failed to create manual menu:', error)

    res.status(500).json({
      message: 'Không thể tạo thực đơn.',
    })
  }
}

export async function updateSavedMenu(
  req: Request,
  res: Response,
) {
  const { id } = req.params

  if (typeof id !== 'string') {
    res.status(400).json({ message: 'Invalid menu id' })
    return
  }

  if (!isValidMenuId(id) || !isValidMenuInput(req.body)) {
    res.status(400).json({
      message: 'ID hoặc thông tin thực đơn không hợp lệ.',
    })
    return
  }

  try {
    const menu = await updateSavedMenuService(
      id,
      req.body.name,
      req.body.dishIds,
    )

    if (!menu) {
      res.status(404).json({
        message: 'Không tìm thấy thực đơn.',
      })
      return
    }

    res.json({ data: menu })
  } catch (error) {
    if (error instanceof Error) {
      const validationMessages = [
        'Tên thực đơn phải có từ 1 đến 100 ký tự.',
        'Thực đơn phải có ít nhất một món.',
        'Một hoặc nhiều món không tồn tại hoặc đã ngừng hoạt động.',
      ]

      if (validationMessages.includes(error.message)) {
        res.status(400).json({ message: error.message })
        return
      }
    }

    console.error('Failed to update saved menu:', error)

    res.status(500).json({
      message: 'Không thể cập nhật thực đơn.',
    })
  }
}

export async function deleteSavedMenu(
  req: Request,
  res: Response,
) {
  const { id } = req.params

  if (typeof id !== 'string' || !isValidMenuId(id)) {
    res.status(400).json({
      message: 'ID thực đơn không hợp lệ.',
    })
    return
  }

  try {
    const deleted = await deleteSavedMenuService(id)

    if (!deleted) {
      res.status(404).json({
        message: 'Không tìm thấy thực đơn.',
      })
      return
    }

    res.status(204).send()
  } catch (error) {
    console.error('Failed to delete saved menu:', error)

    res.status(500).json({
      message: 'Không thể xóa thực đơn.',
    })
  }
}
