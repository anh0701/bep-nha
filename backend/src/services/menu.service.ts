import {
  findAllSavedMenus,
  findSavedMenuById,
  createManualMenu as createManualMenuRepository,
  updateSavedMenu as updateSavedMenuRepository,
  deleteSavedMenu as deleteSavedMenuRepository,
} from '../repositories/menu.repository.js'

export async function getAllSavedMenus() {
  return findAllSavedMenus()
}

export async function getSavedMenuById(id: string) {
  return findSavedMenuById(id)
}

export async function createManualMenu(
  name: string,
  dishIds: string[],
) {
  return createManualMenuRepository(name, dishIds)
}

export async function updateSavedMenu(
  id: string,
  name: string,
  dishIds: string[],
) {
  return updateSavedMenuRepository(id, name, dishIds)
}

export async function deleteSavedMenu(id: string) {
  return deleteSavedMenuRepository(id)
}
