import { Router } from 'express'

import {
  getIngredients,
  getAllergens,
  getIngredient,
  createIngredient,
  updateIngredient,
  updateIngredientStatus,
} from '../controllers/ingredient.controller.js'
import { getUnits } from '../controllers/unit.controller.js'

const router = Router()

router.get('/units', getUnits)
router.get('/ingredients', getIngredients)
router.get('/allergens', getAllergens)
router.get('/ingredients/:id', getIngredient)

router.post('/ingredients', createIngredient)
router.put('/ingredients/:id', updateIngredient)
router.patch('/ingredients/:id/status', updateIngredientStatus)

export default router
