
import {
  findAllDishes,
  createDish as insertDish,
  updateDish as editDish,
  deactivateDish as disableDish,
} from '../repositories/dish.repository.js'

export async function getAllDishes() {
  return findAllDishes()
}

export async function addDish(name: string, categoryId: string) {
  return insertDish(name, categoryId)
}

export async function modifyDish(
  id: string,
  name: string,
  categoryId: string,
) {
  return editDish(id, name, categoryId)
}

export async function removeDish(id: string) {
  return disableDish(id)
}
