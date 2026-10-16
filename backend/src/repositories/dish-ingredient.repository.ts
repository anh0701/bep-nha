import { pool } from '../db/pool.js'

export type IngredientRole = 'main' | 'minor'

export interface DishIngredient {
  ingredient_id: string
  ingredient_name: string
  ingredient_category_id: string
  ingredient_category_name: string
  quantity_per_person: number
  unit_id: string
  unit: string
  unit_name: string
  ingredient_role: IngredientRole
  is_optional: boolean
  preparation_note: string | null
  is_allergen: boolean
}

export interface DishIngredientInput {
  ingredient_id: string
  quantity_per_person: number
  unit_id: string
  ingredient_role: IngredientRole
  is_optional: boolean
  preparation_note: string | null
}

export async function findDishIngredients(
  dishId: string,
): Promise<DishIngredient[] | null> {
  const dishResult = await pool.query(
    `
    SELECT id
    FROM dishes
    WHERE id = $1::bigint
      AND is_active = TRUE
    `,
    [dishId],
  )

  if (dishResult.rows.length === 0) {
    return null
  }

  const result = await pool.query<DishIngredient>(
    `
    SELECT
      di.ingredient_id::text AS ingredient_id,
      i.name AS ingredient_name,
      i.ingredient_category_id::text AS ingredient_category_id,
      ic.name AS ingredient_category_name,
      di.quantity_per_person,
      u.id::text AS unit_id,
      u.symbol AS unit,
      u.name AS unit_name,
      di.ingredient_role,
      di.is_optional,
      di.preparation_note,
      EXISTS (
        SELECT 1
        FROM allergen_ingredients ai
        WHERE ai.ingredient_id = i.id
      ) AS is_allergen
    FROM dish_ingredients di
    INNER JOIN ingredients i
      ON i.id = di.ingredient_id
    INNER JOIN ingredient_categories ic
      ON ic.id = i.ingredient_category_id
    INNER JOIN units u
      ON u.id = di.unit_id
    WHERE di.dish_id = $1::bigint
    ORDER BY
      CASE di.ingredient_role
        WHEN 'main' THEN 0
        ELSE 1
      END,
      i.name ASC
    `,
    [dishId],
  )

  return result.rows.map((item) => ({
    ...item,
    quantity_per_person: Number(item.quantity_per_person),
  }))
}

export async function replaceDishIngredients(
  dishId: string,
  ingredients: DishIngredientInput[],
): Promise<DishIngredient[] | null> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const dishResult = await client.query(
      `
      SELECT id
      FROM dishes
      WHERE id = $1::bigint
        AND is_active = TRUE
      FOR UPDATE
      `,
      [dishId],
    )

    if (dishResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return null
    }

    if (ingredients.length > 0) {
      const ingredientIds = ingredients.map(
        (item) => item.ingredient_id,
      )

      const uniqueIngredientIds = [...new Set(ingredientIds)]

      const activeIngredients = await client.query<{ id: string }>(
        `
        SELECT id::text AS id
        FROM ingredients
        WHERE id = ANY($1::bigint[])
          AND is_active = TRUE
        `,
        [uniqueIngredientIds],
      )

      if (activeIngredients.rows.length !== uniqueIngredientIds.length) {
        throw new Error(
          'Một hoặc nhiều nguyên liệu không tồn tại hoặc đã ngừng hoạt động.',
        )
      }

      const unitIds = ingredients.map((item) => item.unit_id)
      const uniqueUnitIds = [...new Set(unitIds)]

      const existingUnits = await client.query<{ id: string }>(
        `
        SELECT id::text AS id
        FROM units
        WHERE id = ANY($1::bigint[])
        `,
        [uniqueUnitIds],
      )

      if (existingUnits.rows.length !== uniqueUnitIds.length) {
        throw new Error('Một hoặc nhiều đơn vị không tồn tại.')
      }
    }

    // Thay thế toàn bộ danh sách nguyên liệu của món trong một transaction.
    await client.query(
      `
      DELETE FROM dish_ingredients
      WHERE dish_id = $1::bigint
      `,
      [dishId],
    )

    for (const item of ingredients) {
      await client.query(
        `
        INSERT INTO dish_ingredients (
          dish_id,
          ingredient_id,
          quantity_per_person,
          unit_id,
          ingredient_role,
          is_optional,
          preparation_note
        )
        VALUES (
          $1::bigint,
          $2::bigint,
          $3,
          $4::bigint,
          $5,
          $6,
          $7
        )
        `,
        [
          dishId,
          item.ingredient_id,
          item.quantity_per_person,
          item.unit_id,
          item.ingredient_role,
          item.is_optional,
          item.preparation_note,
        ],
      )
    }

    const result = await client.query<DishIngredient>(
      `
      SELECT
        di.ingredient_id::text AS ingredient_id,
        i.name AS ingredient_name,
        i.ingredient_category_id::text AS ingredient_category_id,
        ic.name AS ingredient_category_name,
        di.quantity_per_person,
        u.id::text AS unit_id,
        u.symbol AS unit,
        u.name AS unit_name,
        di.ingredient_role,
        di.is_optional,
        di.preparation_note,
        EXISTS (
          SELECT 1
          FROM allergen_ingredients ai
          WHERE ai.ingredient_id = i.id
        ) AS is_allergen
      FROM dish_ingredients di
      INNER JOIN ingredients i
        ON i.id = di.ingredient_id
      INNER JOIN ingredient_categories ic
        ON ic.id = i.ingredient_category_id
      INNER JOIN units u
        ON u.id = di.unit_id
      WHERE di.dish_id = $1::bigint
      ORDER BY
        CASE di.ingredient_role
          WHEN 'main' THEN 0
          ELSE 1
        END,
        i.name ASC
      `,
      [dishId],
    )

    await client.query('COMMIT')

    return result.rows.map((item) => ({
      ...item,
      quantity_per_person: Number(item.quantity_per_person),
    }))
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
