
import { pool } from '../db/pool.js'

export interface Category {
  id: string
  name: string
}

export async function findAllCategories(): Promise<Category[]> {
  const result = await pool.query<Category>(`
    SELECT id, name
    FROM categories
    ORDER BY name ASC
  `)

  return result.rows
}
