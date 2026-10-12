export interface CookingCalendarDay {
  cooked_on: string
  dishes: string[]
}

export interface CookingSessionDish {
  id: string
  name: string
  category_id: string
  category: string
}

export interface CookingSession {
  id: string
  cooked_at: string
  dishes: CookingSessionDish[]
}

export interface CookingCalendarResponse {
  data: CookingCalendarDay[]
}

export interface CookingSessionsResponse {
  data: CookingSession[]
}

export interface CreateCookingSessionInput {
  dishIds: string[]
  cookedAt: string
}