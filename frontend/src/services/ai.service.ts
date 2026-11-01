import type {
  AiChatResponse,
  ChatMessage,
} from '../types/ai'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function sendAiMessage(
  message: string,
  history: ChatMessage[] = [],
): Promise<AiChatResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history,
    }),
  })

  const payload = await response.json()

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.message || 'Không thể kết nối với Bếp Nhà AI.',
    )
  }

  return payload.data as AiChatResponse
}