
export interface Dish {
  id: string
  name: string
  category: string
  is_active: boolean
}

export interface DishListResponse {
  data: Dish[]
  total: number
}
