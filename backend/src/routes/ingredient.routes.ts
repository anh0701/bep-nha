
import { Router } from 'express'

import {
  getIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  updateIngredientStatus,
} from '../controllers/ingredient.controller.js'

const router = Router()

router.get('/ingredients', getIngredients)
router.get('/ingredients/:id', getIngredient)

router.post('/ingredients', createIngredient)
router.put('/ingredients/:id', updateIngredient)
router.patch('/ingredients/:id/status', updateIngredientStatus)

export default router
