
import { useEffect, useMemo, useState } from 'react'

import {
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Utensils,
  X,
} from 'lucide-react'

import { getDishes, deleteDish } from '../services/dish.service'
import { getCategories } from '../services/category.service'

import type { Dish } from '../types/dish'
import type { Category } from '../types/category'

import CategorySelect from '../components/CategorySelect'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import DishFormModal from '../components/DishFormModal'
import DishDetailModal from '../components/DishDetailModal'

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)

  const [deletingDishId, setDeletingDishId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [dishToDelete, setDishToDelete] = useState<Dish | null>(null)
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const [dishResult, categoryResult] = await Promise.all([
          getDishes(),
          getCategories(),
        ])

        setDishes(dishResult.data)
        setCategories(categoryResult.data)
      } catch (err) {
        console.error('Failed to load dish catalog:', err)
        setError('Không thể tải kho món ăn. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredDishes = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')

    return dishes.filter((dish) => {
      const matchesName = dish.name
        .toLocaleLowerCase('vi')
        .includes(keyword)

      const matchesCategory =
        selectedCategory === 'all' ||
        dish.category_id === selectedCategory

      return matchesName && matchesCategory
    })
  }, [dishes, search, selectedCategory])

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

  function handleDishSaved(savedDish: Dish) {
    setDishes((currentDishes) => [
      savedDish,
      ...currentDishes.filter((dish) => dish.id !== savedDish.id),
    ])

    setSelectedCategory('all')
    setSearch('')
  }

  async function handleDeleteDish(dish: Dish) {
    setDeletingDishId(dish.id)
    setDeleteError(null)

    try {
      await deleteDish(dish.id)

      setDishes((currentDishes) =>
        currentDishes.filter((item) => item.id !== dish.id),
      )

      setDishToDelete(null)
    } catch (err) {
      console.error('Failed to delete dish:', err)
      setDeleteError('Không thể xóa món ăn. Vui lòng thử lại.')
    } finally {
      setDeletingDishId(null)
    }
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
          <div className="rounded-2xl bg-sage/60 px-4 py-3">
            <p className="text-xs text-muted">Tổng số món đang hoạt động</p>
            <p className="text-xl font-bold text-forest">
              {loading ? '—' : dishes.length}
            </p>
          </div>

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
        <div className="relative">
          <Search
            size={19}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm món ăn theo tên..."
            aria-label="Tìm món ăn theo tên"
            className="w-full rounded-2xl border border-beige bg-white py-3.5 pr-4 pl-11 text-sm text-ink outline-none transition placeholder:text-muted/80 focus:border-forest"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-muted">
            <SlidersHorizontal size={17} />
            Lọc danh mục
          </div>

          <div className="w-full sm:w-75">
            <CategorySelect
              categories={categories}
              value={selectedCategory}
              onChange={setSelectedCategory}
              includeAll
              allLabel="Tất cả danh mục"
              ariaLabel="Lọc theo danh mục"
            />
          </div>

          <p className="text-sm text-muted sm:ml-auto">
            {loading
              ? 'Đang tải món ăn...'
              : `${filteredDishes.length} / ${dishes.length} món`}
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
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest/90"
            >
              Tải lại trang
            </button>
          </div>
        ) : filteredDishes.length === 0 ? (
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
              onClick={() => {
                setSearch('')
                setSelectedCategory('all')
              }}
              className="mt-4 text-sm font-semibold text-forest hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-beige/80 bg-white">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-beige/80 bg-white/70 px-4 py-3 text-xs font-semibold tracking-wide text-muted sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.6fr)_auto] sm:px-5">
              <span>TÊN MÓN ĂN</span>
              <span className="hidden sm:block">DANH MỤC</span>
              <span>TRẠNG THÁI</span>
            </div>

            {filteredDishes.map((dish) => (
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
