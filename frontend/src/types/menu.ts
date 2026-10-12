
export interface SavedMenuDish {
  id: string
  name: string
  category_id: string
  category: string
}

export interface SavedMenu {
  id: string
  created_at: string
  items: SavedMenuDish[]
}

export interface MenusResponse {
  data: SavedMenu[]
}

export interface MenuResponse {
  data: SavedMenu
}

export interface CreateCookingSessionInput {
  dishIds: string[]
  cookedAt: string
}
