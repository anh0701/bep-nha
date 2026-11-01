import type { Content } from '@google/genai'

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export interface ChatRequest {
  message: string
  history?: ChatMessage[]
}

export type AiFunctionName =
  | 'search_dishes'
  | 'search_ingredients'
  | 'get_dish_by_ingredients'
  | 'get_dish_detail'
  | 'random_dishes'

export interface AiFunctionResult {
  functionName: AiFunctionName
  data: unknown
}

export type AiIntent =
  | AiFunctionName
  | 'chat'
  | 'multiple'

export interface ChatResponse {
  message: string
  intent: AiIntent
  results: AiFunctionResult[]
}

export type GeminiContents = Content[]