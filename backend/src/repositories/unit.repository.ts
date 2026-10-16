import { pool } from '../db/pool.js'

export interface Unit {
    id: string
    name: string
    symbol: string
    unit_type: 'mass' | 'volume' | 'count' | 'package'
}

export async function findAllUnits(): Promise<Unit[]> {
    const result = await pool.query<Unit>(`
        SELECT
            id::text AS id,
            name,
            symbol,
            unit_type
        FROM public.units
        ORDER BY
            CASE unit_type
                WHEN 'mass' THEN 1
                WHEN 'volume' THEN 2
                WHEN 'count' THEN 3
                WHEN 'package' THEN 4
                ELSE 5
            END,
            name ASC
    `)

    return result.rows
}