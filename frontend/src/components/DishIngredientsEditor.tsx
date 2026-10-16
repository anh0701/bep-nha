
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import {
  ChevronDown,
  Plus,
  Trash2,
  Utensils,
} from 'lucide-react'

import {
  getDishIngredients,
  setDishIngredients,
} from '../services/dish-ingredient.service'
import { getIngredients } from '../services/ingredient.service'
import { getUnits } from '../services/unit.service'

import type { Ingredient } from '../types/ingredient'
import type {
  DishIngredient,
  DishIngredientInput,
  IngredientRole,
} from '../types/dish-ingredient'
import type { Unit } from '../types/unit'

interface IngredientRow {
  ingredient_id: string
  quantity_per_person: string
  unit_id: string
  ingredient_role: IngredientRole
  is_optional: boolean
  preparation_note: string
}

interface DishIngredientsEditorProps {
  dishId?: string
  disabled?: boolean
  onReadyChange: (ready: boolean) => void
}

export interface DishIngredientsEditorHandle {
  validate: () => DishIngredientInput[] | null
}

function toIngredientRow(item: DishIngredient): IngredientRow {
  return {
    ingredient_id: item.ingredient_id,
    quantity_per_person: String(item.quantity_per_person),
    unit_id: item.unit_id,
    ingredient_role: item.ingredient_role,
    is_optional: item.is_optional,
    preparation_note: item.preparation_note ?? '',
  }
}

function createEmptyIngredientRow(): IngredientRow {
  return {
    ingredient_id: '',
    quantity_per_person: '',
    unit_id: '',
    ingredient_role: 'main',
    is_optional: false,
    preparation_note: '',
  }
}

const DishIngredientsEditor = forwardRef<
  DishIngredientsEditorHandle,
  DishIngredientsEditorProps
