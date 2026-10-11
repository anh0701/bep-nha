
import {
  findAllSavedMenus,
  findSavedMenuById,
} from '../repositories/menu.repository.js'

export async function getAllSavedMenus() {
  return findAllSavedMenus()
}

export async function getSavedMenuById(id: string) {
  return findSavedMenuById(id)
}
