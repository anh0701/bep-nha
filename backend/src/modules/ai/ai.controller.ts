import type { Request, Response } from 'express'
import { ChatMessage, chatWithGemini } from './ai.service.js'

export async function chat(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { message, history } = req.body

    if (
      typeof message !== 'string' ||
      !message.trim() ||
      message.length > 2000
    ) {
      res.status(400).json({
        success: false,
        message: 'Nội dung câu hỏi không hợp lệ',
      })
      return
    }

    if (
      history !== undefined &&
      (
        !Array.isArray(history) ||
        history.length > 20 ||
        !history.every(
          (item: unknown) =>
            typeof item === 'object' &&
            item !== null &&
            'role' in item &&
            'content' in item &&
            ['user', 'model'].includes(
              String((item as ChatMessage).role),
            ) &&
            typeof (item as ChatMessage).content === 'string' &&
            (item as ChatMessage).content.length <= 2000,
        )
      )
    ) {
      res.status(400).json({
        success: false,
        message: 'Lịch sử hội thoại không hợp lệ',
      })
      return
    }

    const result = await chatWithGemini({
      message: message.trim(),
      history,
    })

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[AI Chat Error]:', error)

    res.status(500).json({
      success: false,
      message: 'Không thể kết nối với trợ lý Bếp Nhà lúc này',
    })
  }
}