>(function DishIngredientsEditor(
  { dishId, disabled = false, onReadyChange },
  ref,
) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadVersion, setLoadVersion] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const rowRefs = useRef(new Map<number, HTMLDivElement>())
  const pendingScrollIndexRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setIsLoading(true)
      setLoadError(null)
      setValidationError(null)

      try {
        const [ingredientResult, dishIngredientResult, unitResult] =
          await Promise.all([
            getIngredients(),
            dishId
              ? getDishIngredients(dishId)
              : Promise.resolve({ data: [], total: 0 }),
            getUnits(),
          ])

        if (cancelled) return

        setIngredients(
          ingredientResult.data.filter(
            (ingredient) =>
              ingredient.is_active ||
              dishIngredientResult.data.some(
                (item) => item.ingredient_id === ingredient.id,
              ),
          ),
        )

        setUnits(unitResult)
        setIngredientRows(dishIngredientResult.data.map(toIngredientRow))
        setExpandedIndex(null)
        rowRefs.current.clear()
        pendingScrollIndexRef.current = null
      } catch (error) {
        if (cancelled) return

        console.error('Failed to load dish ingredients:', error)

        setLoadError(
          'Không thể tải kho nguyên liệu, danh sách đơn vị hoặc nguyên liệu đã gán. Vui lòng thử lại.',
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [dishId, loadVersion])

  useEffect(() => {
    onReadyChange(!isLoading && !loadError)
  }, [isLoading, loadError, onReadyChange])

  useEffect(() => {
    if (expandedIndex === null) return

    if (pendingScrollIndexRef.current !== expandedIndex) return

    const index = expandedIndex
    pendingScrollIndexRef.current = null

    requestAnimationFrame(() => {
      rowRefs.current.get(index)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    })
  }, [expandedIndex, ingredientRows.length])

  function updateRow(index: number, patch: Partial<IngredientRow>) {
    setIngredientRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    )
    setValidationError(null)
  }

  function handleIngredientChange(index: number, ingredientId: string) {
    const selected = ingredients.find(
      (ingredient) => ingredient.id === ingredientId,
    )

    const defaultUnitId =
      (selected as (Ingredient & {
        default_unit_id?: string | null
      }) | undefined)?.default_unit_id ?? ''

    const hasDefaultUnit = units.some(
      (unit) => unit.id === defaultUnitId,
    )

    updateRow(index, {
      ingredient_id: ingredientId,
      unit_id: hasDefaultUnit ? defaultUnitId : '',
    })
  }

  function addRow() {
    const newIndex = ingredientRows.length

    pendingScrollIndexRef.current = newIndex
    setIngredientRows((current) => [
      ...current,
      createEmptyIngredientRow(),
    ])
    setExpandedIndex(newIndex)
    setValidationError(null)
  }

  function toggleRow(index: number) {
    if (expandedIndex === index) {
      setExpandedIndex(null)
      return
    }

    pendingScrollIndexRef.current = index
    setExpandedIndex(index)
  }

  function removeRow(index: number) {
    setIngredientRows((current) =>
      current.filter((_, rowIndex) => rowIndex !== index),
    )

    rowRefs.current.delete(index)
    pendingScrollIndexRef.current = null

    setExpandedIndex((current) => {
      if (current === null || current === index) return null
      return current > index ? current - 1 : current
    })

    setValidationError(null)
  }

  function validate(): DishIngredientInput[] | null {
    setValidationError(null)

    if (isLoading || loadError) {
      setValidationError(
        'Chưa tải được dữ liệu nguyên liệu. Vui lòng tải lại trước khi lưu.',
      )
      return null
    }

    const seenIngredientIds = new Set<string>()
    const result: DishIngredientInput[] = []

    for (let index = 0; index < ingredientRows.length; index += 1) {
      const row = ingredientRows[index]
      const rowNumber = index + 1

      if (!row.ingredient_id) {
        setExpandedIndex(index)
        setValidationError(
          `Vui lòng chọn nguyên liệu ở dòng ${rowNumber}.`,
        )
        return null
      }

      if (seenIngredientIds.has(row.ingredient_id)) {
        setExpandedIndex(index)
        setValidationError(
          'Một nguyên liệu không thể được thêm nhiều lần. Hãy gộp định lượng vào cùng một dòng.',
        )
        return null
      }

      seenIngredientIds.add(row.ingredient_id)

      const quantity = Number(row.quantity_per_person)
      const unitId = row.unit_id
      const note = row.preparation_note.trim()

      if (
        row.quantity_per_person.trim() === '' ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        setExpandedIndex(index)
        setValidationError(
          `Định lượng ở dòng ${rowNumber} phải là số lớn hơn 0.`,
        )
        return null
      }

      if (!unitId || !units.some((unit) => unit.id === unitId)) {
        setExpandedIndex(index)
        setValidationError(
          `Vui lòng chọn đơn vị hợp lệ ở dòng ${rowNumber}.`,
        )
        return null
      }

      if (note.length > 500) {
        setExpandedIndex(index)
        setValidationError(
          `Ghi chú ở dòng ${rowNumber} không được vượt quá 500 ký tự.`,
        )
        return null
      }

      result.push({
        ingredient_id: row.ingredient_id,
        quantity_per_person: quantity,
        unit_id: unitId,
        ingredient_role: row.ingredient_role,
        is_optional: row.is_optional,
        preparation_note: note || null,
      })
    }

    return result
  }

  useImperativeHandle(ref, () => ({ validate }), [
    isLoading,
    loadError,
    ingredientRows,
    units,
  ])

  return (
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
          onClick={addRow}
          disabled={
            disabled ||
            isLoading ||
            Boolean(loadError) ||
            ingredients.length === 0
          }
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-forest/20 px-3 py-2.5 text-sm font-semibold text-forest transition hover:bg-sage/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Thêm nguyên liệu
        </button>
      </div>

      {isLoading ? (
        <p className="rounded-xl bg-white px-4 py-5 text-sm text-muted">
          Đang tải kho nguyên liệu...
        </p>
      ) : loadError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <p className="text-sm text-red-700">{loadError}</p>

          <button
            type="button"
            onClick={() => setLoadVersion((version) => version + 1)}
            disabled={disabled}
            className="mt-3 text-sm font-semibold text-red-700 underline disabled:opacity-50"
          >
            Tải lại dữ liệu
          </button>
        </div>
      ) : ingredients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-beige bg-white/60 px-4 py-5">
          <p className="text-sm text-muted">
            Kho nguyên liệu chưa có nguyên liệu đang hoạt động. Hãy thêm
            nguyên liệu trong mục Kho nguyên liệu trước nhé.
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
            onClick={addRow}
            disabled={disabled}
            className="mt-2 text-sm font-semibold text-forest hover:underline disabled:opacity-50"
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
            const isExpanded = expandedIndex === index

            return (
              <div
                key={`${row.ingredient_id || 'new'}-${index}`}
                ref={(element) => {
                  if (element) {
                    rowRefs.current.set(index, element)
                  } else {
                    rowRefs.current.delete(index)
                  }
                }}
                className={`overflow-hidden rounded-xl border bg-white transition-colors ${
                  isExpanded
                    ? 'border-forest/40 shadow-sm'
                    : 'border-beige hover:border-forest/25'
                }`}
              >
                <div className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
                  <button
                    type="button"
                    onClick={() => toggleRow(index)}
                    aria-expanded={isExpanded}
                    aria-controls={`ingredient-panel-${index}`}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sage/60 text-xs font-semibold text-forest">
                      {index + 1}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {selectedIngredient?.name || 'Chọn nguyên liệu'}
                      </span>

                      <span className="mt-1 block truncate text-xs text-muted">
                        {row.quantity_per_person && row.unit_id
                          ? `${row.quantity_per_person} ${
                              units.find((unit) => unit.id === row.unit_id)
                                ?.symbol ?? ''
                            }/người`
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
                    onClick={() => removeRow(index)}
                    disabled={disabled}
                    aria-label={`Xóa ${
                      selectedIngredient?.name ?? `nguyên liệu ${index + 1}`
                    }`}
                    title="Xóa nguyên liệu"
                    className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

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
                          handleIngredientChange(index, event.target.value)
                        }
                        disabled={disabled}
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
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name}
                            {ingredient.ingredient_category_name
                              ? ` · ${ingredient.ingredient_category_name}`
                              : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
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
                            updateRow(index, {
                              quantity_per_person: event.target.value,
                            })
                          }
                          placeholder="Ví dụ: 200"
                          required
                          disabled={disabled}
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

                        <select
                          id={`unit-${index}`}
                          value={row.unit_id}
                          onChange={(event) =>
                            updateRow(index, { unit_id: event.target.value })
                          }
                          required
                          disabled={disabled}
                          className="w-full rounded-xl border border-beige bg-white px-3 py-3 text-sm text-ink outline-none focus:border-forest disabled:opacity-60"
                        >
                          <option value="">Chọn đơn vị</option>

                          {units.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.name} ({unit.symbol})
                            </option>
                          ))}
                        </select>
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
                          updateRow(index, {
                            ingredient_role: event.target.value as IngredientRole,
                          })
                        }
                        disabled={disabled}
                        className="w-full rounded-xl border border-beige bg-white px-3 py-3 text-sm text-ink outline-none focus:border-forest disabled:opacity-60"
                      >
                        <option value="main">Nguyên liệu chính</option>
                        <option value="minor">Nguyên liệu phụ</option>
                      </select>
                    </div>

                    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={row.is_optional}
                        onChange={(event) =>
                          updateRow(index, {
                            is_optional: event.target.checked,
                          })
                        }
                        disabled={disabled}
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
                          updateRow(index, {
                            preparation_note: event.target.value,
                          })
                        }
                        placeholder="Ví dụ: Rửa sạch, thái lát mỏng"
                        maxLength={500}
                        disabled={disabled}
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

      {validationError && (
        <p
          role="alert"
          className="whitespace-pre-wrap rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {validationError}
        </p>
      )}
    </section>
  )
})

DishIngredientsEditor.displayName = 'DishIngredientsEditor'

export default DishIngredientsEditor
