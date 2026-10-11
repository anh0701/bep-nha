import { useEffect, useMemo, useState } from 'react'
import {
    AlertCircle,
    Check,
    CookingPot,
    LoaderCircle,
    Shuffle,
    Utensils,
} from 'lucide-react'

import { getDishes, randomizeDishes } from '../services/dish.service'
import type { Dish } from '../types/dish'
import type {
    RandomDish,
    RandomMealType,
    RandomResult,
} from '../types/random'
import CategorySelect from '../components/CategorySelect'

type SingleFilter = 'all' | 'category' | 'selected'

const mealTypes: {
    value: RandomMealType
    label: string
    description: string
}[] = [
        {
            value: 'auto',
            label: 'Ngẫu nhiên',
            description: 'Bếp Nhà tự chọn kiểu bữa ăn',
        },
        {
            value: 'rice',
            label: 'Bữa cơm',
            description: 'Món chính, rau, canh và có thể thêm món phụ',
        },
        {
            value: 'one_dish',
            label: 'Bữa một món',
            description: 'Ví dụ: bún, phở, mì hoặc cháo',
        },
    ]

const roleLabels: Record<RandomDish['meal_role'], string> = {
    main: 'Món chính',
    vegetable: 'Món rau',
    soup: 'Món canh',
    one_dish: 'Món một món',
    side: 'Món phụ',
}

