import {
  findAllIngredientCategories,
} from '../repositories/ingredient-category.repository.js'

export async function getAllIngredientCategories() {
  return findAllIngredientCategories()
}
