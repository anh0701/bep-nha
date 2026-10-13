import type { CategoryStatisticsItem, StatisticsFilters, StatisticsOverview, TimelineItem, TopDishItem } from "../types/statistics"

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '')

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    throw new Error(`Không thể tải dữ liệu thống kê (${response.status})`)
  }

  return response.json() as Promise<T>
}

function buildQuery(filters: StatisticsFilters): string {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
  })

  return params.toString()
}

export function getStatisticsOverview(filters: StatisticsFilters) {
  return request<StatisticsOverview>(
    `/statistics/overview?${buildQuery(filters)}`,
  )
}

export function getStatisticsTimeline(
  filters: StatisticsFilters,
  groupBy: 'day' | 'week' | 'month' = 'day',
) {
  const query = new URLSearchParams({
    ...filters,
    groupBy,
  })

  return request<TimelineItem[]>(
    `/statistics/timeline?${query.toString()}`,
  )
}

export function getStatisticsTopDishes(
  filters: StatisticsFilters,
  limit = 10,
) {
  const query = new URLSearchParams({
    ...filters,
    limit: String(limit),
  })

  return request<TopDishItem[]>(
    `/statistics/top-dishes?${query.toString()}`,
  )
}

export function getStatisticsByCategory(filters: StatisticsFilters) {
  return request<CategoryStatisticsItem[]>(
    `/statistics/categories?${buildQuery(filters)}`,
  )
}
