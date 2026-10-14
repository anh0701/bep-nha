
import { pool } from '../db/pool.js'

export interface Ingredient {
  id: string
  name: string
  ingredient_group: string | null
  default_unit: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface IngredientInput {
  name: string
  ingredient_group: string | null
  default_unit: string
}

export async function findAllIngredients(
  search?: string,
): Promise<Ingredient[]> {
  const result = await pool.query<Ingredient>(
    `
    SELECT
      id::text AS id,
      name,
      ingredient_group,
      default_unit,
      is_active,
      created_at,
      updated_at
    FROM ingredients
    WHERE (
      $1::text IS NULL
      OR name ILIKE '%' || $1 || '%'
      OR ingredient_group ILIKE '%' || $1 || '%'
    )
    ORDER BY is_active DESC, name ASC
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
      id::text AS id,
      name,
      ingredient_group,
      default_unit,
      is_active,
      created_at,
      updated_at
    FROM ingredients
    WHERE id = $1::bigint
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
      ingredient_group,
      default_unit
    )
    VALUES ($1, $2, $3)
    RETURNING
      id::text AS id,
      name,
      ingredient_group,
      default_unit,
      is_active,
      created_at,
      updated_at
    `,
    [
      input.name,
      input.ingredient_group,
      input.default_unit,
    ],
  )

  return result.rows[0]
}

export async function updateIngredient(
  id: string,
  input: IngredientInput,
): Promise<Ingredient | null> {
  const result = await pool.query<Ingredient>(
    `
    UPDATE ingredients
    SET
      name = $2,
      ingredient_group = $3,
      default_unit = $4,
      updated_at = NOW()
    WHERE id = $1::bigint
    RETURNING
      id::text AS id,
      name,
      ingredient_group,
      default_unit,
      is_active,
      created_at,
      updated_at
    `,
    [
      id,
      input.name,
      input.ingredient_group,
      input.default_unit,
    ],
  )

  return result.rows[0] ?? null
}

export async function setIngredientStatus(
  id: string,
  isActive: boolean,
): Promise<Ingredient | null> {
  const result = await pool.query<Ingredient>(
    `
    UPDATE ingredients
    SET
      is_active = $2,
      updated_at = NOW()
    WHERE id = $1::bigint
    RETURNING
      id::text AS id,
      name,
      ingredient_group,
      default_unit,
      is_active,
      created_at,
      updated_at
    `,
    [id, isActive],
  )

  return result.rows[0] ?? null
}
