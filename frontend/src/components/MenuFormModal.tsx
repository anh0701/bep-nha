import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { LoaderCircle, Search, X } from 'lucide-react'

import type { CreateManualMenuInput, SavedMenu } from '../types/menu'
import type { Dish } from '../types/dish'

import {
    createManualMenu,
    updateManualMenu,
} from '../services/menu.service'
import { getDishes } from '../services/dish.service'

interface MenuFormModalProps {
    menu: SavedMenu | null
    onClose: () => void
    onSuccess: (action: 'created' | 'updated', name: string) => void
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

export default function MenuFormModal({
    menu,
    onClose,
    onSuccess,
}: MenuFormModalProps) {
    const [menuName, setMenuName] = useState(menu?.name ?? '')
    const [selectedDishIds, setSelectedDishIds] = useState<string[]>(
        menu?.items.map((dish) => dish.id) ?? [],
    )
    const [availableDishes, setAvailableDishes] = useState<Dish[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [isDishLoading, setIsDishLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [dropdownPosition, setDropdownPosition] =
        useState<DropdownPosition | null>(null)

    const searchContainerRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const showDropdown = isSearchFocused && !isDishLoading

    useEffect(() => {
        setMenuName(menu?.name ?? '')
        setSelectedDishIds(menu?.items.map((dish) => dish.id) ?? [])
    }, [menu])

    useEffect(() => {
        let cancelled = false

        const loadDishes = async () => {
            setIsDishLoading(true)

            try {
                const response = await getDishes()

                if (!cancelled) {
                    setAvailableDishes(
                        response.data.filter((dish) => dish.is_active),
                    )
                }
            } catch {
                if (!cancelled) {
                    setError('Không thể tải danh sách món ăn.')
                }
            } finally {
                if (!cancelled) {
                    setIsDishLoading(false)
                }
            }
        }

        void loadDishes()

        return () => {
            cancelled = true
        }
    }, [])

    const selectedDishes = useMemo(
        () =>
            selectedDishIds
                .map((id) =>
                    availableDishes.find((dish) => dish.id === id),
                )
                .filter((dish): dish is Dish => Boolean(dish)),
        [availableDishes, selectedDishIds],
    )

    const filteredDishes = useMemo(() => {
        const keyword = normalizeText(searchTerm.trim())

        const dishes = keyword
            ? availableDishes.filter((dish) =>
                normalizeText(dish.name).includes(keyword),
            )
            : availableDishes

        return dishes.slice(0, 30)
    }, [availableDishes, searchTerm])

    useEffect(() => {
        if (!showDropdown) {
            setDropdownPosition(null)
            return
        }

        const updatePosition = () => {
            const element = searchContainerRef.current

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

            setDropdownPosition({
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
    }, [showDropdown, searchTerm, filteredDishes.length])

    useEffect(() => {
        if (!showDropdown) return

        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node

            if (
                !searchContainerRef.current?.contains(target) &&
                !dropdownRef.current?.contains(target)
            ) {
                setSearchTerm('')
                setIsSearchFocused(false)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
        }
    }, [showDropdown])

    const toggleDish = (dishId: string) => {
        setSelectedDishIds((current) =>
            current.includes(dishId)
                ? current.filter((id) => id !== dishId)
                : [...current, dishId],
        )

        // Xóa chữ tìm kiếm nhưng giữ dropdown mở.
        setSearchTerm('')
        setError('')
        searchInputRef.current?.focus()
    }

    const removeDish = (dishId: string) => {
        setSelectedDishIds((current) =>
            current.filter((id) => id !== dishId),
        )
    }

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault()

        if (isSubmitting) return

        const trimmedName = menuName.trim()

        if (!trimmedName) {
            setError('Vui lòng nhập tên thực đơn.')
            return
        }

        if (trimmedName.length > 100) {
            setError('Tên thực đơn không được vượt quá 100 ký tự.')
            return
        }

        if (selectedDishIds.length === 0) {
            setError('Vui lòng chọn ít nhất một món ăn.')
            return
        }

        const input: CreateManualMenuInput = {
            name: trimmedName,
            dishIds: selectedDishIds,
        }

        setIsSubmitting(true)
        setError('')

        try {
            if (menu) {
                await updateManualMenu(menu.id, input)
                onSuccess('updated', trimmedName)
            } else {
                await createManualMenu(input)
                onSuccess('created', trimmedName)
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Không thể lưu thực đơn. Vui lòng thử lại.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const dropdownStyle: CSSProperties | undefined = dropdownPosition
        ? {
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: dropdownPosition.maxHeight,
            zIndex: 10000,
        }
        : undefined

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="menu-form-title"
                className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            >
                <header className="flex shrink-0 items-center justify-between border-b border-stone-100 px-5 py-4">
                    <div>
                        <h2
                            id="menu-form-title"
                            className="text-lg font-semibold text-stone-800"
                        >
                            {menu ? 'Chỉnh sửa thực đơn' : 'Tạo thực đơn'}
                        </h2>
                        <p className="mt-0.5 text-sm text-stone-500">
                            Đặt tên và chọn các món ăn bạn muốn nấu.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng"
                        className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                    >
                        <X size={19} />
                    </button>
                </header>

                <form
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-col"
                >
                    <div className="min-h-0 space-y-4 overflow-y-auto px-5 py-4">
                        <div>
                            <label
                                htmlFor="menu-name"
                                className="mb-1.5 block text-sm font-medium text-stone-700"
                            >
                                Tên thực đơn
                            </label>

                            <input
                                id="menu-name"
                                value={menuName}
                                onChange={(event) => {
                                    setMenuName(event.target.value)
                                    setError('')
                                }}
                                maxLength={100}
                                placeholder="Ví dụ: Thực đơn gia đình"
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-emerald-600"
                            />
                        </div>

                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                <label className="text-sm font-medium text-stone-700">
                                    Món ăn
                                </label>

                                <span className="text-xs text-stone-500">
                                    Đã chọn {selectedDishIds.length} món
                                </span>
                            </div>

                            <div
                                ref={searchContainerRef}
                                className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2.5 py-2 transition-colors focus-within:border-emerald-600"
                            >
                                {selectedDishes.map((dish) => (
                                    <span
                                        key={dish.id}
                                        className="inline-flex max-w-full items-center gap-1 rounded-md bg-emerald-50 py-1 pl-2 pr-1 text-xs font-medium text-emerald-800"
                                    >
                                        <span className="max-w-[180px] truncate">
                                            {dish.name}
                                        </span>

                                        <button
                                            type="button"
                                            aria-label={`Bỏ chọn ${dish.name}`}
                                            onClick={() => removeDish(dish.id)}
                                            className="shrink-0 rounded p-0.5 text-emerald-700 transition-colors hover:bg-emerald-100"
                                        >
                                            <X size={13} />
                                        </button>
                                    </span>
                                ))}

                                <div className="flex min-w-[110px] flex-1 items-center gap-1.5">
                                    <Search
                                        size={15}
                                        className="shrink-0 text-stone-400"
                                    />

                                    <input
                                        ref={searchInputRef}
                                        value={searchTerm}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onChange={(event) =>
                                            setSearchTerm(event.target.value)
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === 'Backspace' &&
                                                searchTerm === '' &&
                                                selectedDishIds.length > 0
                                            ) {
                                                removeDish(
                                                    selectedDishIds[
                                                    selectedDishIds.length - 1
                                                    ],
                                                )
                                            }

                                            if (event.key === 'Escape') {
                                                setSearchTerm('')
                                                setIsSearchFocused(false)
                                            }
                                        }}
                                        placeholder={
                                            selectedDishIds.length > 0
                                                ? 'Thêm món...'
                                                : 'Tìm món ăn...'
                                        }
                                        className="w-full min-w-0 !border-none !bg-transparent p-0 text-sm text-stone-800 !outline-none !ring-0 !shadow-none placeholder:text-stone-400 focus:!border-none focus:!outline-none focus:!ring-0 focus:!shadow-none hover:!border-none"
                                    />
                                </div>
                            </div>

                            <p className="mt-1.5 text-xs text-stone-500">
                                Nhập tên món để tìm kiếm, có thể chọn nhiều món.
                            </p>

                            {isDishLoading && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                                    <LoaderCircle
                                        size={14}
                                        className="animate-spin"
                                    />
                                    Đang tải danh sách món ăn...
                                </div>
                            )}
                        </div>

                        {error && (
                            <p
                                role="alert"
                                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                            >
                                {error}
                            </p>
                        )}
                    </div>

                    <footer className="flex shrink-0 justify-end gap-2 border-t border-stone-100 px-5 py-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting && (
                                <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                />
                            )}
                            {menu ? 'Lưu thay đổi' : 'Tạo thực đơn'}
                        </button>
                    </footer>
                </form>
            </section>

            {showDropdown &&
                dropdownPosition &&
                createPortal(

                    <div
                        ref={dropdownRef}
                        style={dropdownStyle}
                        className="overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
                    >
                        {!searchTerm.trim() ? (
                            <p className="px-3 py-3 text-sm text-stone-400">
                                Type to search dishes...
                            </p>
                        ) : (
                            <>
                                <div className="border-b border-stone-100 px-3 py-2 text-xs text-stone-500">
                                    {filteredDishes.length > 0
                                        ? `${filteredDishes.length} kết quả${filteredDishes.length === 30 ? ' (tối đa 30)' : ''}`
                                        : 'Không tìm thấy món phù hợp'}
                                </div>

                                {filteredDishes.map((dish) => {
                                    const isSelected = selectedDishIds.includes(dish.id)

                                    return (
                                        <button
                                            key={dish.id}
                                            type="button"
                                            onClick={() => toggleDish(dish.id)}
                                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-stone-50"
                                        >
                                            <span
                                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected
                                                        ? 'border-emerald-600 bg-emerald-600'
                                                        : 'border-stone-300 bg-white'
                                                    }`}
                                            >
                                                {isSelected && (
                                                    <svg
                                                        viewBox="0 0 16 16"
                                                        fill="none"
                                                        className="h-3 w-3 text-white"
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
                                                <span className="block truncate text-xs text-stone-500">
                                                    {dish.category ?? ''}
                                                </span>
                                            </span>

                                            {isSelected && (
                                                <span className="shrink-0 text-xs text-emerald-700">
                                                    Đã chọn
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </>
                        )}
                    </div>
                    ,
                    document.body,
                )}
        </div>
    )
}
