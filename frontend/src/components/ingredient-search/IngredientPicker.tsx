
import { useEffect, useRef } from 'react'
import {
  Check,
  ChevronDown,
  LoaderCircle,
  Search,
  X,
} from 'lucide-react'

import type { Ingredient } from '../../types/ingredient'

interface IngredientPickerProps {
  ingredients: Ingredient[]
  selectedIds: string[]
  search: string
  pickerOpen: boolean
  loading: boolean
  onSearchChange: (value: string) => void
  onPickerOpenChange: (open: boolean) => void
  onToggle: (ingredient: Ingredient) => void
  onClear: () => void
}

export default function IngredientPicker({
  ingredients,
  selectedIds,
  search,
  pickerOpen,
  loading,
  onSearchChange,
  onPickerOpenChange,
  onToggle,
  onClear,
}: IngredientPickerProps) {
  const pickerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onPickerOpenChange(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [onPickerOpenChange])

  const sortedIngredients = [...ingredients].sort((a, b) => {
    const aSelected = selectedIds.includes(a.id)
    const bSelected = selectedIds.includes(b.id)

    if (aSelected !== bSelected) {
      return aSelected ? -1 : 1
    }

    return a.name.localeCompare(b.name, 'vi')
  })

  return (
    <div className="relative mt-6" ref={pickerRef}>
      <label
        htmlFor="ingredient-picker"
        className="mb-2 block text-sm font-medium text-ink"
      >
        Tìm nguyên liệu
      </label>

      <div
        className={`flex items-center gap-3 rounded-2xl border bg-white px-4 transition ${
          pickerOpen
            ? 'border-forest ring-2 ring-sage/60'
            : 'border-beige hover:border-sage'
        } focus-within:border-forest focus-within:ring-2 focus-within:ring-sage/60`}
      >
        <Search size={19} className="shrink-0 text-muted" />

        <input
          id="ingredient-picker"
          type="search"
          value={search}
          onFocus={() => onPickerOpenChange(true)}
          onChange={(event) => {
            onSearchChange(event.target.value)
            onPickerOpenChange(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onPickerOpenChange(false)
            }
          }}
          placeholder="Ví dụ: thịt bò, trứng gà, cà chua..."
          autoComplete="off"
          aria-expanded={pickerOpen}
          aria-controls="ingredient-picker-options"
          role="combobox"
          aria-autocomplete="list"
          className="min-w-0 flex-1 appearance-none border-0 bg-transparent py-4 text-sm text-ink outline-none ring-0 placeholder:text-muted !outline-none !ring-0 focus:!border-0 focus:!outline-none focus:!ring-0 focus-visible:!outline-none"
        />

        {search && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('')
              onPickerOpenChange(true)
            }}
            aria-label="Xóa từ khóa tìm kiếm"
            className="rounded-full p-1 text-muted hover:bg-cream hover:text-ink"
          >
            <X size={16} />
          </button>
        )}

        <ChevronDown
          size={18}
          className={`shrink-0 text-muted transition-transform ${
            pickerOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {pickerOpen && (
        <div
          id="ingredient-picker-options"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-beige bg-white shadow-xl shadow-ink/10"
        >
          <div className="flex items-center justify-between border-b border-beige/70 bg-cream/60 px-4 py-3">
            <span className="text-xs font-semibold text-muted">
              {loading
                ? 'Đang tải nguyên liệu'
                : `${sortedIngredients.length} nguyên liệu`}
            </span>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-medium text-forest hover:underline"
              >
                Xóa lựa chọn
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted">
                <LoaderCircle size={17} className="animate-spin" />
                Đang tải danh sách...
              </div>
            ) : sortedIngredients.length === 0 ? (
              <div className="p-6 text-center">
                <Search size={23} className="mx-auto text-muted" />
                <p className="mt-2 text-sm font-medium text-ink">
                  Chưa tìm thấy nguyên liệu
                </p>
                <p className="mt-1 text-xs text-muted">
                  Thử tìm bằng một tên khác nhé.
                </p>
              </div>
            ) : (
              sortedIngredients.map((ingredient) => {
                const checked = selectedIds.includes(ingredient.id)

                return (
                  <button
                    key={ingredient.id}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => onToggle(ingredient)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      checked ? 'bg-sage/50' : 'hover:bg-cream'
                    }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                        checked
                          ? 'border-forest bg-forest text-white'
                          : 'border-beige bg-white'
                      }`}
                    >
                      {checked && <Check size={13} strokeWidth={3} />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">
                        {ingredient.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {ingredient.ingredient_category_name}
                      </span>
                    </span>

                    {checked && (
                      <span className="text-xs font-medium text-forest">
                        Đã chọn
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {!loading && (
            <div className="border-t border-beige/70 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  onSearchChange('')
                  onPickerOpenChange(false)
                }}
                className="w-full rounded-xl bg-cream px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-sage/50"
              >
                Xong, tiếp tục
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
