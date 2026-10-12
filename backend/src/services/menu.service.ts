
import {
  findAllSavedMenus,
  findSavedMenuById,
} from '../repositories/menu.repository.js'

import {
  createManualMenu as createManualMenuRepository,
  updateManualMenu as updateManualMenuRepository,
  deleteManualMenu as deleteManualMenuRepository,
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

export async function updateManualMenu(
  id: string,
  name: string,
  dishIds: string[],
) {
  return updateManualMenuRepository(id, name, dishIds)
}

export async function deleteManualMenu(id: string) {
  return deleteManualMenuRepository(id)
}