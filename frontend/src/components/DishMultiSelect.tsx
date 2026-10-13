
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'

import type { Dish } from '../types/dish'

interface DishMultiSelectProps {
    dishes: Dish[]
    value: string[]
    onChange: (dishIds: string[]) => void
    disabled?: boolean
    placeholder?: string
    variant?: 'forest' | 'emerald'
}

interface DropdownPosition {
    top: number
    left: number
    width: number
    maxHeight: number
}

const normalizeText = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLocaleLowerCase('vi')

export default function DishMultiSelect({
    dishes,
    value,
    onChange,
    disabled = false,
    placeholder = 'Type to search dishes...',
    variant = 'forest',
}: DishMultiSelectProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [position, setPosition] = useState<DropdownPosition | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const showDropdown = isFocused && !disabled

    const selectedDishes = useMemo(
        () =>
            value
                .map((id) => dishes.find((dish) => dish.id === id))
                .filter((dish): dish is Dish => Boolean(dish)),
        [dishes, value],
    )

    const filteredDishes = useMemo(() => {
        const keyword = normalizeText(searchTerm.trim())

        if (!keyword) return []

        return dishes
            .filter((dish) => normalizeText(dish.name).includes(keyword))
            .slice(0, 30)
    }, [dishes, searchTerm])

    const isForest = variant === 'forest'

    const styles = isForest
        ? {
              border: 'border-beige',
              focus: 'focus-within:border-forest',
              tag: 'bg-sage/40 text-forest',
              tagHover: 'hover:bg-sage',
              checked: 'border-forest bg-forest',
              hover: 'hover:bg-sage/30',
              selected: 'text-forest',
          }
        : {
              border: 'border-stone-300',
              focus: 'focus-within:border-emerald-600',
              tag: 'bg-emerald-50 text-emerald-800',
              tagHover: 'hover:bg-emerald-100',
              checked: 'border-emerald-600 bg-emerald-600',
              hover: 'hover:bg-stone-50',
              selected: 'text-emerald-700',
          }

    useEffect(() => {
        if (!showDropdown) {
            setPosition(null)
            return
        }

        const updatePosition = () => {
            const element = containerRef.current

            if (!element) return

            const rect = element.getBoundingClientRect()
            const gap = 6
            const bottomSpace = window.innerHeight - rect.bottom - gap
            const topSpace = rect.top - gap
            const openAbove = bottomSpace < 200 && topSpace > bottomSpace

            const maxHeight = Math.max(
                100,
                Math.min(280, openAbove ? topSpace : bottomSpace),
            )

            setPosition({
                left: rect.left,
                width: rect.width,
                maxHeight,
                top: openAbove
                    ? Math.max(8, rect.top - gap - maxHeight)
                    : rect.bottom + gap,
            })
        }

        updatePosition()

        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition, true)

        return () => {
            window.removeEventListener('resize', updatePosition)
            window.removeEventListener('scroll', updatePosition, true)
        }
    }, [showDropdown, searchTerm, filteredDishes.length, selectedDishes.length])

    useEffect(() => {
        if (!showDropdown) return

        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node

            if (
                !containerRef.current?.contains(target) &&
                !dropdownRef.current?.contains(target)
            ) {
                setSearchTerm('')
                setIsFocused(false)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
        }
    }, [showDropdown])

    function toggleDish(dishId: string) {
        onChange(
            value.includes(dishId)
                ? value.filter((id) => id !== dishId)
                : [...value, dishId],
        )

        setSearchTerm('')
        inputRef.current?.focus()
    }

    function removeDish(dishId: string) {
        onChange(value.filter((id) => id !== dishId))
    }

    return (
        <>
            <div
                ref={containerRef}
                className={`flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border ${styles.border} ${styles.focus} bg-white px-2.5 py-2 transition-colors`}
            >
                {selectedDishes.map((dish) => (
                    <span
                        key={dish.id}
                        className={`inline-flex max-w-full items-center gap-1 rounded-lg py-1 pl-2 pr-1 text-xs font-medium ${styles.tag}`}
                    >
                        <span className="max-w-[180px] truncate">
                            {dish.name}
                        </span>

                        <button
                            type="button"
                            aria-label={`Bỏ chọn ${dish.name}`}
                            disabled={disabled}
                            onClick={() => removeDish(dish.id)}
                            className={`shrink-0 rounded p-0.5 transition-colors ${styles.tagHover} disabled:opacity-50`}
                        >
                            <X size={13} />
                        </button>
                    </span>
                ))}

                <div className="flex min-w-[120px] flex-1 items-center gap-1.5">
                    <Search size={15} className="shrink-0 text-stone-400" />

                    <input
                        ref={inputRef}
                        value={searchTerm}
                        onFocus={() => setIsFocused(true)}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        onKeyDown={(event) => {
                            if (
                                event.key === 'Backspace' &&
                                searchTerm === '' &&
                                value.length > 0
                            ) {
                                removeDish(value[value.length - 1])
                            }

                            if (event.key === 'Escape') {
                                setSearchTerm('')
                                setIsFocused(false)
                            }
                        }}
                        placeholder={
                            value.length > 0 ? 'Thêm món...' : placeholder
                        }
                        disabled={disabled}
                        autoComplete="off"
                        className="w-full min-w-0 !border-none !bg-transparent p-0 text-sm text-ink !outline-none !ring-0 !shadow-none placeholder:text-muted focus:!border-none focus:!outline-none focus:!ring-0 focus:!shadow-none hover:!border-none disabled:opacity-60"
                    />
                </div>
            </div>

            {showDropdown &&
                position &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        style={{
                            position: 'fixed',
                            top: position.top,
                            left: position.left,
                            width: position.width,
                            maxHeight: position.maxHeight,
                            zIndex: 10000,
                        }}
                        className={`overflow-y-auto rounded-xl border ${styles.border} bg-white py-1 shadow-lg`}
                    >
                        {!searchTerm.trim() ? (
                            <p className="px-3 py-3 text-sm text-muted">
                                Type to search dishes...
                            </p>
                        ) : (
                            <>
                                <div className="border-b border-stone-100 px-3 py-2 text-xs text-muted">
                                    {filteredDishes.length > 0
                                        ? `${filteredDishes.length} kết quả${filteredDishes.length === 30 ? ' (tối đa 30)' : ''}`
                                        : 'Không tìm thấy món phù hợp'}
                                </div>

                                {filteredDishes.map((dish) => {
                                    const isSelected = value.includes(dish.id)

                                    return (
                                        <button
                                            key={dish.id}
                                            type="button"
                                            onClick={() => toggleDish(dish.id)}
                                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${styles.hover}`}
                                        >
                                            <span
                                                className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                                                    isSelected
                                                        ? styles.checked
                                                        : 'border-stone-300 bg-white'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <svg
                                                        viewBox="0 0 16 16"
                                                        fill="none"
                                                        className="size-3 text-white"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            d="m3.5 8 3 3 6-6"
                                                            stroke="currentColor"
                                                            strokeWidth="1.8"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                )}
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium text-stone-800">
                                                    {dish.name}
                                                </span>

                                                <span className="block truncate text-xs text-muted">
                                                    {dish.category ?? ''}
                                                </span>
                                            </span>

                                            {isSelected && (
                                                <span
                                                    className={`shrink-0 text-xs ${styles.selected}`}
                                                >
                                                    Đã chọn
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </>
                        )}
                    </div>,
                    document.body,
                )}
        </>
    )
}
