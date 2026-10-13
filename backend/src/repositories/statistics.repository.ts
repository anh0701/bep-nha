
import { pool } from '../db/pool.js'

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

const TIME_ZONE = 'Asia/Ho_Chi_Minh'

function getDateRangeCondition() {
  return `
    cs.cooked_at >= (
      $1::date::timestamp AT TIME ZONE '${TIME_ZONE}'
    )
    AND cs.cooked_at < (
      $2::date::timestamp AT TIME ZONE '${TIME_ZONE}'
    )
  `
}

export async function getStatisticsOverview(
  from: string,
  to: string,
): Promise<StatisticsOverview> {
  const result = await pool.query<StatisticsOverview>(
    `
      SELECT
        COUNT(DISTINCT cs.id)::int AS total_sessions,

        COUNT(
          DISTINCT (cs.cooked_at AT TIME ZONE '${TIME_ZONE}')::date
        )::int AS cooking_days,

        COUNT(csd.dish_id)::int AS total_dishes_cooked,

        COUNT(DISTINCT csd.dish_id)::int AS unique_dishes_cooked

      FROM cooking_sessions cs
      LEFT JOIN cooking_session_dishes csd
        ON csd.session_id = cs.id

      WHERE ${getDateRangeCondition()}
    `,
    [from, to],
  )

  return result.rows[0]
}

export async function getStatisticsTimeline(
  from: string,
  to: string,
  groupBy: 'day' | 'week' | 'month' = 'day',
): Promise<TimelineItem[]> {
  // Chỉ dùng các biểu thức đã cho phép, không đưa input tùy ý
  // của người dùng vào SQL.
  const periodExpression = {
    day: `(cs.cooked_at AT TIME ZONE '${TIME_ZONE}')::date`,
    week: `date_trunc(
      'week', cs.cooked_at AT TIME ZONE '${TIME_ZONE}'
    )::date`,
    month: `date_trunc(
      'month', cs.cooked_at AT TIME ZONE '${TIME_ZONE}'
    )::date`,
  }[groupBy]

  const result = await pool.query<TimelineItem>(
    `
      SELECT
        ${periodExpression}::text AS period,
        COUNT(DISTINCT cs.id)::int AS total_sessions,
        COUNT(csd.dish_id)::int AS total_dishes

      FROM cooking_sessions cs
      LEFT JOIN cooking_session_dishes csd
        ON csd.session_id = cs.id

      WHERE ${getDateRangeCondition()}

      GROUP BY ${periodExpression}
      ORDER BY ${periodExpression}
    `,
    [from, to],
  )

  return result.rows
}

export async function getStatisticsTopDishes(
  from: string,
  to: string,
  limit = 10,
): Promise<TopDishItem[]> {
  const result = await pool.query<TopDishItem>(
    `
      SELECT
        d.id::text AS dish_id,
        d.name AS dish_name,
        c.name AS category_name,
        COUNT(DISTINCT cs.id)::int AS cooked_count

      FROM cooking_sessions cs
      JOIN cooking_session_dishes csd
        ON csd.session_id = cs.id
      JOIN dishes d
        ON d.id = csd.dish_id
      JOIN categories c
        ON c.id = d.category_id

      WHERE ${getDateRangeCondition()}

      GROUP BY d.id, d.name, c.name
      ORDER BY cooked_count DESC, d.name ASC
      LIMIT $3
    `,
    [from, to, limit],
  )

  return result.rows
}

export async function getStatisticsByCategory(
  from: string,
  to: string,
): Promise<CategoryStatisticsItem[]> {
  const result = await pool.query<CategoryStatisticsItem>(
    `
      SELECT
        c.id::text AS category_id,
        c.name AS category_name,
        COUNT(csd.dish_id)::int AS cooked_count,
        COUNT(DISTINCT csd.dish_id)::int
          AS unique_dishes_cooked

      FROM categories c

      LEFT JOIN dishes d
        ON d.category_id = c.id

      LEFT JOIN cooking_session_dishes csd
        ON csd.dish_id = d.id

      LEFT JOIN cooking_sessions cs
        ON cs.id = csd.session_id
        AND ${getDateRangeCondition()}

      GROUP BY c.id, c.name
      ORDER BY cooked_count DESC, c.name ASC
    `,
    [from, to],
  )

  return result.rows
}
