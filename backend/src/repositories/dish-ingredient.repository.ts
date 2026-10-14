
import { pool } from '../db/pool.js'

export type IngredientRole = 'main' | 'minor'

export interface DishIngredient {
    ingredient_id: string
    ingredient_name: string
    ingredient_group: string | null
    quantity_per_person: number
    unit: string
    ingredient_role: IngredientRole
    is_optional: boolean
    preparation_note: string | null
}

export interface DishIngredientInput {
    ingredient_id: string
    quantity_per_person: number
    unit: string
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
      i.ingredient_group,
      di.quantity_per_person,
      di.unit,
      di.ingredient_role,
      di.is_optional,
      di.preparation_note
    FROM dish_ingredients di
    INNER JOIN ingredients i
      ON i.id = di.ingredient_id
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

        // Khóa bản ghi món trong thời gian cập nhật.
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

            const activeIngredients = await client.query<{ id: string }>(
                `
        SELECT id::text AS id
        FROM ingredients
        WHERE id = ANY($1::bigint[])
          AND is_active = TRUE
        `,
                [ingredientIds],
            )

            if (activeIngredients.rows.length !== ingredientIds.length) {
                throw new Error(
                    'Một hoặc nhiều nguyên liệu không tồn tại hoặc đã ngừng hoạt động.',
                )
            }
        }

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
          unit,
          ingredient_role,
          is_optional,
          preparation_note
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
                [
                    dishId,
                    item.ingredient_id,
                    item.quantity_per_person,
                    item.unit,
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
        i.ingredient_group,
        di.quantity_per_person,
        di.unit,
        di.ingredient_role,
        di.is_optional,
        di.preparation_note
      FROM dish_ingredients di
      INNER JOIN ingredients i
        ON i.id = di.ingredient_id
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
