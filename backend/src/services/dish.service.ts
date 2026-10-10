
import { findAllDishes } from '../repositories/dish.repository.js'

export async function getAllDishes() {
  return findAllDishes()
}
