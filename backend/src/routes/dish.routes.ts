
import { Router } from 'express'

import {
  getDishes,
  createDish,
  updateDish,
  deleteDish,
  randomDishes,
} from '../controllers/dish.controller.js'

import {
  getDishIngredients,
  updateDishIngredients,
} from '../controllers/dish-ingredient.controller.js'

const router = Router()

router.post('/random', randomDishes)

router.get('/dishes', getDishes)
router.post('/dishes', createDish)
router.put('/dishes/:id', updateDish)
router.delete('/dishes/:id', deleteDish)

router.get('/dishes/:id/ingredients', getDishIngredients)
router.put('/dishes/:id/ingredients', updateDishIngredients)


export default router
