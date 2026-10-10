
import { pool } from '../db/pool.js'

export interface Dish {
  id: string
  name: string
  category: string
  is_active: boolean
}

export async function findAllDishes(): Promise<Dish[]> {
  const result = await pool.query<Dish>(`
    SELECT
      d.id,
      d.name,
      c.name AS category,
      d.is_active
    FROM dishes d
    INNER JOIN categories c
      ON c.id = d.category_id
    WHERE d.is_active = TRUE
    ORDER BY c.name ASC, d.name ASC
  `)

  return result.rows
}
