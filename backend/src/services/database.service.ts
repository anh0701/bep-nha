
import { pool } from '../db/pool.js'

export async function getDatabaseStatus() {
  const result = await pool.query(`
    SELECT
      current_database() AS database_name,
      (SELECT COUNT(*)::int FROM dishes) AS dish_count
  `)

  return result.rows[0]
}
