import {
  findDishIngredients,
  replaceDishIngredients,
} from '../repositories/dish-ingredient.repository.js'

import type {
  DishIngredientInput,
} from '../repositories/dish-ingredient.repository.js'

export type { DishIngredientInput }

export async function getIngredientsOfDish(dishId: string) {
  return findDishIngredients(dishId)
}

export async function setIngredientsOfDish(
  dishId: string,
  ingredients: DishIngredientInput[],
) {
  const seenIds = new Set<string>()

  for (const item of ingredients) {
    if (
      !/^\d+$/.test(item.ingredient_id) ||
      BigInt(item.ingredient_id) <= 0n
    ) {
      throw new Error('ID nguyên liệu không hợp lệ.')
    }

    // Chuẩn hóa để tránh trường hợp ID "01" và "1" được xem là khác nhau.
    const normalizedId = BigInt(item.ingredient_id).toString()

    if (seenIds.has(normalizedId)) {
      throw new Error('Không được chọn trùng nguyên liệu.')
    }

    seenIds.add(normalizedId)

    if (
      !Number.isFinite(item.quantity_per_person) ||
      item.quantity_per_person <= 0
    ) {
      throw new Error('Định lượng phải lớn hơn 0.')
    }

    if (
      typeof item.unit !== 'string' ||
      !item.unit.trim() ||
      item.unit.trim().length > 30
    ) {
      throw new Error('Đơn vị phải có từ 1 đến 30 ký tự.')
    }

    if (
      item.ingredient_role !== 'main' &&
      item.ingredient_role !== 'minor'
    ) {
      throw new Error('Vai trò nguyên liệu không hợp lệ.')
    }

    if (typeof item.is_optional !== 'boolean') {
      throw new Error(
        'Trạng thái nguyên liệu tùy chọn không hợp lệ.',
      )
    }

    if (
      item.preparation_note !== null &&
      (
        typeof item.preparation_note !== 'string' ||
        item.preparation_note.trim().length > 500
      )
    ) {
      throw new Error(
        'Ghi chú sơ chế không được vượt quá 500 ký tự.',
      )
    }

    // Chuẩn hóa dữ liệu trước khi lưu.
    item.ingredient_id = normalizedId
    item.unit = item.unit.trim()
    item.preparation_note =
      item.preparation_note?.trim() || null
  }

  return replaceDishIngredients(dishId, ingredients)
}
