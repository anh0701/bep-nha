import {
  findAllDishes,
  createDish as insertDish,
  updateDish as editDish,
  deactivateDish as disableDish,
  findRandomCandidates,
  findDishById,
  findDishesByIngredients,
} from '../repositories/dish.repository.js'

import type { IngredientMatchDish, RandomDishCandidate } from '../repositories/dish.repository.js'

import { saveMenu } from '../repositories/menu.repository.js'

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


export type RandomMealType = 'rice' | 'one_dish' | 'auto'

export interface RandomOptions {
  mode: 'meal' | 'single'
  mealType?: RandomMealType
  categoryId?: string
  dishIds?: string[]
}

function weightedPick<T>(
  items: T[],
  getWeight: (item: T) => number,
): T | null {
  if (items.length === 0) return null

  const weights = items.map((item) => Math.max(0, getWeight(item)))
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)

  if (totalWeight <= 0) {
    return items[Math.floor(Math.random() * items.length)]
  }

  let value = Math.random() * totalWeight

  for (let i = 0; i < items.length; i++) {
    value -= weights[i]
    if (value < 0) return items[i]
  }

  return items[items.length - 1]
}

function getDishWeight(dish: RandomDishCandidate): number {
  const recentWeight = dish.cooked_recently ? 0.15 : 1
  const categoryCount = Number(dish.category_cook_count)

  return recentWeight / (1 + categoryCount)
}

function pickDish(
  dishes: RandomDishCandidate[],
): RandomDishCandidate | null {
  return weightedPick(dishes, getDishWeight)
}

async function saveMealResult<
  T extends { id: string },
  R extends {
    mode: 'meal'
    items: T[]
  },
>(result: R): Promise<R> {
  if (result.items.length === 0) {
    return result
  }

  await saveMenu(result.items.map((dish) => dish.id))

  return result
}

export async function randomize(options: RandomOptions) {
  if (options.categoryId && options.dishIds?.length) {
    throw new Error('Chỉ chọn danh mục hoặc danh sách món, không chọn cả hai.')
  }

  if (options.mode === 'single' && options.mealType) {
    throw new Error('Chế độ random một món không cần chọn kiểu bữa.')
  }

  const dishes = await findRandomCandidates(
    options.mode === 'single' ? options.categoryId : undefined,
    options.mode === 'single' ? options.dishIds : undefined,
  )

  if (options.mode === 'single') {
    const selected = pickDish(dishes)

    if (!selected) {
      return {
        mode: 'single' as const,
        items: [],
        message: 'Không có món phù hợp với lựa chọn hiện tại.',
      }
    }

    return {
      mode: 'single' as const,
      items: [selected],
    }
  }

  const requestedType = options.mealType ?? 'auto'

  const availableRiceMeal =
    dishes.some((dish) => dish.meal_role === 'main') &&
    dishes.some((dish) => dish.meal_role === 'vegetable') &&
    dishes.some((dish) => dish.meal_role === 'soup')

  const availableOneDish = dishes.some(
    (dish) => dish.meal_role === 'one_dish',
  )

  let selectedType: 'rice' | 'one_dish'

  if (requestedType === 'rice') {
    selectedType = 'rice'
  } else if (requestedType === 'one_dish') {
    selectedType = 'one_dish'
  } else {
    const availableTypes: Array<'rice' | 'one_dish'> = []

    if (availableRiceMeal) availableTypes.push('rice')
    if (availableOneDish) availableTypes.push('one_dish')

    if (availableTypes.length === 0) {
      return {
        mode: 'meal' as const,
        items: [],
        message: 'Chưa đủ dữ liệu để tạo một bữa ăn hoàn chỉnh.',
      }
    }

    selectedType =
      availableTypes[Math.floor(Math.random() * availableTypes.length)]
  }

  if (selectedType === 'one_dish') {
    const selected = pickDish(
      dishes.filter((dish) => dish.meal_role === 'one_dish'),
    )

    if (!selected) {
      return {
        mode: 'meal' as const,
        items: [],
        message: 'Chưa có món phù hợp cho bữa một món.',
      }
    }

    return saveMealResult({
      mode: 'meal' as const,
      mealType: 'one_dish' as const,
      items: [selected],
    })
  }

  const main = pickDish(
    dishes.filter((dish) => dish.meal_role === 'main'),
  )
  const vegetable = pickDish(
    dishes.filter((dish) => dish.meal_role === 'vegetable'),
  )
  const soup = pickDish(
    dishes.filter((dish) => dish.meal_role === 'soup'),
  )

  if (!main || !vegetable || !soup) {
    return {
      mode: 'meal' as const,
      items: [],
      message: 'Chưa đủ món chính, rau hoặc canh để tạo bữa cơm.',
    }
  }

  const sides = dishes.filter((dish) => dish.meal_role === 'side')
  const side = Math.random() < 0.5 ? pickDish(sides) : null

  return saveMealResult({
    mode: 'meal' as const,
    mealType: 'rice' as const,
    rice: true,
    items: [main, vegetable, soup, ...(side ? [side] : [])],
  })
}

export async function getDishById(id: string) {
  return findDishById(id)
}

export async function searchDishesByIngredients(
  ingredientIds: string[],
): Promise<IngredientMatchDish[]> {
  const uniqueIds = [...new Set(ingredientIds)]

  if (uniqueIds.length === 0) {
    return []
  }

  return findDishesByIngredients(uniqueIds)
}
