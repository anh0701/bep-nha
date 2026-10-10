
import { pool } from '../db/pool.js'

export interface Dish {
  id: string
  name: string
  category_id: string
  category: string
  is_active: boolean
}

export async function findAllDishes(): Promise<Dish[]> {
  const result = await pool.query<Dish>(`
    SELECT
      d.id,
      d.name,
      d.category_id,
      c.name AS category,
      d.is_active
    FROM dishes d
    INNER JOIN categories c ON c.id = d.category_id
    WHERE d.is_active = TRUE
    ORDER BY d.name ASC
  `)

  return result.rows
}

export async function createDish(
  name: string,
  categoryId: string,
): Promise<Dish> {
  const result = await pool.query<Dish>(
    `WITH inserted AS (
       INSERT INTO dishes (name, category_id)
       VALUES ($1, $2)
       RETURNING id, name, category_id, is_active
     )
     SELECT
       i.id,
       i.name,
       i.category_id,
       c.name AS category,
       i.is_active
     FROM inserted i
     INNER JOIN categories c ON c.id = i.category_id`,
    [name, categoryId],
  )

  return result.rows[0]
}

export async function updateDish(
  id: string,
  name: string,
  categoryId: string,
): Promise<Dish | null> {
  const result = await pool.query<Dish>(
    `WITH updated AS (
       UPDATE dishes
       SET name = $2, category_id = $3
       WHERE id = $1 AND is_active = TRUE
       RETURNING id, name, category_id, is_active
     )
     SELECT
       u.id,
       u.name,
       u.category_id,
       c.name AS category,
       u.is_active
     FROM updated u
     INNER JOIN categories c ON c.id = u.category_id`,
    [id, name, categoryId],
  )

  return result.rows[0] ?? null
}

export async function deactivateDish(id: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE dishes
     SET is_active = FALSE
     WHERE id = $1 AND is_active = TRUE
     RETURNING id`,
    [id],
  )

  return result.rowCount === 1
}
