
import { Router } from 'express'

import {
  getDishes,
  createDish,
  updateDish,
  deleteDish,
  randomDishes,
} from '../controllers/dish.controller.js'

const router = Router()

router.post('/random', randomDishes)

router.get('/dishes', getDishes)
router.post('/dishes', createDish)
router.put('/dishes/:id', updateDish)
router.delete('/dishes/:id', deleteDish)

export default router
