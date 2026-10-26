
import { Search, X } from 'lucide-react'

import type { Ingredient } from '../../types/ingredient'

interface SelectedIngredientsProps {
  ingredients: Ingredient[]
  onRemove: (id: string) => void
  onClear: () => void
  onOpenPicker: () => void
}

export default function SelectedIngredients({
  ingredients,
  onRemove,
  onClear,
  onOpenPicker,
}: SelectedIngredientsProps) {
  if (ingredients.length === 0) {
    return (
      <button
        type="button"
        onClick={onOpenPicker}
        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-beige bg-cream/60 p-4 text-left transition hover:border-sage hover:bg-cream"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-forest">
          <Search size={18} />
        </div>

        <div>
          <p className="text-sm font-medium text-ink">
            Bắt đầu với nguyên liệu bạn có
          </p>
          <p className="mt-1 text-xs text-muted">
            Chọn một hoặc nhiều nguyên liệu từ danh sách.
          </p>
        </div>
      </button>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Đã chọn
        </p>

        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-muted transition hover:text-forest"
        >
          Bỏ chọn tất cả
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {ingredients.map((ingredient) => (
          <span
            key={ingredient.id}
            className="inline-flex max-w-full items-center gap-2 rounded-full bg-sage/60 py-2 pl-3.5 pr-2 text-sm font-medium text-forest"
          >
            <span className="truncate">{ingredient.name}</span>

            <button
              type="button"
              onClick={() => onRemove(ingredient.id)}
              aria-label={`Bỏ chọn ${ingredient.name}`}
              className="flex size-6 shrink-0 items-center justify-center rounded-full transition hover:bg-sage"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </>
  )
}
