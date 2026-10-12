
import { pool } from '../db/pool.js'

export interface CookingSession {
  id: string
  cooked_at: Date
  created_at: Date
}

export interface CreateCookingSessionInput {
  dishIds: string[]
  cookedAt?: string
}

export async function createCookingSession(
  input: CreateCookingSessionInput,
): Promise<CookingSession> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Tạo một lần nấu.
    // Nếu không truyền thời gian, PostgreSQL dùng NOW().
    const sessionResult = input.cookedAt
      ? await client.query<CookingSession>(
          `
            INSERT INTO cooking_sessions (cooked_at)
            VALUES ($1::timestamptz)
            RETURNING
              id::text AS id,
              cooked_at,
              created_at
          `,
          [input.cookedAt],
        )
      : await client.query<CookingSession>(
          `
            INSERT INTO cooking_sessions
            DEFAULT VALUES
            RETURNING
              id::text AS id,
              cooked_at,
              created_at
          `,
        )

    const session = sessionResult.rows[0]

    // Lưu các món theo thứ tự frontend gửi lên.
    for (const [index, dishId] of input.dishIds.entries()) {
      await client.query(
        `
          INSERT INTO cooking_session_dishes (
            session_id,
            dish_id,
            position
          )
          VALUES ($1::bigint, $2::bigint, $3)
        `,
        [session.id, dishId, index + 1],
      )
    }

    await client.query('COMMIT')

    return session
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export interface CookingCalendarDay {
  cooked_on: string
  dishes: string[]
}

export interface CookingSessionWithDishes {
  id: string
  cooked_at: Date
  dishes: {
    id: string
    name: string
    category_id: string
    category: string
  }[]
}

export async function findCookingCalendar(
  month: string,
): Promise<CookingCalendarDay[]> {
  console.log('[repository] month =', month)
  console.log('[repository] typeof month =', typeof month)

  const result = await pool.query<CookingCalendarDay>(
    `
      SELECT
        (cs.cooked_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text
          AS cooked_on,
        ARRAY_AGG(DISTINCT d.name ORDER BY d.name) AS dishes
      FROM cooking_sessions cs
      JOIN cooking_session_dishes csd
        ON csd.session_id = cs.id
      JOIN dishes d
        ON d.id = csd.dish_id
      WHERE
        (cs.cooked_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
          >= $1::date
        AND
        (cs.cooked_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
          < ($1::date + INTERVAL '1 month')
      GROUP BY
        (cs.cooked_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ORDER BY cooked_on
    `,
    [`${month}-01`],
  )

  return result.rows
}

export async function findCookingSessionsByDate(
  date: string,
): Promise<CookingSessionWithDishes[]> {
  const result = await pool.query<CookingSessionWithDishes>(
    `
      SELECT
        cs.id::text AS id,
        cs.cooked_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', d.id::text,
              'name', d.name,
              'category_id', d.category_id::text,
              'category', c.name
            )
            ORDER BY csd.position
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'::json
        ) AS dishes
      FROM cooking_sessions cs
      LEFT JOIN cooking_session_dishes csd
        ON csd.session_id = cs.id
      LEFT JOIN dishes d
        ON d.id = csd.dish_id
      LEFT JOIN categories c
        ON c.id = d.category_id
      WHERE
        (cs.cooked_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = $1::date
      GROUP BY cs.id, cs.cooked_at
      ORDER BY cs.cooked_at DESC, cs.id DESC
    `,
    [date],
  )

  return result.rows
}


export async function findCookedDishIds(): Promise<string[]> {
  const result = await pool.query<{ dish_id: string }>(`
    SELECT DISTINCT dish_id::text AS dish_id
    FROM cooking_session_dishes
    ORDER BY dish_id
  `)

  return result.rows.map((row) => row.dish_id)
}


export interface UpdateCookingSessionInput {
  dishIds: string[]
  cookedAt: string
}

export async function updateCookingSession(
  id: string,
  input: UpdateCookingSessionInput,
): Promise<CookingSession | null> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const sessionResult = await client.query<CookingSession>(
      `
        UPDATE cooking_sessions
        SET cooked_at = $2::timestamptz
        WHERE id = $1::bigint
        RETURNING
          id::text AS id,
          cooked_at,
          created_at
      `,
      [id, input.cookedAt],
    )

    if (sessionResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return null
    }

    await client.query(
      `
        DELETE FROM cooking_session_dishes
        WHERE session_id = $1::bigint
      `,
      [id],
    )

    for (const [index, dishId] of input.dishIds.entries()) {
      await client.query(
        `
          INSERT INTO cooking_session_dishes (
            session_id,
            dish_id,
            position
          )
          VALUES ($1::bigint, $2::bigint, $3)
        `,
        [id, dishId, index + 1],
      )
    }

    await client.query('COMMIT')

    return sessionResult.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function deleteCookingSession(
  id: string,
): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM cooking_sessions
      WHERE id = $1::bigint
      RETURNING id
    `,
    [id],
  )

  return result.rowCount !== null && result.rowCount > 0
}
