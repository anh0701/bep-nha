import { useEffect, useState } from 'react'
import { LoaderCircle, X } from 'lucide-react'

import DishMultiSelect from '../components/DishMultiSelect'

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
    const [isDishLoading, setIsDishLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        setMenuName(menu?.name ?? '')
        setSelectedDishIds(menu?.items.map((dish) => dish.id) ?? [])
        setError('')
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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isSubmitting
                ) {
                    onClose()
                }
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
                        disabled={isSubmitting}
                        aria-label="Đóng"
                        className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
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
                                disabled={isSubmitting}
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-emerald-600 disabled:opacity-60"
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

                            <DishMultiSelect
                                dishes={availableDishes}
                                value={selectedDishIds}
                                onChange={(dishIds) => {
                                    setSelectedDishIds(dishIds)
                                    setError('')
                                }}
                                disabled={isDishLoading || isSubmitting}
                                placeholder="Tìm món ăn..."
                                variant="emerald"
                            />

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
                            disabled={
                                isSubmitting ||
                                isDishLoading ||
                                availableDishes.length === 0
                            }
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
        </div>
    )
}
