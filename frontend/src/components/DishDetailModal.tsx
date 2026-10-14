import { useEffect, useState } from 'react'
import {
    AlertTriangle,
    LoaderCircle,
    ShieldCheck,
    Utensils,
    X,
} from 'lucide-react'

import type { Dish } from '../types/dish'
import type { DishIngredient } from '../types/dish-ingredient'

import { getDishIngredients } from '../services/dish.service'

interface DishDetailModalProps {
    dish: Dish
    onClose: () => void
}

export default function DishDetailModal({
    dish,
    onClose,
}: DishDetailModalProps) {
    const [ingredients, setIngredients] = useState<DishIngredient[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function loadIngredients() {
            setLoading(true)
            setError(null)

            try {
                const result = await getDishIngredients(dish.id)

                if (!cancelled) {
                    setIngredients(result.data)
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Không thể tải nguyên liệu của món ăn.',
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        void loadIngredients()

        return () => {
            cancelled = true
        }
    }, [dish.id])

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [onClose])

    const allergenicIngredients = ingredients.filter(
        (ingredient) => ingredient.is_allergen,
    )

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose()
                }
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="dish-detail-title"
                className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-cream shadow-2xl"
            >
                {/* Header */}
                <header className="flex items-start justify-between gap-4 border-b border-forest/10 px-5 py-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sage/30 text-forest">
                            <Utensils size={21} />
                        </div>

                        <div className="min-w-0">
                            <h2
                                id="dish-detail-title"
                                className="break-words text-lg font-bold text-ink"
                            >
                                {dish.name}
                            </h2>

                            <p className="mt-1 text-sm text-ink/60">
                                {dish.category}
                            </p>

                            <span
                                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                    dish.is_active
                                        ? 'bg-sage/30 text-forest'
                                        : 'bg-black/5 text-ink/60'
                                }`}
                            >
                                {dish.is_active
                                    ? 'Đang hoạt động'
                                    : 'Ngừng hoạt động'}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng chi tiết món ăn"
                        className="shrink-0 rounded-lg p-2 text-ink/60 transition hover:bg-black/5 hover:text-ink"
                    >
                        <X size={20} />
                    </button>
                </header>

                {/* Nội dung */}
                <div className="overflow-y-auto px-5 py-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-ink">
                            Nguyên liệu
                        </h3>

                        {!loading && !error && (
                            <span className="text-sm text-ink/50">
                                {ingredients.length} nguyên liệu
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink/60">
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                            Đang tải nguyên liệu...
                        </div>
                    ) : error ? (
                        <div
                            role="alert"
                            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    ) : ingredients.length === 0 ? (
                        <div className="rounded-xl bg-white/60 px-4 py-8 text-center">
                            <Utensils
                                size={26}
                                className="mx-auto mb-2 text-ink/30"
                            />

                            <p className="text-sm font-medium text-ink/70">
                                Chưa có nguyên liệu
                            </p>

                            <p className="mt-1 text-xs text-ink/50">
                                Món ăn này chưa được khai báo danh sách nguyên liệu.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-forest/10">
                            {ingredients.map((ingredient) => (
                                <div
                                    key={ingredient.ingredient_id}
                                    className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="break-words text-sm font-medium text-ink">
                                                {ingredient.ingredient_name}
                                            </span>

                                            {ingredient.is_allergen && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                                    <AlertTriangle size={12} />
                                                    Gây dị ứng
                                                </span>
                                            )}

                                            {ingredient.is_optional && (
                                                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-ink/60">
                                                    Tùy chọn
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-1 text-xs text-ink/50">
                                            {ingredient.ingredient_category_name}
                                            {' · '}
                                            {ingredient.ingredient_role === 'main'
                                                ? 'Nguyên liệu chính'
                                                : 'Nguyên liệu phụ'}
                                        </p>

                                        {ingredient.preparation_note && (
                                            <p className="mt-1.5 text-xs leading-relaxed text-ink/60">
                                                Sơ chế: {ingredient.preparation_note}
                                            </p>
                                        )}
                                    </div>

                                    <span className="shrink-0 text-right text-sm font-medium text-ink">
                                        {ingredient.quantity_per_person}{' '}
                                        {ingredient.unit}

                                        <span className="mt-1 block text-xs font-normal text-ink/50">
                                            / người
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Cảnh báo dị ứng */}
                    {!loading && !error && (
                        <div
                            className={`mt-5 rounded-xl border p-4 ${
                                allergenicIngredients.length > 0
                                    ? 'border-amber-300 bg-amber-50'
                                    : 'border-sage/40 bg-sage/10'
                            }`}
                            role={
                                allergenicIngredients.length > 0
                                    ? 'alert'
                                    : 'status'
                            }
                        >
                            <div className="flex items-start gap-2.5">
                                {allergenicIngredients.length > 0 ? (
                                    <AlertTriangle
                                        size={20}
                                        className="mt-0.5 shrink-0 text-amber-700"
                                    />
                                ) : (
                                    <ShieldCheck
                                        size={20}
                                        className="mt-0.5 shrink-0 text-forest"
                                    />
                                )}

                                <div className="min-w-0">
                                    <h3
                                        className={`text-sm font-semibold ${
                                            allergenicIngredients.length > 0
                                                ? 'text-amber-900'
                                                : 'text-forest'
                                        }`}
                                    >
                                        {allergenicIngredients.length > 0
                                            ? 'Cảnh báo dị ứng'
                                            : 'Chưa ghi nhận nguyên liệu gây dị ứng'}
                                    </h3>

                                    {allergenicIngredients.length > 0 ? (
                                        <>
                                            <p className="mt-1 text-sm leading-relaxed text-amber-900">
                                                Món ăn có chứa nguyên liệu được đánh dấu gây dị ứng:
                                            </p>

                                            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-900">
                                                {allergenicIngredients.map(
                                                    (ingredient) => (
                                                        <li
                                                            key={ingredient.ingredient_id}
                                                        >
                                                            {ingredient.ingredient_name}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </>
                                    ) : (
                                        <p className="mt-1 text-xs leading-relaxed text-forest/80">
                                            Thông báo này chỉ dựa trên dữ liệu đã khai báo trong hệ thống, không đảm bảo món ăn hoàn toàn không gây dị ứng.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="flex justify-end border-t border-forest/10 px-5 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-forest px-4 py-2 text-sm font-medium text-white transition hover:bg-forest/90"
                    >
                        Đóng
                    </button>
                </footer>
            </section>
        </div>
    )
}
