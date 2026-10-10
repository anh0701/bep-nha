
import { Router } from 'express'
import { getDishes } from '../controllers/dish.controller.js'

const router = Router()

router.get('/dishes', getDishes)

export default router
