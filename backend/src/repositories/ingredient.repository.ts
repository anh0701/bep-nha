import { pool } from '../db/pool.js'
import type { PoolClient } from 'pg'

export interface Ingredient {
  id: string
  name: string
  ingredient_category_id: string
  ingredient_category_name: string
  default_unit: string
  is_active: boolean
  is_allergen: boolean
  created_at: Date
  updated_at: Date
}

export interface IngredientInput {
  name: string
  ingredient_category_id: string
  default_unit: string
  is_allergen?: boolean
}

async function syncAllergenStatus(
  client: PoolClient,
  ingredientId: string,
  isAllergen: boolean,
): Promise<void> {
  if (isAllergen) {
    await client.query(
      `
      INSERT INTO allergen_ingredients (ingredient_id)
      VALUES ($1::bigint)
      ON CONFLICT (ingredient_id) DO NOTHING
      `,
      [ingredientId],
    )
    return
  }

  await client.query(
    `
    DELETE FROM allergen_ingredients
    WHERE ingredient_id = $1::bigint
    `,
    [ingredientId],
  )
}

const ingredientSelect = `
  SELECT
    i.id::text AS id,
    i.name,
    i.ingredient_category_id::text AS ingredient_category_id,
    ic.name AS ingredient_category_name,
    i.default_unit,
    i.is_active,
    EXISTS (
      SELECT 1
      FROM allergen_ingredients ai
      WHERE ai.ingredient_id = i.id
    ) AS is_allergen,
    i.created_at,
    i.updated_at
  FROM ingredients i
  JOIN ingredient_categories ic
    ON ic.id = i.ingredient_category_id
`

export async function findAllIngredients(
  search?: string,
): Promise<Ingredient[]> {
  const result = await pool.query<Ingredient>(
    `
    ${ingredientSelect}
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

export async function findAllergenIngredients(
  search?: string,
): Promise<Ingredient[]> {
  const result = await pool.query<Ingredient>(
    `
    ${ingredientSelect}
    WHERE EXISTS (
      SELECT 1
      FROM allergen_ingredients ai
      WHERE ai.ingredient_id = i.id
    )
    AND (
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
    ${ingredientSelect}
    WHERE i.id = $1::bigint
    `,
    [id],
  )

  return result.rows[0] ?? null
}

export async function createIngredient(
  input: IngredientInput,
): Promise<Ingredient> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const result = await client.query<{ id: string }>(
      `
      INSERT INTO ingredients (
        name,
        ingredient_category_id,
        default_unit
      )
      VALUES ($1, $2::bigint, $3)
      RETURNING id::text AS id
      `,
      [
        input.name,
        input.ingredient_category_id,
        input.default_unit,
      ],
    )

    const ingredientId = result.rows[0].id

    await syncAllergenStatus(
      client,
      ingredientId,
      input.is_allergen ?? false,
    )

    await client.query('COMMIT')

    const ingredient = await findIngredientById(ingredientId)

    if (!ingredient) {
      throw new Error('Không tìm thấy nguyên liệu sau khi tạo.')
    }

    return ingredient
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function updateIngredient(
  id: string,
  input: IngredientInput,
): Promise<Ingredient | null> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const result = await client.query<{ id: string }>(
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
      await client.query('ROLLBACK')
      return null
    }

    // Nếu request có gửi trạng thái thì cập nhật.
    // Nếu không gửi, giữ nguyên trạng thái dị ứng hiện tại.
    if (typeof input.is_allergen === 'boolean') {
      await syncAllergenStatus(
        client,
        id,
        input.is_allergen,
      )
    }

    await client.query('COMMIT')

    return findIngredientById(id)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
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
