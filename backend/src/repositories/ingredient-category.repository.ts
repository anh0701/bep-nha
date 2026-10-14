import { pool } from '../db/pool.js'

export interface IngredientCategory {
  id: string
  name: string
  created_at: Date
}

export async function findAllIngredientCategories():
Promise<IngredientCategory[]> {
  const result = await pool.query<IngredientCategory>(
    `
    SELECT
      id::text AS id,
      name,
      created_at
    FROM ingredient_categories
    ORDER BY name ASC
    `,
  )

  return result.rows
}
