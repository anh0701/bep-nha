
export interface Category {
  id: string
  name: string
}

export interface CategoryListResponse {
  data: Category[]
  total: number
}
