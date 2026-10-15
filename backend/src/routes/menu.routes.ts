import { Router } from 'express'
import {
  createManualMenu,
  deleteSavedMenu,
  getMenuById,
  getMenus,
  updateSavedMenu,
} from '../controllers/menu.controller.js'

const router = Router()

router.get('/menus', getMenus)
router.get('/menus/:id', getMenuById)

router.post('/menus', createManualMenu)
router.put('/menus/:id', updateSavedMenu)
router.delete('/menus/:id', deleteSavedMenu)

export default router
