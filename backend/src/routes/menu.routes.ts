
import { Router } from 'express'
import { createManualMenu, deleteManualMenu, getMenuById, getMenus, updateManualMenu } from '../controllers/menu.controller.js'

const router = Router()

router.get('/menus', getMenus)
router.get('/menus/:id', getMenuById)

router.post('/menus', createManualMenu)
router.put('/menus/:id', updateManualMenu)
router.delete('/menus/:id', deleteManualMenu)


export default router
