
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, X } from 'lucide-react'

import { createDish, updateDish } from '../services/dish.service'
import type { Dish, DishFormData } from '../types/dish'
import type { Category } from '../types/category'
import CategorySelect from './CategorySelect'

interface DishFormModalProps {
  categories: Category[]
  dish: Dish | null
  onClose: () => void
  onSuccess: (dish: Dish) => void
}

export default function DishFormModal({
  categories,
  dish,
  onClose,
  onSuccess,
}: DishFormModalProps) {
  const [formData, setFormData] = useState<DishFormData>(() => ({
    name: dish?.name ?? '',
    category_id: dish?.category_id ?? categories[0]?.id ?? '',
  }))

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

    const payload: DishFormData = {
      name,
      category_id: formData.category_id,
    }

    try {
      setIsSubmitting(true)

      const savedDish = dish
        ? await updateDish(dish.id, payload)
        : await createDish(payload)

      onSuccess(savedDish)
      onClose()
    } catch (err) {
      console.error('Failed to save dish:', err)

      const message = err instanceof Error ? err.message : ''

      if (message.includes('already exists')) {
        setFormError('Tên món ăn này đã tồn tại trong hệ thống.')
      } else if (message.includes('Category does not exist')) {
        setFormError('Danh mục không tồn tại. Vui lòng chọn lại.')
      } else {
        setFormError(
          dish
            ? 'Không thể cập nhật món ăn. Vui lòng thử lại.'
            : 'Không thể thêm món ăn. Vui lòng thử lại.',
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
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
        className="w-full max-w-md rounded-2xl bg-cream p-6 shadow-xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="dish-form-title"
              className="text-xl font-bold text-ink"
            >
              {dish ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
            </h2>

            <p className="mt-1 text-sm text-muted">
              Bổ sung một món ăn vào kho bếp của bạn.
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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

          {formError && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
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
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={17} />
              {isSubmitting
                ? 'Đang lưu...'
                : dish
                  ? 'Lưu thay đổi'
                  : 'Lưu món ăn'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
