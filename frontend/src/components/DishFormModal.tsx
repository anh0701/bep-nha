
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ChevronDown,
  Plus,
  Trash2,
  Utensils,
  X,
} from 'lucide-react'

import { createDish, updateDish } from '../services/dish.service'
import {
  getDishIngredients,
  setDishIngredients,
} from '../services/dish-ingredient.service'
import { getIngredients } from '../services/ingredient.service'

import type { Dish, DishFormData } from '../types/dish'
import type { Category } from '../types/category'
import type { Ingredient } from '../types/ingredient'
import type {
  DishIngredient,
  DishIngredientInput,
} from '../services/dish-ingredient.service'
import type { IngredientRole } from '../types/dish-ingredient'

import CategorySelect from './CategorySelect'

interface DishFormModalProps {
  categories: Category[]
  dish: Dish | null
  onClose: () => void
  onSuccess: (dish: Dish) => void
}

interface IngredientRow {
  ingredient_id: string
  quantity_per_person: string
  unit: string
  ingredient_role: IngredientRole
  is_optional: boolean
  preparation_note: string
}

function toIngredientRow(item: DishIngredient): IngredientRow {
  return {
    ingredient_id: item.ingredient_id,
    quantity_per_person: String(item.quantity_per_person),
    unit: item.unit,
    ingredient_role: item.ingredient_role,
    is_optional: item.is_optional,
    preparation_note: item.preparation_note ?? '',
  }
}

