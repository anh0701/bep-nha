
import type { Request, Response } from 'express'

import {
  getOverview,
  getTimeline,
  getTopDishes,
  getCategoryStatistics,
} from '../services/statistics.service.js'

function getQuery(req: Request) {
  const { from, to, groupBy, limit } = req.query

  if (
    typeof from !== 'string' ||
    typeof to !== 'string' ||
    (groupBy !== undefined && typeof groupBy !== 'string') ||
    (limit !== undefined && typeof limit !== 'string')
  ) {
    throw new Error('Tham số truy vấn không hợp lệ')
  }

  return { from, to, groupBy, limit }
}

export async function overview(
  req: Request,
  res: Response,
) {
  const data = await getOverview(getQuery(req))
  res.json(data)
}

export async function timeline(
  req: Request,
  res: Response,
) {
  const data = await getTimeline(getQuery(req))
  res.json(data)
}

export async function topDishes(
  req: Request,
  res: Response,
) {
  const data = await getTopDishes(getQuery(req))
  res.json(data)
}

export async function categories(
  req: Request,
  res: Response,
) {
  const data = await getCategoryStatistics(getQuery(req))
  res.json(data)
}
