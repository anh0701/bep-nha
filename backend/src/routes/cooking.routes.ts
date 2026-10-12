
import { Router } from 'express'
import { postCookingSession, getCookingCalendar, getCookingSessionsByDate, getCookedDishIds } from '../controllers/cooking.controller.js'

const router = Router()

router.post('/cooking-sessions', postCookingSession)
router.get('/cooking-sessions/calendar', getCookingCalendar)
router.get('/cooking-sessions/by-date', getCookingSessionsByDate)
router.get('/cooking-sessions/cooked-dishes', getCookedDishIds)

export default router
