
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  Utensils,
  X,
} from 'lucide-react'

import {
  getDishesPaginated,
  deleteDish,
} from '../services/dish.service'
import { getCategories } from '../services/category.service'

import type { Dish } from '../types/dish'
import type { Category } from '../types/category'

import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import DishFormModal from '../components/DishFormModal'
import DishDetailModal from '../components/DishDetailModal'
import PageFilters from '../components/PageFilters'

export default function DishesPage() {

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const state = location.state as
      | { openCreateForm?: boolean }
      | null

    if (state?.openCreateForm) {
      setEditingDish(null)
      setShowCreateForm(true)

      // Xóa state để không tự mở lại form khi quay lại trang.
      navigate(location.pathname, {
        replace: true,
        state: null,
      })
    }
  }, [location, navigate])

  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)

  const [deletingDishId, setDeletingDishId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [dishToDelete, setDishToDelete] = useState<Dish | null>(null)
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)

  // Lấy danh mục
  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      try {
        const result = await getCategories()

        if (!cancelled) {
          setCategories(result.data)
        }
      } catch (err) {
        console.error('Failed to load categories:', err)

        if (!cancelled) {
          setError('Không thể tải danh mục món ăn. Vui lòng thử lại.')
        }
      }
    }

    loadCategories()

    return () => {
      cancelled = true
    }
  }, [])

  // Lấy danh sách món ăn theo trang, từ khóa và danh mục
  useEffect(() => {
    let cancelled = false

    async function loadDishes() {
      try {
        setLoading(true)
        setError(null)

        const result = await getDishesPaginated({
          page,
          limit,
          search: search.trim(),
          categoryId:
            selectedCategory === 'all' ? '' : selectedCategory,
        })

        if (cancelled) return

        // Nếu trang hiện tại không còn hợp lệ, quay về trang cuối.
        if (
          result.pagination.totalPages > 0 &&
          page > result.pagination.totalPages
        ) {
          setPage(result.pagination.totalPages)
          return
        }

        setDishes(result.data)
        setTotalItems(result.pagination.totalItems)
        setTotalPages(result.pagination.totalPages)
      } catch (err) {
        console.error('Failed to load dish catalog:', err)

        if (!cancelled) {
          setError('Không thể tải kho món ăn. Vui lòng thử lại.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDishes()

    return () => {
      cancelled = true
    }
  }, [page, limit, search, selectedCategory, refreshKey])

  function openCreateForm() {
    setEditingDish(null)
    setShowCreateForm(true)
  }

  function openEditForm(dish: Dish) {
    setEditingDish(dish)
    setShowCreateForm(true)
  }

  function closeCreateForm() {
    setShowCreateForm(false)
    setEditingDish(null)
  }

  function handleDishSaved(_savedDish: Dish) {
    closeCreateForm()
    setSearch('')
    setSelectedCategory('all')
    setPage(1)
    setRefreshKey((current) => current + 1)
  }

  async function handleDeleteDish(dish: Dish) {
    setDeletingDishId(dish.id)
    setDeleteError(null)

    try {
      await deleteDish(dish.id)

      setDishToDelete(null)

      // Nếu xóa phần tử cuối cùng trên trang, chuyển về trang trước.
      if (dishes.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        setRefreshKey((current) => current + 1)
      }

      if (selectedDish?.id === dish.id) {
        setSelectedDish(null)
      }
    } catch (err) {
      console.error('Failed to delete dish:', err)
      setDeleteError('Không thể xóa món ăn. Vui lòng thử lại.')
    } finally {
      setDeletingDishId(null)
    }
  }

  function clearFilters() {
    setSearch('')
    setSelectedCategory('all')
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleCategoryChange(value: string) {
    setSelectedCategory(value)
    setPage(1)
  }

  function handleLimitChange(value: string) {
    setLimit(Number(value))
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-5 py-7 md:px-10 md:py-10">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Utensils size={17} />
            Không gian bếp
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            Kho món ăn
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted">
            Lưu giữ những món ngon để việc chọn bữa cơm mỗi ngày dễ dàng hơn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openCreateForm}
            disabled={loading || categories.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Thêm món ăn
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <PageFilters
          search={{
            value: search,
            onChange: handleSearchChange,
            placeholder: 'Tìm món ăn theo tên...',
            ariaLabel: 'Tìm món ăn theo tên',
          }}
          selects={[
            {
              key: 'dish-category',
              label: 'Lọc theo danh mục món ăn',
              value: selectedCategory,
              onChange: handleCategoryChange,
              options: [
                { label: 'Tất cả danh mục', value: 'all' },
                ...categories.map((category) => ({
                  label: category.name,
                  value: String(category.id),
                })),
              ],
            },
          ]}
        />

        {/* Tiêu đề danh sách và số lượng */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-sm font-semibold text-ink">
            Danh sách món ăn
          </h2>

          <p className="text-sm text-muted">
            {loading ? 'Đang tải...' : `${dishes.length} / ${totalItems} món ăn`}
          </p>
        </div>
      </section>

      <section>
        {deleteError && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <p>{deleteError}</p>

            <button
              type="button"
              onClick={() => setDeleteError(null)}
              aria-label="Đóng thông báo lỗi"
              className="shrink-0 rounded-lg p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-sm text-muted">
            Đang tải kho món ăn...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-white p-6 text-center"
          >
            <p className="text-sm text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              className="mt-4 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest/90"
            >
              Thử tải lại
            </button>
          </div>
        ) : dishes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-beige px-5 py-16 text-center">
            <Utensils size={30} className="mx-auto text-muted/70" />

            <h2 className="mt-4 font-semibold text-ink">
              Không tìm thấy món ăn
            </h2>

            <p className="mt-2 text-sm text-muted">
              Thử đổi từ khóa hoặc chọn danh mục khác nhé.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-semibold text-forest hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-beige/80 bg-white">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-beige/80 bg-white/70 px-4 py-3 text-xs font-semibold tracking-wide text-muted sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.6fr)_auto] sm:px-5">
                <span>TÊN MÓN ĂN</span>
                <span className="hidden sm:block">DANH MỤC</span>
                <span>TRẠNG THÁI</span>
              </div>

              {dishes.map((dish) => (
                <article
                  key={dish.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-beige/60 px-4 py-4 last:border-b-0 hover:bg-cream/60 sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.6fr)_auto] sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage/70 text-forest">
                      <Utensils size={19} />
                    </div>

                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedDish(dish)}
                        className="block max-w-full truncate text-left text-sm font-semibold text-ink transition hover:text-forest hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                        title={`Xem chi tiết ${dish.name}`}
                      >
                        {dish.name}
                      </button>

                      <p className="mt-1 text-xs text-muted sm:hidden">
                        {dish.category}
                      </p>
                    </div>
                  </div>

                  <span className="hidden text-sm text-muted sm:block">
                    {dish.category}
                  </span>

                  <div className="flex items-center gap-1">
                    <span className="hidden items-center gap-1.5 rounded-full bg-sage/60 px-2.5 py-1 text-xs font-medium text-forest sm:inline-flex">
                      <span className="size-1.5 rounded-full bg-forest" />
                      Đang dùng
                    </span>

                    <button
                      type="button"
                      onClick={() => openEditForm(dish)}
                      aria-label={`Sửa món ${dish.name}`}
                      title="Sửa món ăn"
                      className="rounded-lg p-2 text-muted transition hover:bg-sage/70 hover:text-forest"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null)
                        setDishToDelete(dish)
                      }}
                      disabled={deletingDishId === dish.id}
                      aria-label={`Xóa món ${dish.name}`}
                      title="Xóa món ăn"
                      className="rounded-lg p-2 text-muted transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Điều khiển phân trang */}
            {totalItems > 0 && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span>Hiển thị</span>

                  <select
                    value={limit}
                    onChange={(event) => handleLimitChange(event.target.value)}
                    className="rounded-lg border border-beige bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-forest"
                    aria-label="Số món ăn mỗi trang"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>

                  <span>mỗi trang</span>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-sm text-muted">
                    Trang {page} / {Math.max(totalPages, 1)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                      disabled={page <= 1 || loading}
                      className="inline-flex items-center gap-1 rounded-lg border border-beige bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                      Trước
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPage((current) =>
                          Math.min(Math.max(totalPages, 1), current + 1),
                        )
                      }
                      disabled={page >= totalPages || loading}
                      className="inline-flex items-center gap-1 rounded-lg border border-beige bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Sau
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {showCreateForm && (
        <DishFormModal
          categories={categories}
          dish={editingDish}
          onClose={closeCreateForm}
          onSuccess={handleDishSaved}
        />
      )}

      {dishToDelete && (
        <ConfirmDeleteModal
          title="Xóa món ăn này?"
          description={
            <>
              Bạn có chắc muốn xóa{' '}
              <span className="font-semibold text-ink">
                {dishToDelete.name}
              </span>{' '}
              khỏi danh sách món ăn? Bạn sẽ không còn thấy món này trong danh
              mục đang hoạt động.
            </>
          }
          confirmLabel="Xóa món ăn"
          isLoading={deletingDishId !== null}
          error={deleteError}
          onCancel={() => setDishToDelete(null)}
          onConfirm={() => void handleDeleteDish(dishToDelete)}
        />
      )}

      {selectedDish && (
        <DishDetailModal
          dish={selectedDish}
          onClose={() => setSelectedDish(null)}
        />
      )}
    </div>
  )
}
