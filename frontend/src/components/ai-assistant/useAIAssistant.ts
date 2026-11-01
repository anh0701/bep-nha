import { useState } from 'react'

import { sendAiMessage } from '../../services/ai.service'

import type {
  AiFunctionResult,
  ChatMessage,
} from '../../types/ai'

export interface AIChatItem {
  id: string
  role: 'user' | 'model'
  content: string
  results?: AiFunctionResult[]
}

const INITIAL_MESSAGE: AIChatItem = {
  id: 'welcome',
  role: 'model',
  content:
    'Xin chào! Mình là Bếp Nhà AI. Bạn muốn tìm món ăn, tìm món theo nguyên liệu hay cần gợi ý thực đơn hôm nay?',
}

export function useAIAssistant() {
  const [messages, setMessages] = useState<AIChatItem[]>([
    INITIAL_MESSAGE,
  ])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendMessage(content: string) {
    const normalized = content.trim()

    if (!normalized || isLoading) {
      return
    }

    const userMessage: AIChatItem = {
      id: crypto.randomUUID(),
      role: 'user',
      content: normalized,
    }

    const previousHistory: ChatMessage[] = messages.map(
      ({ role, content: messageContent }) => ({
        role,
        content: messageContent,
      }),
    )

    setMessages((previous) => [
      ...previous,
      userMessage,
    ])

    setIsLoading(true)
    setError(null)

    try {
      const response = await sendAiMessage(
        normalized,
        previousHistory,
      )

      const assistantMessage: AIChatItem = {
        id: crypto.randomUUID(),
        role: 'model',
        content: response.message,
        results: response.results ?? [],
      }

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Đã xảy ra lỗi khi gửi tin nhắn.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  }
}