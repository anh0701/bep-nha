import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Utensils, X } from 'lucide-react'

import type { Category } from '../types/category'

interface CategorySelectProps {
  categories: Category[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  includeAll?: boolean
  allLabel?: string
  ariaLabel: string
  disabled?: boolean
  required?: boolean
  id?: string
}

export default function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = 'Chọn danh mục',
  includeAll = false,
  allLabel = 'Tất cả danh mục',
  ariaLabel,
  disabled = false,
  required = false,
  id,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const options = includeAll
    ? [{ id: 'all', name: allLabel }, ...categories]
    : categories

  const selectedOption = options.find(
    (option) => option.id === value,
  )

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={`flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm transition-all duration-200
          ${
            isOpen
              ? 'border-forest ring-4 ring-sage/60'
              : 'border-beige hover:border-forest/60'
          }
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        `}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sage/70 text-forest">
          <Utensils size={17} />
        </span>

        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? 'font-medium text-ink' : 'text-muted'
          }`}
        >
          {selectedOption?.name ?? placeholder}
        </span>

        {value && !required && !disabled && (
          <span
            role="button"
            aria-label="Bỏ chọn danh mục"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation()
              onChange('')
              setIsOpen(false)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                event.stopPropagation()
                onChange('')
                setIsOpen(false)
              }
            }}
            className="rounded-md p-1 text-muted transition-colors hover:bg-beige hover:text-ink"
          >
            <X size={15} />
          </span>
        )}

        <ChevronDown
          size={18}
          className={`shrink-0 text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-forest' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-beige bg-white p-1.5 shadow-xl shadow-ink/10 animate-in fade-in slide-in-from-top-1 duration-150">
          <div
            role="listbox"
            aria-label={ariaLabel}
            className="max-h-64 overflow-y-auto"
          >
            {options.map((option) => {
              const isSelected = option.id === value

              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.id)
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors
                    ${
                      isSelected
                        ? 'bg-sage/70 font-semibold text-forest'
                        : 'text-ink hover:bg-cream'
                    }
                  `}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-white/80 text-forest'
                        : 'bg-cream text-muted'
                    }`}
                  >
                    <Utensils size={16} />
                  </span>

                  <span className="min-w-0 flex-1">
                    {option.name}
                  </span>

                  {isSelected && (
                    <Check
                      size={17}
                      className="shrink-0 text-forest"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