export default function RandomPage() {
    const [dishes, setDishes] = useState<Dish[]>([])
    const [loadingDishes, setLoadingDishes] = useState(true)
    const [dishError, setDishError] = useState<string | null>(null)

    const [mode, setMode] = useState<'meal' | 'single'>('meal')
    const [mealType, setMealType] = useState<RandomMealType>('auto')

    const [singleFilter, setSingleFilter] = useState<SingleFilter>('all')
    const [categoryId, setCategoryId] = useState('')
    const [selectedDishIds, setSelectedDishIds] = useState<string[]>([])
    const [search, setSearch] = useState('')

    const [result, setResult] = useState<RandomResult | null>(null)
    const [hasRandomized, setHasRandomized] = useState(false)
    const [randomLoading, setRandomLoading] = useState(false)
    const [randomError, setRandomError] = useState<string | null>(null)

    useEffect(() => {
        async function loadDishes() {
            try {
                setDishError(null)
                const response = await getDishes()
                setDishes(response.data)
            } catch (error) {
                console.error('Failed to load dishes:', error)
                setDishError('Không thể tải kho món ăn. Vui lòng thử lại.')
            } finally {
                setLoadingDishes(false)
            }
        }

        void loadDishes()
    }, [])

    const categories = useMemo(() => {
        const categoryMap = new Map<string, string>()

        for (const dish of dishes) {
            categoryMap.set(dish.category_id, dish.category)
        }

        return [...categoryMap.entries()]
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    }, [dishes])

    const filteredDishes = useMemo(() => {
        const keyword = search.trim().toLocaleLowerCase('vi')

        return dishes.filter((dish) => {
            const matchesName = dish.name
                .toLocaleLowerCase('vi')
                .includes(keyword)

            const matchesCategory =
                !categoryId || dish.category_id === categoryId

            return matchesName && matchesCategory
        })
    }, [dishes, search, categoryId])

    function changeMode(nextMode: 'meal' | 'single') {
        setMode(nextMode)
        setResult(null)
        setHasRandomized(false)
        setRandomError(null)
    }

    function toggleDish(id: string) {
        setSelectedDishIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        )
    }

    async function handleRandomize() {
        setRandomError(null)

        if (
            mode === 'single' &&
            singleFilter === 'selected' &&
            selectedDishIds.length === 0
        ) {
            setRandomError('Hãy chọn ít nhất một món để random.')
            return
        }

        const request =
            mode === 'meal'
                ? {
                    mode: 'meal' as const,
                    meal_type: mealType,
                }
                : {
                    mode: 'single' as const,
                    ...(singleFilter === 'category' && categoryId
                        ? { category_id: categoryId }
                        : {}),
                    ...(singleFilter === 'selected'
                        ? { dish_ids: selectedDishIds }
                        : {}),
                }

        try {
            setRandomLoading(true)

            const response = await randomizeDishes(request)

            setResult(response)
            setHasRandomized(true)
        } catch (error) {
            console.error('Failed to randomize dishes:', error)

            setRandomError(
                error instanceof Error
                    ? error.message
                    : 'Không thể random món ăn. Vui lòng thử lại.',
            )
        } finally {
            setRandomLoading(false)
        }
    }

    const resultTitle =
        result?.mealType === 'rice'
            ? 'Bữa cơm của bạn'
            : result?.mealType === 'one_dish'
                ? 'Bữa một món của bạn'
                : 'Món được chọn'

    return (
        <div className="mx-auto max-w-5xl space-y-7 px-5 py-7 md:px-10 md:py-10">
            <header>
                <div className="flex items-center gap-2 text-sm text-muted">
                    <CookingPot size={17} />
                    Không gian bếp
                </div>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                    Hôm nay ăn gì?
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                    Để Bếp Nhà chọn món giúp bạn. Chọn một món riêng lẻ
                    hoặc để Bếp Nhà gợi ý cả bữa ăn.
                </p>
            </header>

            {dishError && (
                <div
                    role="alert"
                    className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    <AlertCircle size={18} />
                    {dishError}
                </div>
            )}

            <section className="rounded-3xl border border-beige/80 bg-white p-5 sm:p-7">
                <h2 className="font-semibold text-ink">
                    Bạn muốn random gì?
                </h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        aria-pressed={mode === 'meal'}
                        onClick={() => changeMode('meal')}
                        className={`rounded-2xl border p-4 text-left transition ${mode === 'meal'
                            ? 'border-forest bg-sage/40'
                            : 'border-beige hover:bg-cream'
                            }`}
                    >
                        <CookingPot size={23} className="text-forest" />

                        <span className="mt-3 block font-semibold text-ink">
                            Một bữa ăn
                        </span>

                        <span className="mt-1 block text-sm leading-5 text-muted">
                            Gợi ý bữa cơm hoặc một món như bún, phở, cháo.
                        </span>
                    </button>

                    <button
                        type="button"
                        aria-pressed={mode === 'single'}
                        onClick={() => changeMode('single')}
                        className={`rounded-2xl border p-4 text-left transition ${mode === 'single'
                            ? 'border-forest bg-sage/40'
                            : 'border-beige hover:bg-cream'
                            }`}
                    >
                        <Utensils size={23} className="text-forest" />

                        <span className="mt-3 block font-semibold text-ink">
                            Một món ăn
                        </span>

                        <span className="mt-1 block text-sm leading-5 text-muted">
                            Chọn ngẫu nhiên trong toàn bộ kho, một danh mục
                            hoặc danh sách món bạn chọn.
                        </span>
                    </button>
                </div>

                {mode === 'meal' ? (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-ink">
                            Kiểu bữa ăn
                        </h3>

                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            {mealTypes.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    aria-pressed={mealType === item.value}
                                    onClick={() => {
                                        setMealType(item.value)
                                        setResult(null)
                                        setHasRandomized(false)
                                        setRandomError(null)
                                    }}
                                    className={`rounded-xl border p-3 text-left transition ${mealType === item.value
                                        ? 'border-forest bg-sage/40'
                                        : 'border-beige hover:bg-cream'
                                        }`}
                                >
                                    <span className="flex items-center justify-between gap-2 text-sm font-semibold text-ink">
                                        {item.label}

                                        {mealType === item.value && (
                                            <Check
                                                size={16}
                                                className="shrink-0 text-forest"
                                            />
                                        )}
                                    </span>

                                    <span className="mt-1 block text-xs leading-5 text-muted">
                                        {item.description}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 space-y-4">
                        <h3 className="text-sm font-semibold text-ink">
                            Phạm vi chọn món
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    ['all', 'Tất cả món'],
                                    ['category', 'Theo danh mục'],
                                    ['selected', 'Món tự chọn'],
                                ] as const
                            ).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={singleFilter === value}
                                    onClick={() => {
                                        setSingleFilter(value)
                                        setResult(null)
                                        setHasRandomized(false)
                                        setRandomError(null)
                                    }}
                                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${singleFilter === value
                                        ? 'border-forest bg-sage/50 text-forest'
                                        : 'border-beige text-muted hover:bg-cream'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {singleFilter === 'category' && (
                            <div>
                                <label
                                    htmlFor="random-category"
                                    className="mb-2 block text-sm font-medium text-ink"
                                >
                                    Danh mục món ăn
                                </label>

                                <CategorySelect
                                    id="random-category"
                                    categories={categories}
                                    value={categoryId}
                                    onChange={(value) => {
                                        setCategoryId(value)
                                        setResult(null)
                                        setHasRandomized(false)
                                        setRandomError(null)
                                    }}
                                    includeAll
                                    allLabel="Tất cả danh mục"
                                    ariaLabel="Lọc theo danh mục"
                                    />
                            </div>
                        )}

                        {singleFilter === 'selected' && (
                            <div className="space-y-3">
                                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                    <p className="text-sm text-muted">
                                        Đã chọn {selectedDishIds.length} món
                                    </p>

                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Tìm món ăn..."
                                        aria-label="Tìm món trong danh sách chọn"
                                        className="w-full rounded-xl border border-beige bg-white px-3 py-2.5 text-sm outline-none focus:border-forest sm:max-w-xs"
                                    />
                                </div>

                                <div className="max-h-64 overflow-y-auto rounded-xl border border-beige">
                                    {filteredDishes.length === 0 ? (
                                        <p className="p-4 text-sm text-muted">
                                            Không tìm thấy món ăn.
                                        </p>
                                    ) : (
                                        filteredDishes.map((dish) => (
                                            <label
                                                key={dish.id}
                                                className="flex cursor-pointer items-center gap-3 border-b border-beige/60 px-4 py-3 last:border-b-0 hover:bg-cream"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDishIds.includes(
                                                        dish.id,
                                                    )}
                                                    onChange={() =>
                                                        toggleDish(dish.id)
                                                    }
                                                    className="size-4 accent-[#426344]"
                                                />

                                                <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                                                    {dish.name}
                                                </span>

                                                <span className="text-xs text-muted">
                                                    {dish.category}
                                                </span>
                                            </label>
                                        ))
                                    )}
                                </div>

                                {selectedDishIds.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedDishIds([])
                                        }
                                        className="text-sm font-medium text-forest hover:underline"
                                    >
                                        Bỏ chọn tất cả
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}


                <button
                    type="button"
                    onClick={() => void handleRandomize()}
                    disabled={loadingDishes || randomLoading || Boolean(dishError)}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3.5 font-semibold text-white transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                    {randomLoading ? (
                        <LoaderCircle size={19} className="animate-spin" />
                    ) : (
                        <Shuffle size={19} />
                    )}

                    {randomLoading
                        ? 'Đang chọn món...'
                        : hasRandomized
                            ? 'Thử lại'
                            : 'Random ngay'}
                </button>

            </section>

            {randomError && (
                <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                    />
                    {randomError}
                </div>
            )}


            {result && (
                <section
                    aria-live="polite"
                    className="rounded-3xl border border-beige/80 bg-white p-5 sm:p-7"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sage text-forest">
                            <CookingPot size={23} />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-ink">
                                {resultTitle}
                            </h2>

                            <p className="mt-1 text-sm text-muted">
                                {result.items.length > 0
                                    ? `Bếp Nhà đã chọn ${result.items.length} món cho bạn.`
                                    : result.message ??
                                    'Không tìm thấy món phù hợp.'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 h-64 overflow-y-auto overscroll-contain">
                        {result.items.length > 0 ? (
                            <div className="divide-y divide-beige/70">
                                {result.items.map((dish) => (
                                    <article
                                        key={dish.id}
                                        className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage/60 text-forest">
                                            <Utensils size={19} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-ink">
                                                {dish.name}
                                            </p>

                                            <p className="mt-1 text-xs text-muted">
                                                {result.mode === 'meal'
                                                    ? roleLabels[dish.meal_role]
                                                    : dish.category}
                                            </p>
                                        </div>

                                        {dish.cooked_recently && (
                                            <span className="shrink-0 rounded-full bg-beige px-2.5 py-1 text-xs text-muted">
                                                Mới nấu gần đây
                                            </span>
                                        )}
                                    </article>
                                ))}

                                {result.rice && (
                                    <article className="flex items-center gap-3 border-t border-beige/70 py-4">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-beige text-ink">
                                            <CookingPot size={19} />
                                        </div>

                                        <p className="font-semibold text-ink">
                                            Cơm trắng
                                        </p>
                                    </article>
                                )}
                            </div>
                        ) : (
                            <div className="flex h-64 items-center justify-center rounded-xl bg-cream p-4 text-center text-sm text-muted">
                                {result.message ??
                                    'Hãy thử một lựa chọn khác nhé.'}
                            </div>
                        )}
                    </div>
                </section>
            )}

        </div>
    )
}
