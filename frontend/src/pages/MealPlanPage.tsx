import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
    CalendarDays,
    Check,
    ChefHat,
    LoaderCircle,
    Utensils,
} from 'lucide-react'

import type { SavedMenu } from '../types/menu'

import {
    getSavedMenus,
    deleteManualMenu,
} from '../services/menu.service'

import MenuFormModal from '../components/MenuFormModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

export default function MealPlanPage() {
    const navigate = useNavigate()

    const [menus, setMenus] = useState<SavedMenu[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    const [isMenuFormOpen, setIsMenuFormOpen] = useState(false)
    const [editingMenu, setEditingMenu] = useState<SavedMenu | null>(null)

    const [deletingMenuId, setDeletingMenuId] = useState<string | null>(null)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [menuToDelete, setMenuToDelete] = useState<SavedMenu | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)

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

    function openMenuForm(menu?: SavedMenu) {
        setError('')
        setNotice('')
        setEditingMenu(menu ?? null)
        setIsMenuFormOpen(true)
    }

    function handleMenuFormSuccess(
        action: 'created' | 'updated',
        name: string,
    ) {
        setIsMenuFormOpen(false)
        setEditingMenu(null)

        setNotice(
            action === 'created'
                ? `Đã tạo thực đơn "${name}".`
                : `Đã cập nhật thực đơn "${name}".`,
        )

        void loadMenus()
    }

    function openDeleteModal(menu: SavedMenu) {
        if (menu.source !== 'manual' || deletingMenuId !== null) return

        setMenuToDelete(menu)
        setDeleteError(null)
        setIsDeleteModalOpen(true)
    }

    async function handleDeleteMenu() {
        if (
            !menuToDelete ||
            menuToDelete.source !== 'manual' ||
            deletingMenuId !== null
        ) {
            return
        }

        const menu = menuToDelete

        setDeletingMenuId(menu.id)
        setDeleteError(null)

        try {
            await deleteManualMenu(menu.id)

            setIsDeleteModalOpen(false)
            setMenuToDelete(null)
            setNotice(
                `Đã xóa thực đơn "${menu.name || `Thực đơn #${menu.id}`}".`,
            )

            await loadMenus()
        } catch (err) {
            setDeleteError(
                err instanceof Error
                    ? err.message
                    : 'Không thể xóa thực đơn.',
            )
        } finally {
            setDeletingMenuId(null)
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
                        Xem lại những thực đơn đã lưu, tạo thực đơn riêng
                        và ghi lại hành trình nấu ăn của bạn.
                    </p>

                    <button
                        type="button"
                        onClick={() => openMenuForm()}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 font-semibold text-white transition hover:opacity-90"
                    >
                        <Utensils size={18} />
                        Tạo thực đơn
                    </button>
                </header>

                {notice && (
                    <div
                        role="status"
                        className="mb-6 flex items-start gap-3 rounded-xl border border-sage bg-white p-4"
                    >
                        <Check
                            className="mt-0.5 shrink-0 text-forest"
                            size={20}
                        />

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
                ) : menus.length === 0 ? (
                    <div className="rounded-2xl border border-beige bg-white px-5 py-16 text-center">
                        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-sage text-forest">
                            <Utensils size={30} />
                        </div>

                        <h2 className="mt-5 text-xl font-bold">
                            Chưa có thực đơn nào
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                            Tạo thực đơn của riêng bạn hoặc vào trang chọn món
                            ngẫu nhiên để bắt đầu.
                        </p>

                        <a
                            href="/random"
                            className="mt-6 inline-flex rounded-xl border border-beige px-5 py-3 font-semibold hover:border-forest hover:text-forest"
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
                                        {menu.name || `Thực đơn #${menu.id}`}
                                    </h2>

                                    <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                                        <CalendarDays size={15} />
                                        {formatDate(menu.created_at)}
                                    </p>

                                    <p className="mt-2 text-xs text-muted">
                                        {menu.source === 'manual'
                                            ? 'Thực đơn tự tạo'
                                            : 'Thực đơn ngẫu nhiên'}
                                    </p>

                                    <div className="mt-4 flex-1">
                                        {menu.items.length > 0 ? (
                                            <ul className="space-y-2">
                                                {menu.items
                                                    .slice(0, 3)
                                                    .map((dish) => (
                                                        <li
                                                            key={dish.id}
                                                            className="truncate text-sm"
                                                        >
                                                            <span className="mr-2 text-forest">
                                                                •
                                                            </span>
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

                                    {menu.source === 'manual' && (
                                        <div className="mt-5 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openMenuForm(menu)}
                                                className="flex-1 rounded-xl border border-beige px-3 py-2.5 text-sm font-semibold transition hover:border-forest hover:text-forest"
                                            >
                                                Sửa
                                            </button>

                                            <button
                                                type="button"
                                                disabled={deletingMenuId !== null}
                                                onClick={() => openDeleteModal(menu)}
                                                className="flex-1 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/meal-plan/${encodeURIComponent(menu.id)}`,
                                            )
                                        }
                                        className="mt-5 w-full rounded-xl border border-beige px-4 py-3 text-sm font-semibold transition hover:border-forest hover:text-forest"
                                    >
                                        Xem chi tiết →
                                    </button>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {isMenuFormOpen && (
                <MenuFormModal
                    menu={editingMenu}
                    onClose={() => {
                        setIsMenuFormOpen(false)
                        setEditingMenu(null)
                        setError('')
                    }}
                    onSuccess={handleMenuFormSuccess}
                />
            )}

            {isDeleteModalOpen && menuToDelete && (
                <ConfirmDeleteModal
                    title="Xóa thực đơn?"
                    description={
                        <>
                            Bạn có chắc muốn xóa thực đơn{' '}
                            <strong>
                                "{menuToDelete.name ||
                                    `Thực đơn #${menuToDelete.id}`}"
                            </strong>
                            ? Thao tác này không thể hoàn tác.
                        </>
                    }
                    confirmLabel="Xóa thực đơn"
                    loadingLabel="Đang xóa..."
                    isLoading={deletingMenuId === menuToDelete.id}
                    error={deleteError}
                    onConfirm={() => void handleDeleteMenu()}
                    onCancel={() => {
                        if (deletingMenuId !== null) return

                        setIsDeleteModalOpen(false)
                        setMenuToDelete(null)
                        setDeleteError(null)
                    }}
                />
            )}
        </main>
    )
}
