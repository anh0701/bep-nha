
import { CircleCheck, Search } from 'lucide-react'

import type { DishByIngredients } from '../../types/dish'
import DishResultCard from './DishResultCard'

export type ResultFilter = 'all' | 'ready' | 'missing'

interface DishSearchResultsProps {
  results: DishByIngredients[]
  visibleResults: DishByIngredients[]
  total: number
  selectedCount: number
  readyCount: number
  resultFilter: ResultFilter
  onFilterChange: (filter: ResultFilter) => void
  onViewDetail: (dish: DishByIngredients) => void
  onChangeIngredients: () => void
}

export default function DishSearchResults({
  results,
  visibleResults,
  total,
  selectedCount,
  readyCount,
  resultFilter,
  onFilterChange,
  onViewDetail,
  onChangeIngredients,
}: DishSearchResultsProps) {
  return (
    <section aria-live="polite" className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-forest">
            <CircleCheck size={16} />
            Kết quả dành cho bạn
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">
            Tìm thấy {total} món
          </h2>

          <p className="mt-1 text-sm text-muted">
            Dựa trên {selectedCount} nguyên liệu bạn đã chọn.
          </p>
        </div>

        {results.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', `Tất cả (${results.length})`],
                ['ready', `Nấu ngay (${readyCount})`],
                [
                  'missing',
                  `Cần bổ sung (${results.length - readyCount})`,
                ],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={resultFilter === value}
                onClick={() => onFilterChange(value)}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  resultFilter === value
                    ? 'bg-forest text-white'
                    : 'bg-white text-muted ring-1 ring-beige hover:bg-cream'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <div className="rounded-3xl bg-white px-5 py-10 text-center ring-1 ring-beige/80 sm:px-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-cream text-muted">
            <Search size={25} />
          </div>

          <h3 className="mt-4 font-semibold text-ink">
            Chưa tìm thấy món phù hợp
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Thử chọn thêm nguyên liệu hoặc thay đổi lựa chọn để khám phá
            những món khác trong kho.
          </p>

          <button
            type="button"
            onClick={onChangeIngredients}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-forest/90"
          >
            <Search size={16} />
            Thay đổi nguyên liệu
          </button>
        </div>
      ) : visibleResults.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-beige/80">
          <p className="text-sm font-medium text-ink">
            Không có món nào trong nhóm này.
          </p>
          <p className="mt-1 text-sm text-muted">
            Chuyển sang bộ lọc khác để xem các món còn lại.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleResults.map((dish) => (
            <DishResultCard
              key={dish.id}
              dish={dish}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      )}
    </section>
  )
}
