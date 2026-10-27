import { Search, X } from 'lucide-react'

import CategorySelect from './CategorySelect'

export interface PageFilterOption {
  label: string
  value: string
}

export interface PageFilterSelect {
  key: string
  label: string
  value: string
  onChange: (value: string) => void
  options: PageFilterOption[]
}

interface PageFiltersProps {
  search: {
    value: string
    onChange: (value: string) => void
    placeholder: string
    ariaLabel: string
  }
  selects?: PageFilterSelect[]
}

export default function PageFilters({
  search,
  selects = [],
}: PageFiltersProps) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Ô tìm kiếm */}
        <div className="relative min-w-0 flex-1">
          <Search
            size={19}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
          />

          <input
            type="search"
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            placeholder={search.placeholder}
            aria-label={search.ariaLabel}
            className="w-full rounded-2xl border border-beige bg-white py-3.5 pr-11 pl-11 text-sm text-ink outline-none transition placeholder:text-muted/80 focus:border-forest"
          />

          {search.value && (
            <button
              type="button"
              onClick={() => search.onChange('')}
              aria-label="Xóa từ khóa tìm kiếm"
              title="Xóa từ khóa"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted transition hover:bg-sage/60 hover:text-forest"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* Các bộ lọc danh mục */}
        {selects.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row">
            {selects.map((item) => (
              <div key={item.key} className="min-w-0 sm:w-56">
                <CategorySelect
                  id={`filter-${item.key}`}
                  categories={item.options.map((option) => ({
                    id: option.value,
                    name: option.label,
                  }))}
                  value={item.value}
                  onChange={item.onChange}
                  ariaLabel={item.label}
                  compact
                  showIcon={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
