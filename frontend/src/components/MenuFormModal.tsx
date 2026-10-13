import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'

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
        let cancelled = false

        async function loadDishes() {
            setIsDishLoading(true)

            try {
                const response = await getDishes()

                if (cancelled) return

                setAvailableDishes(
                    response.data.filter((dish) => dish.is_active),
                )
            } catch (err) {
                if (cancelled) return

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Không thể tải danh sách món ăn.',
                )
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

    function toggleDish(dishId: string) {
        setSelectedDishIds((previous) =>
            previous.includes(dishId)
                ? previous.filter((id) => id !== dishId)
                : [...previous, dishId],
        )
    }

    async function handleSubmit() {
        const name = menuName.trim()

        if (!name) {
            setError('Vui lòng nhập tên thực đơn.')
            return
        }

        if (name.length > 100) {
            setError('Tên thực đơn không được vượt quá 100 ký tự.')
            return
        }

        if (selectedDishIds.length === 0) {
            setError('Vui lòng chọn ít nhất một món.')
            return
        }

        if (isSubmitting) return

        setIsSubmitting(true)
        setError('')

        const input: CreateManualMenuInput = {
            name,
            dishIds: selectedDishIds,
        }

        try {
            if (menu) {
                await updateManualMenu(menu.id, input)
                onSuccess('updated', name)
            } else {
                await createManualMenu(input)
                onSuccess('created', name)
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Không thể lưu thực đơn.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
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
                className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
            >
                <h2 id="menu-form-title" className="text-xl font-bold">
                    {menu ? 'Sửa thực đơn' : 'Tạo thực đơn'}
                </h2>

                <p className="mt-2 text-sm text-muted">
                    Đặt tên và chọn các món muốn đưa vào thực đơn.
                </p>

                {error && (
                    <div
                        role="alert"
                        className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                        {error}
                        <button
                            type="button"
                            onClick={() => setError('')}
                            className="ml-2 font-semibold underline"
                        >
                            Đóng
                        </button>
                    </div>
                )}

                <label
                    htmlFor="menu-name"
                    className="mt-5 block text-sm font-semibold"
                >
                    Tên thực đơn
                </label>

                <input
                    id="menu-name"
                    type="text"
                    maxLength={100}
                    value={menuName}
                    onChange={(event) => setMenuName(event.target.value)}
                    placeholder="Ví dụ: Bữa cơm gia đình"
                    disabled={isSubmitting}
                    className="mt-2 w-full rounded-xl border border-beige px-4 py-3 outline-none focus:border-forest disabled:opacity-50"
                />

                <div className="mt-5 flex items-center justify-between gap-3">
                    <h3 className="font-semibold">Chọn món ăn</h3>
                    <span className="text-sm text-muted">
                        Đã chọn {selectedDishIds.length} món
                    </span>
                </div>

                {isDishLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-muted">
                        <LoaderCircle size={20} className="animate-spin" />
                        Đang tải danh sách món...
                    </div>
                ) : availableDishes.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted">
                        Không có món ăn đang hoạt động.
                    </p>
                ) : (
                    <div className="mt-3 max-h-72 divide-y divide-beige overflow-y-auto rounded-xl border border-beige">
                        {availableDishes.map((dish) => (
                            <label
                                key={dish.id}
                                className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-cream"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedDishIds.includes(dish.id)}
                                    onChange={() => toggleDish(dish.id)}
                                    disabled={isSubmitting}
                                    className="size-4 accent-forest"
                                />

                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium">
                                        {dish.name}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-muted">
                                        {dish.category}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </div>
                )}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="rounded-xl border border-beige px-4 py-3 text-sm font-semibold hover:bg-cream disabled:opacity-50"
                    >
                        Hủy
                    </button>

                    <button
                        type="button"
                        disabled={isSubmitting || isDishLoading}
                        onClick={() => void handleSubmit()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                                Đang lưu...
                            </>
                        ) : menu ? (
                            'Lưu thay đổi'
                        ) : (
                            'Tạo thực đơn'
                        )}
                    </button>
                </div>
            </section>
        </div>
    )
}
