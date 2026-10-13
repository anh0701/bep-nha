import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import {
    ArrowLeft,
    CalendarDays,
    Check,
    ChefHat,
    Clock,
    CookingPot,
    LoaderCircle,
} from 'lucide-react'

import type { SavedMenu, SavedMenuDish } from '../types/menu'

import {
    getSavedMenuById,
    deleteManualMenu,
} from '../services/menu.service'

import {
    createCookingSession,
    getCookedDishIds,
} from '../services/cooking.service'

import MenuFormModal from '../components/MenuFormModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'

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

type CookingTarget =
    | { type: 'dish'; dish: SavedMenuDish }
    | { type: 'menu'; menu: SavedMenu }

export default function MealPlanDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [menu, setMenu] = useState<SavedMenu | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    const [cookedDishIds, setCookedDishIds] = useState<Set<string>>(
        () => new Set(),
    )
    const [isCookedStatusLoading, setIsCookedStatusLoading] = useState(true)

    const [cookingTarget, setCookingTarget] = useState<CookingTarget | null>(
        null,
    )
    const [cookedAt, setCookedAt] = useState(getLocalDateTime())
    const [isSaving, setIsSaving] = useState(false)

    const [isMenuFormOpen, setIsMenuFormOpen] = useState(false)

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isDeletingMenu, setIsDeletingMenu] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const loadMenu = useCallback(async () => {
        if (!id) {
            setMenu(null)
            setError('Không tìm thấy ID thực đơn.')
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const response = await getSavedMenuById(id)
            setMenu(response.data)
        } catch (err) {
            setMenu(null)
            setError(
                err instanceof Error
                    ? err.message
                    : 'Không thể tải chi tiết thực đơn.',
            )
        } finally {
            setIsLoading(false)
        }
    }, [id])

    useEffect(() => {
        void loadMenu()
    }, [loadMenu])

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

            setCookedDishIds((previous) => {
                const next = new Set(previous)
                dishIds.forEach((dishId) => next.add(dishId))
                return next
            })

            setNotice(
                cookingTarget.type === 'dish'
                    ? `Đã ghi nhận món "${cookingTarget.dish.name}" vào lịch sử nấu ăn.`
                    : `Đã ghi nhận ${dishIds.length} món trong thực đơn vào lịch sử nấu ăn.`,
            )

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

    function openEditForm() {
        if (!menu || menu.source !== 'manual') return

        setError('')
        setNotice('')
        setIsMenuFormOpen(true)
    }

    function handleMenuFormSuccess(
        _action: 'created' | 'updated',
        name: string,
    ) {
        setIsMenuFormOpen(false)
        setNotice(`Đã cập nhật thực đơn "${name}".`)
        void loadMenu()
    }

    function openDeleteModal() {
        if (!menu || menu.source !== 'manual') return

        setDeleteError(null)
        setIsDeleteModalOpen(true)
    }

    async function handleDeleteMenu() {
        if (!menu || menu.source !== 'manual' || isDeletingMenu) return

        setIsDeletingMenu(true)
        setDeleteError(null)

        try {
            await deleteManualMenu(menu.id)

            setIsDeleteModalOpen(false)

            navigate('/meal-plan', {
                replace: true,
                state: { notice: 'Đã xóa thực đơn.' },
            })
        } catch (err) {
            setDeleteError(
                err instanceof Error
                    ? err.message
                    : 'Không thể xóa thực đơn.',
            )
        } finally {
            setIsDeletingMenu(false)
        }
    }

    return (
        <main className="min-h-screen bg-cream px-4 py-8 text-ink sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
                <header className="mb-8">
                    <div className="mb-3 flex items-center gap-2 text-forest">
                        <ChefHat size={25} />
                        <span className="text-sm font-semibold uppercase tracking-widest">
                            Bếp Nhà
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/meal-plan')}
                        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
                    >
                        <ArrowLeft size={18} />
                        Quay lại danh sách
                    </button>
                </header>

                {notice && (
                    <div
                        role="status"
                        className="mb-6 flex items-start gap-3 rounded-xl border border-sage bg-white p-4"
                    >
                        <Check size={20} className="shrink-0 text-forest" />

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
                        <LoaderCircle size={22} className="animate-spin" />
                        Đang tải chi tiết thực đơn...
                    </div>
                ) : !menu ? (
                    <div className="rounded-2xl border border-beige bg-white p-8 text-center">
                        <h1 className="text-xl font-bold">
                            Không tìm thấy thực đơn
                        </h1>

                        <p className="mt-2 text-sm text-muted">
                            Thực đơn có thể đã bị xóa hoặc không tồn tại.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                navigate('/meal-plan', { replace: true })
                            }
                            className="mt-5 rounded-xl bg-forest px-5 py-3 font-semibold text-white"
                        >
                            Về danh sách thực đơn
                        </button>
                    </div>
                ) : (
                    <section className="rounded-2xl border border-beige bg-white p-5 sm:p-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <span className="inline-flex rounded-full bg-cream px-3 py-1 text-xs font-medium text-muted">
                                    {menu.source === 'manual'
                                        ? 'Thực đơn tự tạo'
                                        : 'Thực đơn ngẫu nhiên'}
                                </span>

                                <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                                    {menu.name || `Thực đơn #${menu.id}`}
                                </h1>

                                <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                                    <CalendarDays size={16} />
                                    Ngày tạo: {formatDate(menu.created_at)}
                                </p>

                                <p className="mt-1 text-sm text-muted">
                                    {menu.items.length} món ăn
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {menu.source === 'manual' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={openEditForm}
                                            className="rounded-xl border border-beige px-4 py-3 text-sm font-semibold hover:border-forest hover:text-forest"
                                        >
                                            Sửa thực đơn
                                        </button>

                                        <button
                                            type="button"
                                            onClick={openDeleteModal}
                                            className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                                        >
                                            Xóa
                                        </button>
                                    </>
                                )}

                                <button
                                    type="button"
                                    disabled={menu.items.length === 0}
                                    onClick={() =>
                                        openCookingDialog({
                                            type: 'menu',
                                            menu,
                                        })
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <CookingPot size={18} />
                                    Nấu cả thực đơn
                                </button>
                            </div>
                        </div>

                        {menu.items.length === 0 ? (
                            <p className="py-12 text-center text-muted">
                                Thực đơn này chưa có món ăn.
                            </p>
                        ) : (
                            <div className="mt-8 divide-y divide-beige">
                                {menu.items.map((dish, index) => (
                                    <article
                                        key={dish.id}
                                        className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 items-start gap-4">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage text-forest">
                                                <span className="font-bold">
                                                    {index + 1}
                                                </span>
                                            </div>

                                            <div className="min-w-0">
                                                <h2 className="font-semibold">
                                                    {dish.name}
                                                </h2>

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
                                            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-beige px-4 py-2 text-sm font-semibold hover:border-forest hover:text-forest disabled:cursor-wait disabled:opacity-60 sm:self-auto"
                                        >
                                            {isCookedStatusLoading ? (
                                                <>
                                                    <LoaderCircle
                                                        size={17}
                                                        className="animate-spin"
                                                    />
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
                    </section>
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
                                        : `Ghi nhận ${cookingTarget.menu.items.length} món trong ${cookingTarget.menu.name || `thực đơn #${cookingTarget.menu.id}`}.`}
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
                            onChange={(event) =>
                                setCookedAt(event.target.value)
                            }
                            disabled={isSaving}
                            className="mt-2 w-full rounded-xl border border-beige bg-white px-4 py-3 text-sm outline-none focus:border-forest disabled:opacity-50"
                        />

                        {error && (
                            <p
                                role="alert"
                                className="mt-3 text-sm text-red-600"
                            >
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
                                        <LoaderCircle
                                            size={17}
                                            className="animate-spin"
                                        />
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
                                Tất cả món trong thực đơn sẽ được ghi vào cùng
                                một phiên nấu ăn tại thời điểm đã chọn.
                            </p>
                        )}
                    </section>
                </div>
            )}

            {isMenuFormOpen && menu && (
                <MenuFormModal
                    menu={menu}
                    onClose={() => {
                        setIsMenuFormOpen(false)
                        setError('')
                    }}
                    onSuccess={handleMenuFormSuccess}
                />
            )}

            {isDeleteModalOpen && menu && (
                <ConfirmDeleteModal
                    title="Xóa thực đơn?"
                    description={
                        <>
                            Bạn có chắc muốn xóa thực đơn{' '}
                            <strong>
                                "{menu.name || `Thực đơn #${menu.id}`}"
                            </strong>
                            ? Thao tác này không thể hoàn tác.
                        </>
                    }
                    confirmLabel="Xóa thực đơn"
                    loadingLabel="Đang xóa..."
                    isLoading={isDeletingMenu}
                    error={deleteError}
                    onConfirm={() => void handleDeleteMenu()}
                    onCancel={() => {
                        if (isDeletingMenu) return

                        setIsDeleteModalOpen(false)
                        setDeleteError(null)
                    }}
                />
            )}
        </main>
    )
}
