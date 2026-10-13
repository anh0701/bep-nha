
import {
  getStatisticsOverview,
  getStatisticsTimeline,
  getStatisticsTopDishes,
  getStatisticsByCategory,
} from '../repositories/statistics.repository.js'

export interface StatisticsQuery {
  from: string
  to: string
  groupBy?: string
  limit?: string
}

function validateDate(value: string, field: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} phải có định dạng YYYY-MM-DD`)
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`${field} không phải ngày hợp lệ`)
  }
}

function validateRange(from: string, to: string): void {
  validateDate(from, 'from')
  validateDate(to, 'to')

  if (from >= to) {
    throw new Error('Ngày bắt đầu phải nhỏ hơn ngày kết thúc')
  }
}

export async function getOverview(query: StatisticsQuery) {
  validateRange(query.from, query.to)

  return getStatisticsOverview(query.from, query.to)
}

export async function getTimeline(query: StatisticsQuery) {
  validateRange(query.from, query.to)

  const groupBy = query.groupBy ?? 'day'

  if (!['day', 'week', 'month'].includes(groupBy)) {
    throw new Error('groupBy chỉ nhận day, week hoặc month')
  }

  return getStatisticsTimeline(
    query.from,
    query.to,
    groupBy as 'day' | 'week' | 'month',
  )
}

export async function getTopDishes(query: StatisticsQuery) {
  validateRange(query.from, query.to)

  const limit = query.limit === undefined
    ? 10
    : Number(query.limit)

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50
  ) {
    throw new Error('limit phải là số nguyên từ 1 đến 50')
  }

  return getStatisticsTopDishes(
    query.from,
    query.to,
    limit,
  )
}

export async function getCategoryStatistics(
  query: StatisticsQuery,
) {
  validateRange(query.from, query.to)

  return getStatisticsByCategory(query.from, query.to)
}
