
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


export interface RandomDishCandidate extends Dish {
  meal_role: 'main' | 'vegetable' | 'soup' | 'one_dish' | 'side'
  category_cook_count: string
  cooked_recently: boolean
  allergen_warnings: string[]
}

export async function findRandomCandidates(
  categoryId?: string,
  dishIds?: string[],
): Promise<RandomDishCandidate[]> {
  const result = await pool.query<RandomDishCandidate>(
    `
    WITH category_history AS (
      SELECT
        d.category_id,
        COUNT(cr.id) AS cook_count
      FROM cooking_records cr
      INNER JOIN dishes d ON d.id = cr.dish_id
      WHERE cr.cooked_on >= CURRENT_DATE - 29
        AND cr.cooked_on <= CURRENT_DATE
      GROUP BY d.category_id
    ),
    dish_history AS (
      SELECT
        dish_id,
        MAX(cooked_on) AS last_cooked_on
      FROM cooking_records
      GROUP BY dish_id
    )
    SELECT
      d.id::text AS id,
      d.name,
      d.category_id::text AS category_id,
      c.name AS category,
      d.is_active,
      d.meal_role,
      COALESCE(ch.cook_count, 0)::text AS category_cook_count,
      COALESCE(
        dh.last_cooked_on >= CURRENT_DATE - 2,
        FALSE
      ) AS cooked_recently,

      COALESCE(
      (
        SELECT ARRAY_AGG(DISTINCT i.name ORDER BY i.name)
        FROM dish_ingredients di
        INNER JOIN ingredients i
          ON i.id = di.ingredient_id
        WHERE di.dish_id = d.id
          AND di.ingredient_role = 'minor'
          AND EXISTS (
            SELECT 1
            FROM allergen_ingredients ai
            WHERE ai.ingredient_id = i.id
          )
        ),
        ARRAY[]::text[]
      ) AS allergen_warnings

    FROM dishes d
    INNER JOIN categories c
      ON c.id = d.category_id
    LEFT JOIN category_history ch
      ON ch.category_id = d.category_id
    LEFT JOIN dish_history dh
      ON dh.dish_id = d.id

    WHERE d.is_active = TRUE
      AND d.meal_role IS NOT NULL

      -- Loại món có ít nhất một nguyên liệu chính gây dị ứng.
      AND NOT EXISTS (
        SELECT 1
        FROM dish_ingredients di
        INNER JOIN allergen_ingredients ai
          ON ai.ingredient_id = di.ingredient_id
        WHERE di.dish_id = d.id
          AND di.ingredient_role = 'main'
      )

      AND ($1::bigint IS NULL OR d.category_id = $1::bigint)
      AND ($2::bigint[] IS NULL OR d.id = ANY($2::bigint[]))

    ORDER BY d.id
    `,
    [categoryId ?? null, dishIds ?? null],
  )

  return result.rows
}

export async function findDishById(id: string): Promise<Dish | null> {
  const result = await pool.query<Dish>(
    `
    SELECT
      d.id,
      d.name,
      d.category_id,
      c.name AS category,
      d.is_active
    FROM dishes d
    INNER JOIN categories c ON c.id = d.category_id
    WHERE d.id = $1
      AND d.is_active = TRUE
    `,
    [id],
  )

  return result.rows[0] ?? null
}
