
import { findAllCategories } from '../repositories/category.repository.js'

export async function getAllCategories() {
  return findAllCategories()
}
