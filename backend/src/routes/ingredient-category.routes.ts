import { Router } from 'express'
import {
  getIngredientCategories,
} from '../controllers/ingredient-category.controller.js'

const router = Router()

router.get('/', getIngredientCategories)

export default router
