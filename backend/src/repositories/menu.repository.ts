
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

export async function saveMenu(
  dishIds: string[],
): Promise<SaveMenuResult> {
  // Loại bỏ ID trùng và giữ thứ tự món ban đầu.
  const orderedIds = [...new Set(dishIds)]

  if (orderedIds.length === 0) {
    throw new Error('Cannot save an empty menu')
  }

  // Chữ ký chỉ phụ thuộc vào tập hợp ID, không phụ thuộc thứ tự.
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

    // Nếu chữ ký đã tồn tại, PostgreSQL không tạo bản ghi mới.
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

      // Chỉ thêm món khi thực đơn thực sự được tạo mới.
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
      // Thực đơn đã tồn tại: lấy bản ghi cũ và giữ nguyên ngày tạo.
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


export interface SavedMenuDish {
  id: string
  name: string
  category_id: string
  category: string
}

export interface SavedMenuWithDishes {
  id: string
  created_at: Date
  items: SavedMenuDish[]
}

export async function findAllSavedMenus(): Promise<SavedMenuWithDishes[]> {
  const result = await pool.query<SavedMenuWithDishes>(`
    SELECT
      m.id::text AS id,
      m.created_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', d.id::text,
            'name', d.name,
            'category_id', d.category_id::text,
            'category', c.name
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
    ORDER BY m.created_at DESC, m.id DESC
  `)

  return result.rows
}


export async function findSavedMenuById(
  id: string,
): Promise<SavedMenuWithDishes | null> {
  const result = await pool.query<SavedMenuWithDishes>(
    `
    SELECT
      m.id::text AS id,
      m.created_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', d.id::text,
            'name', d.name,
            'category_id', d.category_id::text,
            'category', c.name
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
    GROUP BY m.id, m.created_at
    `,
    [id],
  )

  return result.rows[0] ?? null
}
