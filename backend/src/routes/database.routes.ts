
import { Router } from 'express'
import { getDatabaseHealth } from '../controllers/database.controller.js'

const router = Router()

router.get('/db-check', getDatabaseHealth)

export default router
