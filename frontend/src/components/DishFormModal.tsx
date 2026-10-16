
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, X } from 'lucide-react'

import { createDish, updateDish } from '../services/dish.service'
import { setDishIngredients } from '../services/dish-ingredient.service'

import type { Dish, DishFormData, MealRole } from '../types/dish'
import type { DishIngredientInput } from '../types/dish-ingredient'
import type { Category } from '../types/category'

import CategorySelect from './CategorySelect'
import DishIngredientsEditor from './DishIngredientsEditor'
import type { DishIngredientsEditorHandle } from './DishIngredientsEditor'

interface DishFormModalProps {
  categories: Category[]
  dish: Dish | null
  onClose: () => void
  onSuccess: (dish: Dish) => void
}

type DishFormState = Omit<DishFormData, 'meal_role'> & {
  meal_role: MealRole | ''
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : ''
}

function getDishSaveError(error: unknown, isEditing: boolean): string {
  const message = getErrorMessage(error)

  if (message.includes('already exists')) {
    return 'Tên món ăn này đã tồn tại trong hệ thống.'
  }

  if (message.includes('Category does not exist')) {
    return 'Danh mục không tồn tại. Vui lòng chọn lại.'
  }

  return isEditing
    ? 'Không thể cập nhật món ăn. Vui lòng thử lại.'
    : 'Không thể thêm món ăn. Vui lòng thử lại.'
}

export default function DishFormModal({
  categories,
  dish,
  onClose,
  onSuccess,
}: DishFormModalProps) {
  const [formData, setFormData] = useState<DishFormState>(() => ({
    name: dish?.name ?? '',
    category_id: dish?.category_id ?? categories[0]?.id ?? '',
    meal_role: dish?.meal_role ?? '',
  }))

  // Giữ món đã lưu nếu bước lưu nguyên liệu gặp lỗi.
  const [savedDish, setSavedDish] = useState<Dish | null>(dish)

  const ingredientEditorRef = useRef<DishIngredientsEditorHandle>(null)
  const [areIngredientsReady, setAreIngredientsReady] = useState(false)

  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleClose() {
    if (isSubmitting) return
    onClose()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const name = formData.name.trim()

    if (!name) {
      setFormError('Vui lòng nhập tên món ăn.')
      return
    }

    if (name.length > 200) {
      setFormError('Tên món ăn không được vượt quá 200 ký tự.')
      return
    }

    if (!formData.category_id) {
      setFormError('Vui lòng chọn danh mục.')
      return
    }

    if (!formData.meal_role) {
      setFormError('Vui lòng chọn vai trò trong bữa ăn.')
      return
    }

    if (!areIngredientsReady) {
      setFormError(
        'Chưa tải được dữ liệu nguyên liệu. Vui lòng tải lại trước khi lưu.',
      )
      return
    }

    const ingredientPayload: DishIngredientInput[] | null =
      ingredientEditorRef.current?.validate() ?? null

    if (!ingredientPayload) return

    const payload: DishFormData = {
      name,
      category_id: formData.category_id,
      meal_role: formData.meal_role,
    }

    try {
      setIsSubmitting(true)

      let currentDish = savedDish

      try {
        currentDish = currentDish
          ? await updateDish(currentDish.id, payload)
          : await createDish(payload)
      } catch (error) {
        setFormError(getDishSaveError(error, Boolean(currentDish)))
        return
      }

      setSavedDish(currentDish)
      onSuccess(currentDish)

      try {
        await setDishIngredients(currentDish.id, ingredientPayload)
      } catch (error) {
        console.error('Failed to save dish ingredients:', error)

        const message = getErrorMessage(error)

        setFormError(
          `Thông tin món ăn đã được lưu, nhưng danh sách nguyên liệu chưa lưu được.${
            message ? ` Chi tiết: ${message}` : ''
          } Bạn có thể thử lưu lại.`,
        )
        return
      }

      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-3 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-form-title"
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-cream p-5 shadow-xl sm:p-7"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4">
          <div>
            <h2 id="dish-form-title" className="text-xl font-bold text-ink">
              {savedDish ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
            </h2>

            <p className="mt-1 text-sm text-muted">
              Cập nhật thông tin món ăn và nguyên liệu cần chuẩn bị.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Đóng form"
            className="rounded-lg p-2 text-muted transition hover:bg-beige disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-5 flex min-h-0 flex-1 flex-col"
        >
          {/* Khu vực cuộn */}
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain pr-1 pb-4">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-ink">
                Thông tin món ăn
              </h3>

              <div className="space-y-2">
                <label
                  htmlFor="dish-name"
                  className="block text-sm font-medium text-ink"
                >
                  Tên món ăn
                </label>

                <input
                  id="dish-name"
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Canh bí đỏ"
                  maxLength={200}
                  required
                  autoFocus
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-beige bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-forest disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="dish-category"
                  className="block text-sm font-medium text-ink"
                >
                  Danh mục
                </label>

                <CategorySelect
                  id="dish-category"
                  categories={categories}
                  value={formData.category_id}
                  onChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      category_id: value,
                    }))
                  }
                  placeholder="Chọn danh mục"
                  ariaLabel="Danh mục món ăn"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="dish-meal-role"
                  className="block text-sm font-medium text-ink"
                >
                  Vai trò trong bữa ăn
                </label>

                <select
                  id="dish-meal-role"
                  value={formData.meal_role}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      meal_role: event.target.value as MealRole | '',
                    }))
                  }
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-beige bg-white px-4 py-3 text-sm text-ink outline-none focus:border-forest disabled:opacity-60"
                >
                  <option value="" disabled>
                    Chọn vai trò trong bữa ăn
                  </option>
                  <option value="main">Món chính</option>
                  <option value="vegetable">Món rau</option>
                  <option value="soup">Món canh</option>
                  <option value="one_dish">Món ăn một mình</option>
                  <option value="side">Món ăn kèm</option>
                </select>

                <p className="text-xs leading-5 text-muted">
                  Vai trò này được dùng để chọn món phù hợp khi tạo thực đơn
                  ngẫu nhiên.
                </p>
              </div>
            </section>

            {/* Component quản lý nguyên liệu */}
            <DishIngredientsEditor
              ref={ingredientEditorRef}
              dishId={dish?.id}
              disabled={isSubmitting}
              onReadyChange={setAreIngredientsReady}
            />

            {formError && (
              <p
                role="alert"
                className="whitespace-pre-wrap rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {formError}
              </p>
            )}
          </div>

          {/* Footer luôn nằm ngoài vùng cuộn */}
          <div className="mt-3 flex shrink-0 flex-col-reverse gap-3 border-t border-beige bg-cream pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-beige px-4 py-3 text-sm font-semibold text-ink transition hover:bg-beige disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !areIngredientsReady}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={17} />
              {isSubmitting
                ? 'Đang lưu...'
                : savedDish
                  ? 'Lưu thay đổi'
                  : 'Lưu món ăn'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
