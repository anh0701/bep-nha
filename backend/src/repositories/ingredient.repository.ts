import { pool } from '../db/pool.js'
import type { PoolClient } from 'pg'
import { Ingredient, IngredientInput, IngredientPaginationParams, PaginatedIngredients } from '../models/ingredient.model.js'

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
    i.default_unit_id::text AS default_unit_id,
    u.symbol AS default_unit,
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
  JOIN public.units u
    ON u.id = i.default_unit_id
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

export async function findIngredientsPaginated({
  page,
  limit,
  search,
  categoryId,
}: IngredientPaginationParams): Promise<PaginatedIngredients> {
  const offset = (page - 1) * limit
  const keyword = search?.trim() || null
  const categoryIdValue =
    categoryId && categoryId !== 'all'
      ? categoryId
      : null

  const [itemsResult, countResult] = await Promise.all([
    pool.query<Ingredient>(
      `
      ${ingredientSelect}
      WHERE (
        $1::text IS NULL
        OR i.name ILIKE '%' || $1 || '%'
        OR ic.name ILIKE '%' || $1 || '%'
      )
      AND (
        $2::bigint IS NULL
        OR i.ingredient_category_id = $2::bigint
      )
      ORDER BY i.name ASC
      LIMIT $3 OFFSET $4
      `,
      [keyword, categoryIdValue, limit, offset],
    ),

    pool.query<{ total: string }>(
      `
      SELECT COUNT(*) AS total
      FROM ingredients i
      JOIN ingredient_categories ic
        ON ic.id = i.ingredient_category_id
      WHERE (
        $1::text IS NULL
        OR i.name ILIKE '%' || $1 || '%'
        OR ic.name ILIKE '%' || $1 || '%'
      )
      AND (
        $2::bigint IS NULL
        OR i.ingredient_category_id = $2::bigint
      )
      `,
      [keyword, categoryIdValue],
    ),
  ])

  const totalItems = Number(countResult.rows[0].total)

  return {
    data: itemsResult.rows,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  }
}

export async function getIngredientStatsRepository() {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS total_ingredients,
      COUNT(*) FILTER (WHERE is_active = TRUE)::int
        AS active_ingredients
    FROM ingredients
  `)

  return result.rows[0]
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
    default_unit,
    default_unit_id
  )
  SELECT
    $1,
    $2::bigint,
    u.symbol,
    u.id
  FROM public.units u
  WHERE u.id = $3::bigint
  RETURNING id::text AS id
  `,
  [
    input.name,
    input.ingredient_category_id,
    input.default_unit_id,
  ],
)

if (!result.rows[0]) {
  throw new Error('Đơn vị mặc định không hợp lệ.')
}

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
  UPDATE ingredients i
  SET
    name = $2,
    ingredient_category_id = $3::bigint,
    default_unit = u.symbol,
    default_unit_id = u.id,
    updated_at = NOW()
  FROM public.units u
  WHERE i.id = $1::bigint
    AND u.id = $4::bigint
  RETURNING i.id::text AS id
  `,
  [
    id,
    input.name,
    input.ingredient_category_id,
    input.default_unit_id,
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
