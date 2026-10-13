export interface StatisticsOverview {
  total_sessions: number
  cooking_days: number
  total_dishes_cooked: number
  unique_dishes_cooked: number
}

export interface TimelineItem {
  period: string
  total_sessions: number
  total_dishes: number
}

export interface TopDishItem {
  dish_id: string
  dish_name: string
  category_name: string
  cooked_count: number
}

export interface CategoryStatisticsItem {
  category_id: string
  category_name: string
  cooked_count: number
  unique_dishes_cooked: number
}

export interface StatisticsFilters {
  from: string
  to: string
}
