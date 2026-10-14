import {
  findAllIngredients,
  findIngredientById,
  createIngredient as insertIngredient,
  updateIngredient as editIngredient,
  setIngredientStatus as changeIngredientStatus,
} from '../repositories/ingredient.repository.js'

import type {
  IngredientInput,
} from '../repositories/ingredient.repository.js'

function normalizeInput(
  input: IngredientInput,
): IngredientInput {
  return {
    name: input.name.trim(),
    ingredient_category_id: input.ingredient_category_id.trim(),
    default_unit: input.default_unit.trim(),
  }
}

function validateInput(input: IngredientInput): void {
  if (!input.name) {
    throw new Error('Tên nguyên liệu không được để trống.')
  }

  if (input.name.length > 100) {
    throw new Error('Tên nguyên liệu không được vượt quá 100 ký tự.')
  }

  if (
    !/^\d+$/.test(input.ingredient_category_id) ||
    BigInt(input.ingredient_category_id) <= 0n
  ) {
    throw new Error('Danh mục nguyên liệu không hợp lệ.')
  }

  if (!input.default_unit) {
    throw new Error('Đơn vị mặc định không được để trống.')
  }

  if (input.default_unit.length > 30) {
    throw new Error('Đơn vị mặc định không được vượt quá 30 ký tự.')
  }
}

export async function getAllIngredients(search?: string) {
  return findAllIngredients(search)
}

export async function getIngredientById(id: string) {
  return findIngredientById(id)
}

export async function addIngredient(input: IngredientInput) {
  const normalized = normalizeInput(input)
  validateInput(normalized)

  return insertIngredient(normalized)
}

export async function modifyIngredient(
  id: string,
  input: IngredientInput,
) {
  const normalized = normalizeInput(input)
  validateInput(normalized)

  return editIngredient(id, normalized)
}

export async function modifyIngredientStatus(
  id: string,
  isActive: boolean,
) {
  return changeIngredientStatus(id, isActive)
}
