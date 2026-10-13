import { useMemo, useState } from 'react'
import { LoaderCircle, Save, X } from 'lucide-react'

import type { Dish } from '../types/dish'
import type { CookingSession } from '../types/cooking'

interface CookingSessionFormModalProps {
    dishes: Dish[]
    session: CookingSession | null
    initialDate: string
    initialTime: string
    onClose: () => void
    onSubmit: (data: {
        date: string
        time: string
        dishIds: string[]
    }) => Promise<void>
}

export default function CookingSessionFormModal({
    dishes,
    session,
    initialDate,
    initialTime,
    onClose,
    onSubmit,
}: CookingSessionFormModalProps) {
    const [formDate, setFormDate] = useState(initialDate)
    const [formTime, setFormTime] = useState(initialTime)
    const [selectedDishIds, setSelectedDishIds] = useState<string[]>(
        session?.dishes.map((dish) => dish.id) ?? [],
    )
    const [dishSearch, setDishSearch] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const filteredDishes = useMemo(() => {
        const keyword = dishSearch.trim().toLocaleLowerCase('vi')

        return dishes.filter((dish) =>
            dish.name.toLocaleLowerCase('vi').includes(keyword),
        )
    }, [dishes, dishSearch])

    function toggleDish(dishId: string) {
        setSelectedDishIds((current) =>
            current.includes(dishId)
                ? current.filter((id) => id !== dishId)
                : [...current, dishId],
        )
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setFormError(null)

        if (selectedDishIds.length === 0) {
            setFormError('Vui lòng chọn ít nhất một món đã nấu.')
            return
        }

        if (!formDate || !formTime) {
            setFormError('Vui lòng chọn ngày và giờ nấu ăn.')
            return
        }

        try {
            setIsSubmitting(true)

            await onSubmit({
                date: formDate,
                time: formTime,
                dishIds: selectedDishIds,
            })
        } catch (err) {
            setFormError(
                err instanceof Error
                    ? err.message
                    : 'Không thể lưu lịch sử nấu ăn. Vui lòng thử lại.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm"
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
                aria-labelledby="cooking-form-title"
                className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-cream p-5 shadow-xl sm:p-7"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2
                            id="cooking-form-title"
                            className="text-xl font-bold text-ink"
                        >
                            {session
                                ? 'Sửa lịch sử nấu ăn'
                                : 'Ghi nhận nấu ăn'}
                        </h2>

                        <p className="mt-1 text-sm text-muted">
                            {session
                                ? 'Điều chỉnh ngày giờ và danh sách món đã nấu.'
                                : 'Chọn những món thực tế đã được nấu.'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="Đóng form"
                        className="rounded-lg p-2 text-muted hover:bg-beige disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label
                                htmlFor="cooked-date"
                                className="block text-sm font-medium text-ink"
                            >
                                Ngày nấu
                            </label>

                            <input
                                id="cooked-date"
                                type="date"
                                value={formDate}
                                onChange={(event) =>
                                    setFormDate(event.target.value)
                                }
                                required
                                disabled={isSubmitting}
                                className="w-full rounded-xl border border-beige bg-white px-3 py-3 text-sm text-ink outline-none focus:border-forest disabled:opacity-60"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="cooked-time"
                                className="block text-sm font-medium text-ink"
                            >
                                Giờ nấu
                            </label>

                            <input
                                id="cooked-time"
                                type="time"
                                value={formTime}
                                onChange={(event) =>
                                    setFormTime(event.target.value)
                                }
                                required
                                disabled={isSubmitting}
                                className="w-full rounded-xl border border-beige bg-white px-3 py-3 text-sm text-ink outline-none focus:border-forest disabled:opacity-60"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-sm font-medium text-ink">
                                Các món đã nấu
                            </label>

                            <span className="text-xs text-muted">
                                Đã chọn {selectedDishIds.length} món
                            </span>
                        </div>

                        <input
                            type="search"
                            value={dishSearch}
                            onChange={(event) =>
                                setDishSearch(event.target.value)
                            }
                            placeholder="Tìm món trong kho..."
                            aria-label="Tìm món trong kho"
                            disabled={isSubmitting}
                            className="w-full rounded-xl border border-beige bg-white px-4 py-3 text-sm outline-none focus:border-forest disabled:opacity-60"
                        />

                        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-beige bg-white p-2">
                            {filteredDishes.length === 0 ? (
                                <p className="px-3 py-5 text-center text-sm text-muted">
                                    Không tìm thấy món ăn.
                                </p>
                            ) : (
                                filteredDishes.map((dish) => (
                                    <label
                                        key={dish.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-sage/40"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedDishIds.includes(
                                                dish.id,
                                            )}
                                            onChange={() =>
                                                toggleDish(dish.id)
                                            }
                                            disabled={isSubmitting}
                                            className="size-4 accent-forest"
                                        />

                                        <span className="min-w-0 flex-1 text-sm text-ink">
                                            {dish.name}
                                        </span>

                                        <span className="text-xs text-muted">
                                            {dish.category}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {formError && (
                        <p
                            role="alert"
                            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {formError}
                        </p>
                    )}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-xl border border-beige px-4 py-3 text-sm font-semibold text-ink hover:bg-beige disabled:opacity-50"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting || dishes.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                            ) : (
                                <Save size={17} />
                            )}

                            {isSubmitting
                                ? 'Đang lưu...'
                                : session
                                  ? 'Lưu thay đổi'
                                  : 'Lưu lịch sử'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}
