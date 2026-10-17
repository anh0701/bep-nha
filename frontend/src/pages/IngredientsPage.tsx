
import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react'

import {
  createIngredient,
  getIngredientsPaginated,
  updateIngredient,
  updateIngredientStatus,
} from '../services/ingredient.service'

import { getIngredientCategories } from '../services/ingredient-category.service'

import IngredientFormModal from '../components/IngredientFormModal'

import type {
  Ingredient,
  IngredientFormData,
} from '../types/ingredient'

import type { IngredientCategory } from '../types/ingredient-category'
import PageFilters from '../components/PageFilters'

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [categories, setCategories] = useState<IngredientCategory[]>([])

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryId, setCategoryId] = useState('all')

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const [stats, setStats] = useState({
    totalIngredients: 0,
    activeIngredients: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingIngredient, setEditingIngredient] =
    useState<Ingredient | null>(null)

  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const hasLoadedRef = useRef(false)
  const requestIdRef = useRef(0)

  async function loadIngredients() {
    const requestId = ++requestIdRef.current

    try {
      if (!hasLoadedRef.current) {
        setLoading(true)
      }

      setError(null)

      const result = await getIngredientsPaginated({
        page,
        limit,
        search: debouncedSearch,
        categoryId,
      })

      // Bỏ qua kết quả của request cũ.
      if (requestId !== requestIdRef.current) return

      // Nếu trang hiện tại không còn hợp lệ, chuyển về trang cuối.
      if (
        result.pagination.totalPages > 0 &&
        page > result.pagination.totalPages
      ) {
        setPage(result.pagination.totalPages)
        return
      }

      setIngredients(result.data)
      setTotalItems(result.pagination.totalItems)
      setTotalPages(result.pagination.totalPages)
      setStats(result.stats)
    } catch (err) {
      if (requestId !== requestIdRef.current) return

      console.error('Failed to load ingredients:', err)
      setError('Không thể tải kho nguyên liệu. Vui lòng thử lại.')
    } finally {
      if (requestId === requestIdRef.current) {
        hasLoadedRef.current = true
        setLoading(false)
      }
    }
  }

  async function loadIngredientCategories() {
    try {
      setCategoriesLoading(true)
      setCategoriesError(null)

      const result = await getIngredientCategories()
      setCategories(result.data)
    } catch (err) {
      console.error('Failed to load ingredient categories:', err)
      setCategoriesError(
        'Không thể tải danh mục nguyên liệu. Vui lòng thử lại.',
      )
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Tải danh mục một lần.
  useEffect(() => {
    void loadIngredientCategories()
  }, [])

  // Tải danh sách khi điều kiện lọc hoặc phân trang thay đổi.
  useEffect(() => {
    void loadIngredients()

    return () => {
      requestIdRef.current += 1
    }
  }, [page, limit, debouncedSearch, categoryId, refreshKey])

  // Chờ người dùng ngừng gõ 300 ms rồi mới tìm kiếm.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  function openCreateForm() {
    setEditingIngredient(null)
    setShowForm(true)
  }

  function openEditForm(ingredient: Ingredient) {
    setEditingIngredient(ingredient)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingIngredient(null)
  }

  async function handleSaveIngredient(formData: IngredientFormData) {
    const savedIngredient = editingIngredient
      ? await updateIngredient(editingIngredient.id, formData)
      : await createIngredient(formData)

    setIngredients((current) => {
      const exists = current.some(
        (item) => item.id === savedIngredient.id,
      )

      if (exists) {
        return current.map((item) =>
          item.id === savedIngredient.id
            ? savedIngredient
            : item,
        )
      }

      return [savedIngredient, ...current]
    })

    // Tải lại danh sách và thống kê.
    setRefreshKey((current) => current + 1)
  }

  async function handleToggleStatus(ingredient: Ingredient) {
    setUpdatingId(ingredient.id)
    setStatusError(null)

    try {
      const updatedIngredient = await updateIngredientStatus(
        ingredient.id,
        !ingredient.is_active,
      )

      setIngredients((current) =>
        current.map((item) =>
          item.id === updatedIngredient.id
            ? updatedIngredient
            : item,
        ),
      )

      // Cập nhật thống kê từ database.
      setRefreshKey((current) => current + 1)
    } catch (err) {
      console.error('Failed to update ingredient status:', err)
      setStatusError(
        err instanceof Error
          ? err.message
          : 'Không thể cập nhật trạng thái nguyên liệu.',
      )
    } finally {
      setUpdatingId(null)
    }
  }

  function clearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setCategoryId('all')
    setPage(1)
  }

  const hasActiveFilters =
    Boolean(search.trim()) || categoryId !== 'all'

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-5 py-7 md:px-10 md:py-10">
      {/* Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Check size={17} />
            Không gian bếp
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            Kho nguyên liệu
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted">
            Quản lý nguyên liệu dùng trong các món ăn của gia đình.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white transition hover:bg-forest/90"
        >
          <Plus size={18} />
          Thêm nguyên liệu
        </button>
      </section>

      {/* Thống kê toàn kho */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-sage/60 p-4 sm:p-5">
          <p className="text-sm text-muted">Tổng nguyên liệu</p>
          <p className="mt-2 text-2xl font-bold text-forest">
            {loading ? '—' : stats.totalIngredients}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-beige/80 sm:p-5">
          <p className="text-sm text-muted">Đang hoạt động</p>
          <p className="mt-2 text-2xl font-bold text-forest">
            {loading ? '—' : stats.activeIngredients}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        {/* Tìm kiếm và lọc danh mục */}
        <PageFilters
          search={{
            value: search,
            onChange: setSearch,
            placeholder: 'Tìm tên nguyên liệu...',
            ariaLabel: 'Tìm nguyên liệu',
          }}
          selects={[
            {
              key: 'ingredient-category',
              label: 'Lọc theo danh mục nguyên liệu',
              value: categoryId,
              onChange: (value) => {
                setCategoryId(value)
                setPage(1)
              },
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

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-sm font-semibold text-ink">
            Danh sách nguyên liệu
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted">
              {loading
                ? 'Đang tải...'
                : `${ingredients.length} / ${totalItems} nguyên liệu`}
            </p>

          </div>
        </div>

        {/* Lỗi cập nhật trạng thái */}
        {statusError && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <p>{statusError}</p>

            <button
              type="button"
              onClick={() => setStatusError(null)}
              aria-label="Đóng thông báo"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Trạng thái danh sách */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <LoaderCircle size={18} className="animate-spin" />
            Đang tải kho nguyên liệu...
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
              Thử lại
            </button>
          </div>
        ) : ingredients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-beige px-5 py-14 text-center">
            <Search size={28} className="mx-auto text-muted/70" />

            <h3 className="mt-4 font-semibold text-ink">
              {hasActiveFilters
                ? 'Không tìm thấy nguyên liệu'
                : 'Kho nguyên liệu đang trống'}
            </h3>

            <p className="mt-2 text-sm text-muted">
              {hasActiveFilters
                ? 'Thử từ khóa khác hoặc chọn danh mục khác nhé.'
                : 'Thêm nguyên liệu đầu tiên để sử dụng cho các món ăn.'}
            </p>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-semibold text-forest hover:underline"
              >
                Xóa bộ lọc
              </button>
            ) : (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest/90"
              >
                <Plus size={17} />
                Thêm nguyên liệu
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-beige/80 bg-white">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-beige/80 px-4 py-3 text-xs font-semibold tracking-wide text-muted sm:grid-cols-[minmax(0,1fr)_minmax(100px,0.5fr)_minmax(70px,0.35fr)_auto] sm:px-5">
              <span>NGUYÊN LIỆU</span>
              <span className="hidden sm:block">DANH MỤC</span>
              <span className="hidden sm:block">ĐƠN VỊ</span>
              <span>THAO TÁC</span>
            </div>

            {ingredients.map((ingredient) => (
              <article
                key={ingredient.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-beige/60 px-4 py-4 last:border-b-0 hover:bg-cream/50 sm:grid-cols-[minmax(0,1fr)_minmax(100px,0.5fr)_minmax(70px,0.35fr)_auto] sm:px-5"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-ink">
                    {ingredient.name}
                  </h3>

                  {ingredient.is_allergen && (
                    <span className="mt-1.5 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                      Gây dị ứng
                    </span>
                  )}

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted sm:hidden">
                    <span>{ingredient.ingredient_category_name}</span>
                    <span>·</span>
                    <span>{ingredient.default_unit}</span>
                  </div>

                  <span
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:hidden ${ingredient.is_active
                        ? 'bg-sage/60 text-forest'
                        : 'bg-gray-100 text-gray-500'
                      }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${ingredient.is_active
                          ? 'bg-forest'
                          : 'bg-gray-400'
                        }`}
                    />
                    {ingredient.is_active
                      ? 'Đang hoạt động'
                      : 'Ngừng sử dụng'}
                  </span>
                </div>

                <span className="hidden text-sm text-muted sm:block">
                  {ingredient.ingredient_category_name}
                </span>

                <span className="hidden text-sm text-muted sm:block">
                  {ingredient.default_unit}
                </span>

                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => openEditForm(ingredient)}
                    aria-label={`Sửa ${ingredient.name}`}
                    title="Sửa nguyên liệu"
                    className="rounded-lg p-2 text-muted transition hover:bg-sage/70 hover:text-forest"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleToggleStatus(ingredient)}
                    disabled={updatingId === ingredient.id}
                    aria-label={
                      ingredient.is_active
                        ? `Ngừng sử dụng ${ingredient.name}`
                        : `Kích hoạt ${ingredient.name}`
                    }
                    title={
                      ingredient.is_active
                        ? 'Ngừng sử dụng'
                        : 'Kích hoạt'
                    }
                    className={`inline-flex items-center justify-center rounded-xl p-2.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${ingredient.is_active
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-transparent text-muted hover:bg-sage/50 hover:text-forest'
                      }`}
                  >
                    {updatingId === ingredient.id ? (
                      <LoaderCircle size={23} className="animate-spin" />
                    ) : ingredient.is_active ? (
                      <ToggleRight size={25} strokeWidth={2.2} />
                    ) : (
                      <ToggleLeft size={25} strokeWidth={2} />
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Điều khiển phân trang */}
        {!loading && !error && totalItems > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span>Hiển thị</span>

              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value))
                  setPage(1)
                }}
                className="rounded-lg border border-beige bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-forest"
                aria-label="Số nguyên liệu mỗi trang"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>

              <span>mỗi trang</span>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-sm text-muted">
                Trang {page} / {totalPages}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-beige bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Trước
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-beige bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <IngredientFormModal
        isOpen={showForm}
        ingredient={editingIngredient}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        onRetryCategories={() => void loadIngredientCategories()}
        onClose={closeForm}
        onSubmit={handleSaveIngredient}
      />
    </div>
  )
}
