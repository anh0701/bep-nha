import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, LoaderCircle, Pencil, Plus, Search, SlidersHorizontal, Trash2, Utensils, X } from 'lucide-react'

import { getDishes, createDish, updateDish, deleteDish } from '../services/dish.service'
import { getCategories } from '../services/category.service'
import type { Dish, DishFormData } from '../types/dish'
import type { Category } from '../types/category'
import CategorySelect from '../components/CategorySelect'

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<DishFormData>({
    name: '',
    category_id: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [deletingDishId, setDeletingDishId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [dishToDelete, setDishToDelete] = useState<Dish | null>(null)

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
    setFormData({
      name: '',
      category_id: categories[0]?.id ?? '',
    })
    setFormError(null)
    setShowCreateForm(true)
  }

  function openEditForm(dish: Dish) {
    setEditingDish(dish)
    setFormData({
      name: dish.name,
      category_id: dish.category_id,
    })
    setFormError(null)
    setShowCreateForm(true)
  }

  function closeCreateForm() {
    if (isSubmitting) return

    setShowCreateForm(false)
    setEditingDish(null)
    setFormError(null)
  }

  async function handleCreateDish(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError(null)

    const name = formData.name.trim()

    if (!name) {
      setFormError('Vui lòng nhập tên món ăn.')
      return
    }

    if (name.length > 200) {
      setFormError('Tên món ăn không được vượt quá 200 ký tự.')
      return
    }

    if (!formData.category_id) {
      setFormError('Vui lòng chọn danh mục.')
      return
    }

    try {
      setIsSubmitting(true)

      const payload: DishFormData = {
        name,
        category_id: formData.category_id,
      }

      if (editingDish) {
        const updatedDish = await updateDish(editingDish.id, payload)

        setDishes((currentDishes) => [
          updatedDish,
          ...currentDishes.filter((dish) => dish.id !== updatedDish.id),
        ])
      } else {
        const newDish = await createDish(payload)

        setDishes((currentDishes) => [
          newDish,
          ...currentDishes.filter((dish) => dish.id !== newDish.id),
        ])
      }

      setSelectedCategory('all')
      setSearch('')
      setShowCreateForm(false)
      setEditingDish(null)
      setFormData({ name: '', category_id: '' })
    } catch (err) {
      console.error('Failed to create dish:', err)

      const message =
        err instanceof Error ? err.message : ''

      if (message.includes('already exists')) {
        setFormError('Tên món ăn này đã tồn tại trong hệ thống.')
      } else if (message.includes('Category does not exist')) {
        setFormError('Danh mục không tồn tại. Vui lòng chọn lại.')
      } else {
        setFormError('Không thể thêm món ăn. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
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
                    <h2 className="truncate text-sm font-semibold text-ink">
                      {dish.name}
                    </h2>

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateForm()
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-dish-title"
            className="w-full max-w-md rounded-2xl bg-cream p-6 shadow-xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="create-dish-title"
                  className="text-xl font-bold text-ink"
                >
                  {editingDish ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Bổ sung một món ăn vào kho bếp của bạn.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateForm}
                disabled={isSubmitting}
                aria-label="Đóng form"
                className="rounded-lg p-2 text-muted transition hover:bg-beige disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDish} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="dish-name"
                  className="block text-sm font-medium text-ink"
                >
                  Tên món ăn
                </label>

                <input
                  id="dish-name"
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Canh bí đỏ"
                  maxLength={200}
                  required
                  autoFocus
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-beige bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-forest disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="dish-category"
                  className="block text-sm font-medium text-ink"
                >
                  Danh mục
                </label>


                <CategorySelect
                  id="dish-category"
                  categories={categories}
                  value={formData.category_id}
                  onChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      category_id: value,
                    }))
                  }
                  placeholder="Chọn danh mục"
                  ariaLabel="Danh mục món ăn"
                  required
                  disabled={isSubmitting}
                />

              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateForm}
                  disabled={isSubmitting}
                  className="rounded-xl border border-beige px-4 py-3 text-sm font-semibold text-ink transition hover:bg-beige disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={17} />
                  {isSubmitting
                    ? 'Đang lưu...'
                    : editingDish
                      ? 'Lưu thay đổi'
                      : 'Lưu món ăn'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}


      {dishToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          onClick={() => {
            if (deletingDishId === null) {
              setDishToDelete(null)
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
            className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl border border-beige bg-cream p-6 shadow-2xl duration-200 sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <AlertTriangle size={24} strokeWidth={2} />
            </div>

            <h2
              id="delete-modal-title"
              className="mt-5 text-xl font-bold text-ink"
            >
              Xóa món ăn này?
            </h2>

            <p
              id="delete-modal-description"
              className="mt-2 text-sm leading-6 text-muted"
            >
              Bạn có chắc muốn xóa{' '}
              <span className="font-semibold text-ink">
                {dishToDelete.name}
              </span>
              {' '}khỏi danh sách món ăn? Bạn sẽ không còn thấy món này trong danh
              mục đang hoạt động.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deletingDishId !== null}
                onClick={() => setDishToDelete(null)}
                className="rounded-xl border border-beige px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-sage/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={deletingDishId !== null}
                onClick={() => void handleDeleteDish(dishToDelete)}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingDishId === dishToDelete.id ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Xóa món ăn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
