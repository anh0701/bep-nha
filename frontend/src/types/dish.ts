
export interface Dish {
  id: string
  name: string
  category_id: string
  category: string
  is_active: boolean
}

export interface DishListResponse {
  data: Dish[]
  total: number
}

export interface DishFormData {
  name: string
  category_id: string
}
