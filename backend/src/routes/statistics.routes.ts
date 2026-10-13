
import { Router } from 'express'

import {
  overview,
  timeline,
  topDishes,
  categories,
} from '../controllers/statistics.controller.js'

const router = Router()

router.get('/overview', overview)
router.get('/timeline', timeline)
router.get('/top-dishes', topDishes)
router.get('/categories', categories)

export default router