function createEmptyIngredientRow(): IngredientRow {
  return {
    ingredient_id: '',
    quantity_per_person: '',
    unit: '',
    ingredient_role: 'main',
    is_optional: false,
    preparation_note: '',
  }
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
  const [formData, setFormData] = useState<DishFormData>(() => ({
    name: dish?.name ?? '',
    category_id: dish?.category_id ?? categories[0]?.id ?? '',
  }))

  // Giữ lại món đã lưu nếu bước lưu nguyên liệu gặp lỗi.
  const [savedDish, setSavedDish] = useState<Dish | null>(dish)

  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([])
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(true)
  const [ingredientLoadError, setIngredientLoadError] = useState<string | null>(
    null,
  )
  const [loadVersion, setLoadVersion] = useState(0)

  // Chỉ mở một nguyên liệu tại một thời điểm.
  const [expandedIngredientIndex, setExpandedIngredientIndex] = useState<
    number | null
  >(null)

  const ingredientRowRefs = useRef(
    new Map<number, HTMLDivElement>(),
  )
  const ingredientListRef = useRef<HTMLDivElement>(null)
  const pendingScrollIndexRef = useRef<number | null>(null)

  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadIngredientData() {
      setIsLoadingIngredients(true)
      setIngredientLoadError(null)

      try {
        const [ingredientResult, dishIngredientResult] = await Promise.all([
          getIngredients(),
          dish
            ? getDishIngredients(dish.id)
            : Promise.resolve({ data: [], total: 0 }),
        ])

        if (cancelled) return

        setIngredients(
          ingredientResult.data.filter((ingredient) => ingredient.is_active),
        )
        setIngredientRows(dishIngredientResult.data.map(toIngredientRow))
        setExpandedIngredientIndex(null)
      } catch (error) {
        if (cancelled) return

        console.error('Failed to load dish ingredients:', error)
        setIngredientLoadError(
          'Không thể tải kho nguyên liệu hoặc nguyên liệu đã gán. Vui lòng thử lại.',
        )
      } finally {
        if (!cancelled) {
          setIsLoadingIngredients(false)
        }
      }
    }

    void loadIngredientData()

    return () => {
      cancelled = true
    }
  }, [dish, loadVersion])

  // Khi mở một dòng hoặc thêm nguyên liệu mới, tự cuộn để dòng đó
  // nằm trong vùng nhìn thấy, thay vì để người dùng tìm thủ công.
  useEffect(() => {
    if (expandedIngredientIndex === null) return

    const pendingIndex = pendingScrollIndexRef.current
    const shouldScroll = pendingIndex === expandedIngredientIndex

    if (shouldScroll) {
      pendingScrollIndexRef.current = null

      requestAnimationFrame(() => {
        ingredientRowRefs.current
          .get(expandedIngredientIndex)
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          })
      })
    }
  }, [expandedIngredientIndex, ingredientRows.length])

  function handleClose() {
    if (isSubmitting) return
    onClose()
  }

  function updateIngredientRow(
    index: number,
    patch: Partial<IngredientRow>,
  ) {
    setIngredientRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    )
  }

  function handleIngredientChange(index: number, ingredientId: string) {
    const selectedIngredient = ingredients.find(
      (ingredient) => ingredient.id === ingredientId,
    )

    updateIngredientRow(index, {
      ingredient_id: ingredientId,
      unit: selectedIngredient?.default_unit ?? '',
    })
  }

  function addIngredientRow() {
    const newIndex = ingredientRows.length

    pendingScrollIndexRef.current = newIndex

    setIngredientRows((current) => [
      ...current,
      createEmptyIngredientRow(),
    ])

    setExpandedIngredientIndex(newIndex)
  }

  function toggleIngredientRow(index: number) {
    if (expandedIngredientIndex === index) {
      setExpandedIngredientIndex(null)
      return
    }

    pendingScrollIndexRef.current = index
    setExpandedIngredientIndex(index)
  }

  function removeIngredientRow(index: number) {
    setIngredientRows((current) =>
      current.filter((_, rowIndex) => rowIndex !== index),
    )

    ingredientRowRefs.current.delete(index)
    pendingScrollIndexRef.current = null

    setExpandedIngredientIndex((current) => {
      if (current === null) return null
      if (current === index) return null
      return current > index ? current - 1 : current
    })
  }

  function validateIngredients(): DishIngredientInput[] | null {
    const seenIngredientIds = new Set<string>()
    const result: DishIngredientInput[] = []

    for (let index = 0; index < ingredientRows.length; index += 1) {
      const row = ingredientRows[index]
      const rowNumber = index + 1

      if (!row.ingredient_id) {
        setExpandedIngredientIndex(index)
        setFormError(`Vui lòng chọn nguyên liệu ở dòng ${rowNumber}.`)
        return null
      }

      if (seenIngredientIds.has(row.ingredient_id)) {
        setExpandedIngredientIndex(index)
        setFormError(
          'Một nguyên liệu không thể được thêm nhiều lần. Hãy gộp định lượng vào cùng một dòng.',
        )
        return null
      }

      seenIngredientIds.add(row.ingredient_id)

      const quantity = Number(row.quantity_per_person)
      const unit = row.unit.trim()
      const note = row.preparation_note.trim()

      if (
        row.quantity_per_person.trim() === '' ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        setExpandedIngredientIndex(index)
        setFormError(
          `Định lượng ở dòng ${rowNumber} phải là số lớn hơn 0.`,
        )
        return null
      }

      if (!unit || unit.length > 30) {
        setExpandedIngredientIndex(index)
        setFormError(
          `Đơn vị ở dòng ${rowNumber} phải có từ 1 đến 30 ký tự.`,
        )
        return null
      }

      if (note.length > 500) {
        setExpandedIngredientIndex(index)
        setFormError(
          `Ghi chú ở dòng ${rowNumber} không được vượt quá 500 ký tự.`,
        )
        return null
      }

      result.push({
        ingredient_id: row.ingredient_id,
        quantity_per_person: quantity,
        unit,
        ingredient_role: row.ingredient_role,
        is_optional: row.is_optional,
        preparation_note: note || null,
      })
    }

    return result
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

    if (isLoadingIngredients || ingredientLoadError) {
      setFormError(
        'Chưa tải được dữ liệu nguyên liệu. Vui lòng tải lại trước khi lưu.',
      )
      return
    }

    const ingredientPayload = validateIngredients()

    if (!ingredientPayload) return

    const payload: DishFormData = {
      name,
      category_id: formData.category_id,
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
          `Thông tin món ăn đã được lưu, nhưng danh sách nguyên liệu chưa lưu được.${message ? ` Chi tiết: ${message}` : ''} Bạn có thể thử lưu lại.`,
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
          {/* Chỉ khu vực này cuộn, header và footer được giữ lại. */}
          <div
            ref={ingredientListRef}
            className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain pr-1 pb-4"
          >
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
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Nguyên liệu và định lượng
                    {ingredientRows.length > 0 && (
                      <span className="ml-2 rounded-full bg-sage/70 px-2 py-0.5 text-xs font-medium text-forest">
                        {ingredientRows.length}
                      </span>
                    )}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    Định lượng cho một người. Bấm vào nguyên liệu để chỉnh sửa.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addIngredientRow}
                  disabled={
                    isSubmitting ||
                    isLoadingIngredients ||
                    Boolean(ingredientLoadError) ||
                    ingredients.length === 0
                  }
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-forest/20 px-3 py-2.5 text-sm font-semibold text-forest transition hover:bg-sage/60 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} />
                  Thêm nguyên liệu
                </button>
              </div>

              {isLoadingIngredients ? (
                <p className="rounded-xl bg-white px-4 py-5 text-sm text-muted">
                  Đang tải kho nguyên liệu...
                </p>
              ) : ingredientLoadError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <p className="text-sm text-red-700">
                    {ingredientLoadError}
                  </p>

                  <button
                    type="button"
                    onClick={() => setLoadVersion((version) => version + 1)}
                    disabled={isSubmitting}
                    className="mt-3 text-sm font-semibold text-red-700 underline disabled:opacity-50"
                  >
                    Tải lại dữ liệu
                  </button>
                </div>
              ) : ingredients.length === 0 ? (
                <div className="rounded-xl border border-dashed border-beige bg-white/60 px-4 py-5">
                  <p className="text-sm text-muted">
                    Kho nguyên liệu chưa có nguyên liệu đang hoạt động. Hãy
                    thêm nguyên liệu trong mục Kho nguyên liệu trước nhé.
                  </p>
                </div>
              ) : ingredientRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-beige bg-white/60 px-4 py-6 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-sage/60 text-forest">
                    <Utensils size={19} />
                  </div>

                  <p className="mt-3 text-sm text-muted">
                    Chưa có nguyên liệu nào được gán cho món này.
                  </p>

                  <button
                    type="button"
                    onClick={addIngredientRow}
                    className="mt-2 text-sm font-semibold text-forest hover:underline"
                  >
                    Thêm nguyên liệu đầu tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {ingredientRows.map((row, index) => {
                    const selectedIngredient = ingredients.find(
                      (ingredient) => ingredient.id === row.ingredient_id,
                    )

                    const isExpanded = expandedIngredientIndex === index

                    return (
                      <div
                        key={`${row.ingredient_id || 'new'}-${index}`}
                        ref={(element) => {
                          if (element) {
                            ingredientRowRefs.current.set(index, element)
                          } else {
                            ingredientRowRefs.current.delete(index)
                          }
                        }}
                        className={`overflow-hidden rounded-xl border bg-white transition-colors ${
                          isExpanded
                            ? 'border-forest/40 shadow-sm'
                            : 'border-beige hover:border-forest/25'
                        }`}
                      >
                        {/* Header thu gọn của nguyên liệu */}
                        <div className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
                          <button
                            type="button"
                            onClick={() => toggleIngredientRow(index)}
                            aria-expanded={isExpanded}
                            aria-controls={`ingredient-panel-${index}`}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sage/60 text-xs font-semibold text-forest">
                              {index + 1}
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink">
                                {selectedIngredient?.name ||
                                  'Chọn nguyên liệu'}
                              </span>

                              <span className="mt-1 block truncate text-xs text-muted">
                                {row.quantity_per_person && row.unit
                                  ? `${row.quantity_per_person} ${row.unit}/người`
                                  : 'Chưa nhập định lượng'}

                                {' · '}

                                {row.ingredient_role === 'main'
                                  ? 'Nguyên liệu chính'
                                  : 'Nguyên liệu phụ'}

                                {row.is_optional ? ' · Không bắt buộc' : ''}
                              </span>
                            </span>

                            <ChevronDown
                              size={18}
                              className={`shrink-0 text-muted transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeIngredientRow(index)}
                            disabled={isSubmitting}
                            aria-label={`Xóa ${
                              selectedIngredient?.name ??
                              `nguyên liệu ${index + 1}`
                            }`}
                            title="Xóa nguyên liệu"
                            className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Chi tiết chỉ hiện khi người dùng mở dòng */}
                        {isExpanded && (
                          <div
                            id={`ingredient-panel-${index}`}
                            className="space-y-4 border-t border-beige/70 bg-cream/50 p-4"
                          >
                            <div className="space-y-2">
                              <label
                                htmlFor={`ingredient-${index}`}
                                className="block text-sm font-medium text-ink"
                              >
                                Tên nguyên liệu
                              </label>

                              <select
                                id={`ingredient-${index}`}
                                value={row.ingredient_id}
                                onChange={(event) =>
                                  handleIngredientChange(
                                    index,
                                    event.target.value,
                                  )
                                }
                                disabled={isSubmitting}
                                required
                                className="w-full rounded-xl border border-beige bg-white px-3 py-3 text-sm text-ink outline-none focus:border-forest disabled:opacity-60"
                              >
                                <option value="">Chọn nguyên liệu</option>

                                {selectedIngredient &&
                                  !selectedIngredient.is_active && (
                                    <option value={selectedIngredient.id}>
                                      {selectedIngredient.name} (ngừng hoạt động)
                                    </option>
                                  )}

                                {ingredients.map((ingredient) => (
                                  <option
                                    key={ingredient.id}
                                    value={ingredient.id}
                                  >
                                    {ingredient.name}
                                    {ingredient.ingredient_category_name
                                      ? ` · ${ingredient.ingredient_category_name}`
                                      : ''}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
                              <div className="space-y-2">
                                <label
                                  htmlFor={`quantity-${index}`}
                                  className="block text-sm font-medium text-ink"
                                >
                                  Định lượng / người
                                </label>

                                <input
                                  id={`quantity-${index}`}
                                  type="number"
                                  min="0.001"
                                  step="any"
                                  value={row.quantity_per_person}
                                  onChange={(event) =>
                                    updateIngredientRow(index, {
                                      quantity_per_person: event.target.value,
                                    })
                                  }
                                  placeholder="Ví dụ: 200"
                                  required
                                  disabled={isSubmitting}
                                  className="w-full rounded-xl border border-beige bg-white px-3 py-3 text-sm text-ink outline-none focus:border-forest disabled:opacity-60"
                                />
                              </div>

                              <div className="space-y-2">
                                <label
                                  htmlFor={`unit-${index}`}
                                  className="block text-sm font-medium text-ink"
                                >
                                  Đơn vị
                                </label>

                                <input
                                  id={`unit-${index}`}
                                  type="text"
                                  value={row.unit}
                                  onChange={(event) =>
                                    updateIngredientRow(index, {
                                      unit: event.target.value,
                                    })
                                  }
                                  placeholder="g, ml..."
                                  maxLength={30}
                                  required
                                  disabled={isSubmitting}
                                  className="w-full rounded-xl border border-beige bg-white px-3 py-3 text-sm text-ink outline-none focus:border-forest disabled:opacity-60"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label
                                htmlFor={`role-${index}`}
                                className="block text-sm font-medium text-ink"
                              >
                                Vai trò nguyên liệu
                              </label>

                              <select
                                id={`role-${index}`}
                                value={row.ingredient_role}
                                onChange={(event) =>
                                  updateIngredientRow(index, {
                                    ingredient_role: event.target
                                      .value as IngredientRole,
                                  })
                                }
                                disabled={isSubmitting}
                                className="w-full rounded-xl border border-beige bg-white px-3 py-3 text-sm text-ink outline-none focus:border-forest disabled:opacity-60"
                              >
                                <option value="main">
                                  Nguyên liệu chính
                                </option>
                                <option value="minor">
                                  Nguyên liệu phụ
                                </option>
                              </select>
                            </div>

                            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                              <input
                                type="checkbox"
                                checked={row.is_optional}
                                onChange={(event) =>
                                  updateIngredientRow(index, {
                                    is_optional: event.target.checked,
                                  })
                                }
                                disabled={isSubmitting}
                                className="size-4 accent-forest"
                              />
                              Nguyên liệu không bắt buộc
                            </label>

                            <div className="space-y-2">
                              <label
                                htmlFor={`note-${index}`}
                                className="block text-sm font-medium text-ink"
                              >
                                Ghi chú sơ chế
                                <span className="ml-1 font-normal text-muted">
                                  (không bắt buộc)
                                </span>
                              </label>

                              <input
                                id={`note-${index}`}
                                type="text"
                                value={row.preparation_note}
                                onChange={(event) =>
                                  updateIngredientRow(index, {
                                    preparation_note: event.target.value,
                                  })
                                }
                                placeholder="Ví dụ: Rửa sạch, thái lát mỏng"
                                maxLength={500}
                                disabled={isSubmitting}
                                className="w-full rounded-xl border border-beige bg-white px-3 py-3 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-forest disabled:opacity-60"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

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
              disabled={
                isSubmitting ||
                isLoadingIngredients ||
                Boolean(ingredientLoadError)
              }
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
