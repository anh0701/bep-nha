import { randomUUID } from 'node:crypto'
import { pool } from '../db/pool.js'

export interface SavedMenu {
  id: string
  dish_signature: string
  created_at: Date
}

export interface SaveMenuResult {
  menu: SavedMenu
  reused: boolean
}

export interface SavedMenuDish {
  id: string
  name: string
  category_id: string
  category: string
  has_allergen: boolean
}

export interface SavedMenuWithDishes {
  id: string
  name: string | null
  source: 'random' | 'manual'
  created_at: Date
  updated_at: Date
  items: SavedMenuDish[]
}

export interface SavedMenuMutationResult {
  id: string
  name: string
  source: 'random' | 'manual'
  created_at: Date
  updated_at: Date
}

export interface CreateManualMenuResult {
  id: string
  name: string
  source: 'manual'
  created_at: Date
  updated_at: Date
}

/**
 * Lưu thực đơn random.
 * Các thực đơn có cùng tập hợp ID món sẽ dùng chung một bản ghi,
 * không phụ thuộc thứ tự các món.
 */
export async function saveMenu(
  dishIds: string[],
): Promise<SaveMenuResult> {
  const orderedIds = [...new Set(dishIds)]

  if (orderedIds.length === 0) {
    throw new Error('Cannot save an empty menu')
  }

  const signature = [...orderedIds]
    .sort((a, b) => {
      const idA = BigInt(a)
      const idB = BigInt(b)

      return idA < idB ? -1 : idA > idB ? 1 : 0
    })
    .join(',')

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const insertResult = await client.query<SavedMenu>(
      `
      INSERT INTO menus (dish_signature)
      VALUES ($1)
      ON CONFLICT (dish_signature) DO NOTHING
      RETURNING
        id::text AS id,
        dish_signature,
        created_at
      `,
      [signature],
    )

    let menu: SavedMenu
    let reused: boolean


    if (insertResult.rows.length > 0) {
      menu = insertResult.rows[0]
      reused = false

      // Đặt tên thực đơn theo ID vừa được tạo.
      await client.query(
        `
    UPDATE menus
    SET name = $2,
        updated_at = NOW()
    WHERE id = $1::bigint
    `,
        [menu.id, `Thực đơn #${menu.id}`],
      )

      for (const [index, dishId] of orderedIds.entries()) {
        await client.query(
          `
      INSERT INTO menu_dishes (menu_id, dish_id, position)
      VALUES ($1, $2, $3)
      `,
          [menu.id, dishId, index + 1],
        )
      }
    } else {
      const existingResult = await client.query<SavedMenu>(
        `
    SELECT
      id::text AS id,
      dish_signature,
      created_at
    FROM menus
    WHERE dish_signature = $1
    `,
        [signature],
      )

      if (existingResult.rows.length === 0) {
        throw new Error('Could not retrieve the existing menu')
      }

      menu = existingResult.rows[0]
      reused = true
    }

    await client.query('COMMIT')

    return { menu, reused }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Lấy danh sách thực đơn đã lưu.
 */
export async function findAllSavedMenus(): Promise<
  SavedMenuWithDishes[]
> {
  const result = await pool.query<SavedMenuWithDishes>(`
    SELECT
      m.id::text AS id,
      m.created_at,
      m.name,
      m.source,
      m.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', d.id::text,
            'name', d.name,
            'category_id', d.category_id::text,
            'category', c.name,
            'has_allergen',
            EXISTS (
                SELECT 1
                FROM dish_ingredients di
                JOIN allergen_ingredients ai
                    ON ai.ingredient_id = di.ingredient_id
                JOIN ingredients i
                    ON i.id = di.ingredient_id
                WHERE di.dish_id = d.id
                  AND i.is_active = TRUE
            )
          )
          ORDER BY md.position
        ) FILTER (WHERE d.id IS NOT NULL),
        '[]'::json
      ) AS items
    FROM menus m
    LEFT JOIN menu_dishes md
      ON md.menu_id = m.id
    LEFT JOIN dishes d
      ON d.id = md.dish_id
    LEFT JOIN categories c
      ON c.id = d.category_id
    GROUP BY m.id, m.created_at
    ORDER BY m.created_at DESC, m.id DESC, m.name, m.source, m.updated_at
  `)

  return result.rows
}

/**
 * Lấy chi tiết một thực đơn.
 */
export async function findSavedMenuById(
  id: string,
): Promise<SavedMenuWithDishes | null> {
  const result = await pool.query<SavedMenuWithDishes>(
    `
    SELECT
      m.id::text AS id,
      m.created_at,
      m.name,
      m.source,
      m.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', d.id::text,
            'name', d.name,
            'category_id', d.category_id::text,
            'category', c.name,
            'has_allergen',
            EXISTS (
                SELECT 1
                FROM dish_ingredients di
                JOIN allergen_ingredients ai
                    ON ai.ingredient_id = di.ingredient_id
                JOIN ingredients i
                    ON i.id = di.ingredient_id
                WHERE di.dish_id = d.id
                  AND i.is_active = TRUE
            )
          )
          ORDER BY md.position
        ) FILTER (WHERE d.id IS NOT NULL),
        '[]'::json
      ) AS items
    FROM menus m
    LEFT JOIN menu_dishes md
      ON md.menu_id = m.id
    LEFT JOIN dishes d
      ON d.id = md.dish_id
    LEFT JOIN categories c
      ON c.id = d.category_id
    WHERE m.id = $1::bigint
    GROUP BY m.id, m.name, m.source, m.created_at, m.updated_at
    `,
    [id],
  )

  return result.rows[0] ?? null
}

/**
 * Tạo thực đơn thủ công.
 */
export async function createManualMenu(
  name: string,
  dishIds: string[],
): Promise<CreateManualMenuResult> {
  const menuName = name.trim()
  const orderedIds = [...new Set(dishIds)]

  if (!menuName) {
    throw new Error('Tên thực đơn không được để trống.')
  }

  if (menuName.length > 100) {
    throw new Error('Tên thực đơn không được vượt quá 100 ký tự.')
  }

  if (orderedIds.length === 0) {
    throw new Error('Thực đơn phải có ít nhất một món.')
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const dishResult = await client.query<{ id: string }>(
      `
      SELECT id::text AS id
      FROM dishes
      WHERE id = ANY($1::bigint[])
        AND is_active = TRUE
      `,
      [orderedIds],
    )

    if (dishResult.rows.length !== orderedIds.length) {
      throw new Error(
        'Một hoặc nhiều món không tồn tại hoặc đã ngừng hoạt động.',
      )
    }

    // Chữ ký riêng, không trùng với chữ ký của thực đơn random.
    const signature = `manual:${randomUUID()}`

    const menuResult = await client.query<CreateManualMenuResult>(
      `
      INSERT INTO menus (
        name,
        source,
        dish_signature
      )
      VALUES ($1, 'manual', $2)
      RETURNING
        id::text AS id,
        name,
        source,
        created_at,
        updated_at
      `,
      [menuName, signature],
    )

    const menu = menuResult.rows[0]

    for (const [index, dishId] of orderedIds.entries()) {
      await client.query(
        `
        INSERT INTO menu_dishes (
          menu_id,
          dish_id,
          position
        )
        VALUES ($1, $2, $3)
        `,
        [menu.id, dishId, index + 1],
      )
    }

    await client.query('COMMIT')

    return menu
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Cập nhật thực đơn đã lưu, bất kể nguồn gốc random hay manual.
 * Khi người dùng chủ động chỉnh sửa, thực đơn chuyển thành manual.
 */
export async function updateSavedMenu(
  id: string,
  name: string,
  dishIds: string[],
): Promise<SavedMenuMutationResult | null> {
  const menuName = name.trim()
  const orderedIds = [...new Set(dishIds)]

  if (!menuName || menuName.length > 100) {
    throw new Error('Tên thực đơn phải có từ 1 đến 100 ký tự.')
  }

  if (orderedIds.length === 0) {
    throw new Error('Thực đơn phải có ít nhất một món.')
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const existing = await client.query<{ id: string }>(
      `
      SELECT id
      FROM menus
      WHERE id = $1::bigint
      FOR UPDATE
      `,
      [id],
    )

    if (existing.rows.length === 0) {
      await client.query('ROLLBACK')
      return null
    }

    const dishResult = await client.query<{ id: string }>(
      `
      SELECT id::text AS id
      FROM dishes
      WHERE id = ANY($1::bigint[])
        AND is_active = TRUE
      `,
      [orderedIds],
    )

    if (dishResult.rows.length !== orderedIds.length) {
      throw new Error(
        'Một hoặc nhiều món không tồn tại hoặc đã ngừng hoạt động.',
      )
    }

    const signature = `manual:${randomUUID()}`

    const menuResult = await client.query<SavedMenuMutationResult>(
      `
      UPDATE menus
      SET name = $2,
          source = 'manual',
          dish_signature = $3,
          updated_at = NOW()
      WHERE id = $1::bigint
      RETURNING
        id::text AS id,
        name,
        source,
        created_at,
        updated_at
      `,
      [id, menuName, signature],
    )

    await client.query(
      'DELETE FROM menu_dishes WHERE menu_id = $1::bigint',
      [id],
    )

    for (const [index, dishId] of orderedIds.entries()) {
      await client.query(
        `
        INSERT INTO menu_dishes (menu_id, dish_id, position)
        VALUES ($1, $2, $3)
        `,
        [id, dishId, index + 1],
      )
    }

    await client.query('COMMIT')

    return menuResult.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Xóa thực đơn random hoặc manual.
 */
export async function deleteSavedMenu(
  id: string,
): Promise<boolean> {
  const result = await pool.query(
    `
    DELETE FROM menus
    WHERE id = $1::bigint
    RETURNING id
    `,
    [id],
  )

  return result.rowCount === 1
}
