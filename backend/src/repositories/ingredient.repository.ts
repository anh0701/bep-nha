import { pool } from '../db/pool.js'

export interface Ingredient {
  id: string
  name: string
  ingredient_category_id: string
  ingredient_category_name: string
  default_unit: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface IngredientInput {
  name: string
  ingredient_category_id: string
  default_unit: string
}

export async function findAllIngredients(
  search?: string,
): Promise<Ingredient[]> {
  const result = await pool.query<Ingredient>(
    `
    SELECT
      i.id::text AS id,
      i.name,
      i.ingredient_category_id::text AS ingredient_category_id,
      ic.name AS ingredient_category_name,
      i.default_unit,
      i.is_active,
      i.created_at,
      i.updated_at
    FROM ingredients i
    JOIN ingredient_categories ic
      ON ic.id = i.ingredient_category_id
    WHERE (
      $1::text IS NULL
      OR i.name ILIKE '%' || $1 || '%'
      OR ic.name ILIKE '%' || $1 || '%'
    )
    ORDER BY i.is_active DESC, i.name ASC
    `,
    [search?.trim() || null],
  )

  return result.rows
}

export async function findIngredientById(
  id: string,
): Promise<Ingredient | null> {
  const result = await pool.query<Ingredient>(
    `
    SELECT
      i.id::text AS id,
      i.name,
      i.ingredient_category_id::text AS ingredient_category_id,
      ic.name AS ingredient_category_name,
      i.default_unit,
      i.is_active,
      i.created_at,
      i.updated_at
    FROM ingredients i
    JOIN ingredient_categories ic
      ON ic.id = i.ingredient_category_id
    WHERE i.id = $1::bigint
    `,
    [id],
  )

  return result.rows[0] ?? null
}

export async function createIngredient(
  input: IngredientInput,
): Promise<Ingredient> {
  const result = await pool.query<Ingredient>(
    `
    INSERT INTO ingredients (
      name,
      ingredient_category_id,
      default_unit
    )
    VALUES ($1, $2::bigint, $3)
    RETURNING
      id::text AS id,
      name,
      ingredient_category_id::text AS ingredient_category_id,
      default_unit,
      is_active,
      created_at,
      updated_at
    `,
    [
      input.name,
      input.ingredient_category_id,
      input.default_unit,
    ],
  )

  const ingredient = result.rows[0]

  return (await findIngredientById(ingredient.id))!
}

export async function updateIngredient(
  id: string,
  input: IngredientInput,
): Promise<Ingredient | null> {
  const result = await pool.query<{ id: string }>(
    `
    UPDATE ingredients
    SET
      name = $2,
      ingredient_category_id = $3::bigint,
      default_unit = $4,
      updated_at = NOW()
    WHERE id = $1::bigint
    RETURNING id::text AS id
    `,
    [
      id,
      input.name,
      input.ingredient_category_id,
      input.default_unit,
    ],
  )

  if (!result.rows[0]) {
    return null
  }

  return findIngredientById(id)
}

export async function setIngredientStatus(
  id: string,
  isActive: boolean,
): Promise<Ingredient | null> {
  const result = await pool.query(
    `
    UPDATE ingredients
    SET
      is_active = $2,
      updated_at = NOW()
    WHERE id = $1::bigint
    `,
    [id, isActive],
  )

  if (result.rowCount === 0) {
    return null
  }

  return findIngredientById(id)
}
