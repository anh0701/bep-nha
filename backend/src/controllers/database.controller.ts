
import type { Request, Response } from 'express'
import { getDatabaseStatus } from '../services/database.service.js'

export async function getDatabaseHealth(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const result = await getDatabaseStatus()
    res.status(200).json(result)
  } catch (error) {
    console.error('Database connection failed:', error)

    res.status(500).json({
      message: 'Cannot query database',
    })
  }
}
