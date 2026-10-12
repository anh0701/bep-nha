
import { useCallback, useEffect, useState } from 'react'
import {
    ArrowLeft,
    CalendarDays,
    Check,
    ChefHat,
    Clock,
    CookingPot,
    LoaderCircle,
    Utensils,
} from 'lucide-react'

import type {
    SavedMenu,
    SavedMenuDish,
} from '../types/menu'

import {
    getSavedMenus,
    getSavedMenuById,
} from '../services/menu.service'

import { createCookingSession, getCookedDishIds } from '../services/cooking.service'

function getLocalDateTime(): string {
    const now = new Date()
    const localDate = new Date(
        now.getTime() - now.getTimezoneOffset() * 60_000,
    )

    return localDate.toISOString().slice(0, 16)
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

function formatDateTime(value: string): string {
    return new Date(value).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

type CookingTarget =
    | {
        type: 'dish'
        dish: SavedMenuDish
    }
    | {
        type: 'menu'
        menu: SavedMenu
    }

export default function MealPlanPage() {
    const [menus, setMenus] = useState<SavedMenu[]>([])
    const [selectedMenu, setSelectedMenu] = useState<SavedMenu | null>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [isDetailLoading, setIsDetailLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    const [cookingTarget, setCookingTarget] =
        useState<CookingTarget | null>(null)

    const [cookedAt, setCookedAt] = useState(getLocalDateTime())

    const [cookedDishIds, setCookedDishIds] = useState<Set<string>>(
        () => new Set(),
    )

    const [isCookedStatusLoading, setIsCookedStatusLoading] =
        useState(true)

    const loadMenus = useCallback(async () => {
        setIsLoading(true)
        setError('')

        try {
            const response = await getSavedMenus()
            setMenus(response.data)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Không thể tải danh sách thực đơn.',
            )
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadMenus()
    }, [loadMenus])

    async function openMenu(menu: SavedMenu) {
        setSelectedMenu(menu)
        setIsDetailLoading(true)
        setError('')
        setNotice('')

        try {
            const response = await getSavedMenuById(menu.id)
            setSelectedMenu(response.data)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Không thể tải chi tiết thực đơn.',
            )
        } finally {
            setIsDetailLoading(false)
        }
    }

    useEffect(() => {
        let cancelled = false

        async function loadCookedDishIds() {
            setIsCookedStatusLoading(true)

            try {
                const ids = await getCookedDishIds()

                if (!cancelled) {
                    setCookedDishIds(new Set(ids))
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Không thể tải trạng thái món đã nấu.',
                    )
                }
            } finally {
                if (!cancelled) {
                    setIsCookedStatusLoading(false)
                }
            }
        }

        void loadCookedDishIds()

        return () => {
            cancelled = true
        }
    }, [])

    function openCookingDialog(target: CookingTarget) {
        setCookingTarget(target)
        setCookedAt(getLocalDateTime())
        setError('')
        setNotice('')
    }

    async function confirmCook() {
        if (!cookingTarget || !cookedAt || isSaving) return

        const dishIds =
            cookingTarget.type === 'dish'
                ? [cookingTarget.dish.id]
                : cookingTarget.menu.items.map((dish) => dish.id)

        if (dishIds.length === 0) {
            setError('Thực đơn này chưa có món ăn.')
            return
        }

        const selectedTime = new Date(cookedAt)

        if (Number.isNaN(selectedTime.getTime())) {
            setError('Thời gian nấu không hợp lệ.')
            return
        }

        if (selectedTime.getTime() > Date.now()) {
            setError('Thời gian nấu không thể ở tương lai.')
            return
        }

        setIsSaving(true)
        setError('')

        try {
            await createCookingSession({
                dishIds,
                cookedAt: selectedTime.toISOString(),
            })

            const successMessage =
                cookingTarget.type === 'dish'
                    ? `Đã ghi nhận món "${cookingTarget.dish.name}" vào lịch sử nấu ăn.`
                    : `Đã ghi nhận ${dishIds.length} món trong thực đơn vào lịch sử nấu ăn.`

            setCookedDishIds((previous) => {
                const next = new Set(previous)

                dishIds.forEach((id) => next.add(id))

                return next
            })

            setNotice(successMessage)
            setCookingTarget(null)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Không thể lưu lịch sử nấu ăn.',
            )
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <main className="min-h-screen bg-cream px-4 py-8 text-ink sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8">
                    <div className="mb-3 flex items-center gap-2 text-forest">
                        <ChefHat size={25} />
                        <span className="text-sm font-semibold uppercase tracking-widest">
                            Bếp Nhà
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Thực đơn của bạn
                    </h1>

                    <p className="mt-2 max-w-2xl text-muted">
                        Xem lại những thực đơn đã lưu, chọn món muốn nấu
                        và ghi lại hành trình nấu ăn của bạn.
                    </p>
                </header>

                {notice && (
                    <div
                        role="status"
                        className="mb-6 flex items-start gap-3 rounded-xl border border-sage bg-white p-4"
                    >
                        <Check className="mt-0.5 shrink-0 text-forest" size={20} />
                        <p className="text-sm">{notice}</p>
                        <button
                            type="button"
                            onClick={() => setNotice('')}
                            className="ml-auto text-sm text-muted hover:text-ink"
                        >
                            Đóng
                        </button>
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="mb-6 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700"
                    >
                        {error}
                        <button
                            type="button"
                            onClick={() => setError('')}
                            className="ml-3 font-semibold underline"
                        >
                            Đóng
                        </button>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center gap-3 py-20 text-muted">
                        <LoaderCircle className="animate-spin" size={22} />
                        <span>Đang tải thực đơn...</span>
                    </div>
                ) : selectedMenu ? (
                    <section>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedMenu(null)
                                setError('')
                                setNotice('')
                            }}
                            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
                        >
                            <ArrowLeft size={18} />
                            Quay lại danh sách
                        </button>

                        <div className="rounded-2xl border border-beige bg-white p-5 sm:p-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-sm text-muted">
                                        Thực đơn #{selectedMenu.id}
                                    </p>

                                    <h2 className="mt-1 text-2xl font-bold">
                                        Thực đơn đã lưu
                                    </h2>

                                    <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                                        <CalendarDays size={16} />
                                        Tạo ngày {formatDate(selectedMenu.created_at)}
                                    </p>

                                    <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                                        <Utensils size={16} />
                                        {selectedMenu.items.length} món ăn
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        isDetailLoading ||
                                        selectedMenu.items.length === 0
                                    }
                                    onClick={() =>
                                        openCookingDialog({
                                            type: 'menu',
                                            menu: selectedMenu,
                                        })
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <CookingPot size={19} />
                                    Nấu cả thực đơn
                                </button>
                            </div>

                            {isDetailLoading ? (
                                <div className="flex items-center justify-center gap-2 py-12 text-muted">
                                    <LoaderCircle className="animate-spin" size={20} />
                                    Đang tải chi tiết...
                                </div>
                            ) : selectedMenu.items.length === 0 ? (
                                <p className="py-10 text-center text-muted">
                                    Thực đơn này chưa có món ăn.
                                </p>
                            ) : (
                                <div className="mt-8 divide-y divide-beige">
                                    {selectedMenu.items.map((dish, index) => (
                                        <article
                                            key={dish.id}
                                            className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex min-w-0 items-start gap-4">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage text-forest">
                                                    <span className="font-bold">{index + 1}</span>
                                                </div>

                                                <div className="min-w-0">
                                                    <h3 className="font-semibold">{dish.name}</h3>
                                                    <p className="mt-1 text-sm text-muted">
                                                        {dish.category}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={isCookedStatusLoading}
                                                onClick={() =>
                                                    openCookingDialog({
                                                        type: 'dish',
                                                        dish,
                                                    })
                                                }
                                                className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-beige px-4 py-2 text-sm font-semibold transition hover:border-forest hover:text-forest disabled:cursor-wait disabled:opacity-60 sm:self-auto"
                                            >
                                                {isCookedStatusLoading ? (
                                                    <>
                                                        <LoaderCircle size={17} className="animate-spin" />
                                                        Đang tải...
                                                    </>
                                                ) : cookedDishIds.has(dish.id) ? (
                                                    <>
                                                        <Check size={17} />
                                                        Nấu lại
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check size={17} />
                                                        Đánh dấu đã nấu
                                                    </>
                                                )}
                                            </button>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                ) : menus.length === 0 ? (
                    <div className="rounded-2xl border border-beige bg-white px-5 py-16 text-center">
                        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-sage text-forest">
                            <CookingPot size={30} />
                        </div>

                        <h2 className="mt-5 text-xl font-bold">
                            Chưa có thực đơn nào
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                            Hãy vào trang Chọn món ngẫu nhiên và tạo một thực đơn
                            để lưu lại tại đây.
                        </p>

                        <a
                            href="/random"
                            className="mt-6 inline-flex rounded-xl bg-forest px-5 py-3 font-semibold text-white hover:opacity-90"
                        >
                            Đến trang chọn món
                        </a>

                        <button
                            type="button"
                            onClick={() => void loadMenus()}
                            className="mx-auto mt-4 block text-sm font-semibold text-forest hover:underline"
                        >
                            Tải lại danh sách
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-5 flex items-center justify-between">
                            <p className="text-sm text-muted">
                                Có {menus.length} thực đơn đã lưu
                            </p>

                            <button
                                type="button"
                                onClick={() => void loadMenus()}
                                className="text-sm font-semibold text-forest hover:underline"
                            >
                                Tải lại
                            </button>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {menus.map((menu) => (
                                <article
                                    key={menu.id}
                                    className="flex flex-col rounded-2xl border border-beige bg-white p-5 transition hover:border-sage"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex size-12 items-center justify-center rounded-xl bg-sage text-forest">
                                            <Utensils size={23} />
                                        </div>

                                        <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-muted">
                                            {menu.items.length} món
                                        </span>
                                    </div>

                                    <h2 className="mt-5 text-lg font-bold">
                                        Thực đơn #{menu.id}
                                    </h2>

                                    <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                                        <CalendarDays size={15} />
                                        {formatDate(menu.created_at)}
                                    </p>

                                    <div className="mt-4 flex-1">
                                        {menu.items.length > 0 ? (
                                            <ul className="space-y-2">
                                                {menu.items.slice(0, 3).map((dish) => (
                                                    <li
                                                        key={dish.id}
                                                        className="truncate text-sm"
                                                    >
                                                        <span className="mr-2 text-forest">•</span>
                                                        {dish.name}
                                                    </li>
                                                ))}

                                                {menu.items.length > 3 && (
                                                    <li className="text-sm text-muted">
                                                        Và {menu.items.length - 3} món khác...
                                                    </li>
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-muted">
                                                Chưa có món ăn.
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => void openMenu(menu)}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-beige px-4 py-3 text-sm font-semibold transition hover:border-forest hover:text-forest"
                                    >
                                        Xem chi tiết
                                        <ArrowLeft className="rotate-180" size={16} />
                                    </button>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {cookingTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !isSaving
                        ) {
                            setCookingTarget(null)
                            setError('')
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cooking-dialog-title"
                        className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex size-11 items-center justify-center rounded-xl bg-sage text-forest">
                                    <CookingPot size={23} />
                                </div>

                                <h2
                                    id="cooking-dialog-title"
                                    className="mt-4 text-xl font-bold"
                                >
                                    Xác nhận đã nấu
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-muted">
                                    {cookingTarget.type === 'dish'
                                        ? `Ghi nhận "${cookingTarget.dish.name}" vào lịch sử nấu ăn.`
                                        : `Ghi nhận ${cookingTarget.menu.items.length} món trong thực đơn #${cookingTarget.menu.id}.`}
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => {
                                    setCookingTarget(null)
                                    setError('')
                                }}
                                aria-label="Đóng hộp thoại"
                                className="rounded-lg p-2 text-muted hover:bg-cream disabled:opacity-50"
                            >
                                <span className="text-xl">×</span>
                            </button>
                        </div>

                        <label
                            htmlFor="cooked-at"
                            className="mt-6 flex items-center gap-2 text-sm font-semibold"
                        >
                            <Clock size={17} />
                            Ngày và giờ nấu
                        </label>

                        <input
                            id="cooked-at"
                            type="datetime-local"
                            value={cookedAt}
                            max={getLocalDateTime()}
                            onChange={(event) => setCookedAt(event.target.value)}
                            disabled={isSaving}
                            className="mt-2 w-full rounded-xl border border-beige bg-white px-4 py-3 text-sm outline-none focus:border-forest disabled:opacity-50"
                        />

                        {error && (
                            <p role="alert" className="mt-3 text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => {
                                    setCookingTarget(null)
                                    setError('')
                                }}
                                className="rounded-xl border border-beige px-4 py-3 text-sm font-semibold hover:bg-cream disabled:opacity-50"
                            >
                                Hủy
                            </button>

                            <button
                                type="button"
                                disabled={isSaving || !cookedAt}
                                onClick={() => void confirmCook()}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <LoaderCircle className="animate-spin" size={17} />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Check size={17} />
                                        Xác nhận đã nấu
                                    </>
                                )}
                            </button>
                        </div>

                        {cookingTarget.type === 'menu' && (
                            <p className="mt-4 text-xs leading-5 text-muted">
                                Tất cả món trong thực đơn sẽ được ghi vào cùng một
                                phiên nấu ăn tại thời điểm đã chọn.
                            </p>
                        )}
                    </section>
                </div>
            )}
        </main>
    )
}
