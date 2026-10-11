
import { Router } from 'express'
import { getMenuById, getMenus } from '../controllers/menu.controller.js'

const router = Router()

router.get('/menus', getMenus)
router.get('/menus/:id', getMenuById)


export default router
