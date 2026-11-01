export type ChatRole = 'user' | 'model'

export type AiFunctionName =
  | 'search_dishes'
  | 'search_ingredients'
  | 'get_dish_by_ingredients'
  | 'get_dish_detail'
  | 'random_dishes'

export type AiIntent =
  | AiFunctionName
  | 'chat'
  | 'multiple'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface AiFunctionResult {
  functionName: AiFunctionName
  data: unknown
}

export interface AiChatResponse {
  message: string
  intent: AiIntent
  results: AiFunctionResult[]
}