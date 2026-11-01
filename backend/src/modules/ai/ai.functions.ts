import type { FunctionDeclaration } from '@google/genai'

import {
  getAllDishes,
  getDishById,
  randomize,
  searchDishesByIngredients,
} from '../../services/dish.service.js'

import {
  getAllIngredients,
} from '../../services/ingredient.service.js'

import {
  getIngredientsOfDish,
} from '../../services/dish-ingredient.service.js'

import type {
  AiFunctionName,
} from './ai.types.js'

const MEAL_ROLES = [
  'main',
  'vegetable',
  'soup',
  'one_dish',
  'side',
] as const

export const AI_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'search_dishes',
    description:
      'Tìm món ăn trong kho Bếp Nhà theo tên, danh mục hoặc vai trò món ăn. Chỉ dùng khi người dùng muốn tìm món có trong ứng dụng.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description:
            'Từ khóa tìm kiếm theo tên món hoặc tên danh mục. Có thể bỏ trống.',
        },
        meal_role: {
          type: 'string',
          enum: [...MEAL_ROLES],
          description:
            'Vai trò món ăn: main (món chính), vegetable (món rau), soup (món canh), one_dish (món một món), side (món phụ).',
        },
      },
    },
  },
  {
    name: 'search_ingredients',
    description:
      'Tìm nguyên liệu đang hoạt động trong kho Bếp Nhà theo tên. Trả về ID và tên nguyên liệu để sử dụng cho chức năng tìm món theo nguyên liệu.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Tên hoặc từ khóa nguyên liệu cần tìm.',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_dish_by_ingredients',
    description:
      'Tìm các món ăn trong kho Bếp Nhà dựa trên danh sách ID nguyên liệu người dùng đang có. Cần tìm ID nguyên liệu bằng search_ingredients trước nếu chưa biết ID.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        ingredient_ids: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Danh sách ID nguyên liệu.',
        },
      },
      required: ['ingredient_ids'],
    },
  },
  {
    name: 'get_dish_detail',
    description:
      'Lấy thông tin chi tiết một món ăn trong kho Bếp Nhà, bao gồm danh sách nguyên liệu và định lượng.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        dish_id: {
          type: 'string',
          description: 'ID món ăn cần xem chi tiết.',
        },
      },
      required: ['dish_id'],
    },
  },
  {
    name: 'random_dishes',
    description:
      'Chọn ngẫu nhiên một món ăn hoặc tạo một thực đơn ngẫu nhiên bằng chức năng Random hiện có của Bếp Nhà.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['single', 'meal'],
          description:
            'single: chọn ngẫu nhiên một món; meal: tạo một thực đơn.',
        },
        meal_type: {
          type: 'string',
          enum: ['rice', 'one_dish', 'auto'],
          description:
            'Kiểu thực đơn: rice (bữa cơm), one_dish (bữa một món), auto (tự chọn). Chỉ áp dụng khi mode là meal.',
        },
      },
      required: ['mode'],
    },
  },
]

function getString(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = args[key]

  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()

  return normalized || undefined
}

function isValidId(value: string): boolean {
  return /^\d+$/.test(value) && BigInt(value) > 0n
}

function getRequiredId(
  args: Record<string, unknown>,
  key: string,
): string {
  const value = getString(args, key)

  if (!value || !isValidId(value)) {
    throw new Error(`ID ${key} không hợp lệ.`)
  }

  return BigInt(value).toString()
}

async function searchDishes(
  args: Record<string, unknown>,
) {
  const keyword = getString(args, 'keyword')?.toLocaleLowerCase('vi')
  const mealRole = getString(args, 'meal_role')

  if (
    mealRole &&
    !MEAL_ROLES.includes(mealRole as typeof MEAL_ROLES[number])
  ) {
    throw new Error('Vai trò món ăn không hợp lệ.')
  }

  const dishes = await getAllDishes()

  const results = dishes.filter((dish) => {
    const matchesKeyword =
      !keyword ||
      dish.name.toLocaleLowerCase('vi').includes(keyword) ||
      dish.category.toLocaleLowerCase('vi').includes(keyword)

    const matchesRole =
      !mealRole || dish.meal_role === mealRole

    return matchesKeyword && matchesRole
  })

  return {
    total: results.length,
    dishes: results.slice(0, 15).map((dish) => ({
      id: dish.id,
      name: dish.name,
      category: dish.category,
      meal_role: dish.meal_role,
    })),
  }
}

async function searchIngredients(
  args: Record<string, unknown>,
) {
  const keyword = getString(args, 'keyword')

  if (!keyword) {
    throw new Error('Vui lòng cung cấp tên nguyên liệu cần tìm.')
  }

  const ingredients = await getAllIngredients(keyword)

  const activeIngredients = ingredients
    .filter((ingredient) => ingredient.is_active)
    .slice(0, 20)

  return {
    total: activeIngredients.length,
    ingredients: activeIngredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.ingredient_category_name,
      is_allergen: ingredient.is_allergen,
    })),
  }
}

async function getDishesByIngredients(
  args: Record<string, unknown>,
) {
  const rawIds = args.ingredient_ids

  if (
    !Array.isArray(rawIds) ||
    rawIds.length === 0 ||
    rawIds.length > 50
  ) {
    throw new Error('Danh sách nguyên liệu không hợp lệ.')
  }

  const ingredientIds = rawIds.map((value) => {
    if (
      typeof value !== 'string' ||
      !isValidId(value)
    ) {
      throw new Error('ID nguyên liệu không hợp lệ.')
    }

    return BigInt(value).toString()
  })

  const uniqueIds = [...new Set(ingredientIds)]

  const dishes = await searchDishesByIngredients(uniqueIds)

  return {
    total: dishes.length,
    dishes: dishes.slice(0, 15),
  }
}

async function getDishDetail(
  args: Record<string, unknown>,
) {
  const dishId = getRequiredId(args, 'dish_id')

  const dish = await getDishById(dishId)

  if (!dish) {
    return {
      found: false,
      message: 'Không tìm thấy món ăn trong kho Bếp Nhà.',
    }
  }

  const ingredients = await getIngredientsOfDish(dishId)

  return {
    found: true,
    dish,
    ingredients,
  }
}

async function randomDishes(
  args: Record<string, unknown>,
) {
  const mode = getString(args, 'mode')
  const mealType = getString(args, 'meal_type')

  if (mode !== 'single' && mode !== 'meal') {
    throw new Error('Chế độ random không hợp lệ.')
  }

  if (
    mealType &&
    !['rice', 'one_dish', 'auto'].includes(mealType)
  ) {
    throw new Error('Kiểu thực đơn không hợp lệ.')
  }

  if (mode === 'single' && mealType) {
    throw new Error(
      'Chọn một món không cần chỉ định kiểu thực đơn.',
    )
  }

  return randomize({
    mode,
    ...(mealType
      ? {
          mealType: mealType as 'rice' | 'one_dish' | 'auto',
        }
      : {}),
  })
}

export async function executeAiFunction(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (name as AiFunctionName) {
    case 'search_dishes':
      return searchDishes(args)

    case 'search_ingredients':
      return searchIngredients(args)

    case 'get_dish_by_ingredients':
      return getDishesByIngredients(args)

    case 'get_dish_detail':
      return getDishDetail(args)

    case 'random_dishes':
      return randomDishes(args)

    default:
      throw new Error(`Function không được hỗ trợ: ${name}`)
  }
}