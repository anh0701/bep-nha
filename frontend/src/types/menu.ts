import type { Dish } from "./dish"

export interface SavedMenuDish extends Dish{
  id: string
  name: string
  category_id: string
  category: string
  has_allergen: boolean
}

export interface SavedMenu {
  id: string
  name: string | null
  source: 'random' | 'manual'
  created_at: string
  updated_at: string
  items: SavedMenuDish[]
}

export interface MenusResponse {
  data: SavedMenu[]
}

export interface MenuResponse {
  data: SavedMenu
}

export interface CreateManualMenuInput {
  name: string
  dishIds: string[]
}

export type UpdateManualMenuInput = CreateManualMenuInput

export interface CreateCookingSessionInput {
  dishIds: string[]
  cookedAt: string
}
