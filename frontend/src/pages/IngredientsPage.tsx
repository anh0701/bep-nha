import { useEffect, useMemo, useState } from 'react'
import {
  Check,
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
  getIngredients,
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

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [categories, setCategories] = useState<IngredientCategory[]>([])
  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingIngredient, setEditingIngredient] =
    useState<Ingredient | null>(null)

  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  async function loadIngredients() {
    try {
      setLoading(true)
      setError(null)

      const result = await getIngredients()
      setIngredients(result.data)
    } catch (err) {
      console.error('Failed to load ingredients:', err)
      setError('Không thể tải kho nguyên liệu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
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

  useEffect(() => {
    void loadIngredients()
    void loadIngredientCategories()
  }, [])

  const filteredIngredients = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')

    return ingredients.filter((ingredient) => {
      const name = ingredient.name.toLocaleLowerCase('vi')
      const category = ingredient.ingredient_category_name
        .toLocaleLowerCase('vi')

      return name.includes(keyword) || category.includes(keyword)
    })
  }, [ingredients, search])

  const activeCount = ingredients.filter(
    (ingredient) => ingredient.is_active,
  ).length

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

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-5 py-7 md:px-10 md:py-10">
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

      <section className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-sage/60 p-4 sm:p-5">
          <p className="text-sm text-muted">Tổng nguyên liệu</p>
          <p className="mt-2 text-2xl font-bold text-forest">
            {loading ? '—' : ingredients.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-beige/80 sm:p-5">
          <p className="text-sm text-muted">Đang hoạt động</p>
          <p className="mt-2 text-2xl font-bold text-forest">
            {loading ? '—' : activeCount}
          </p>
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
            placeholder="Tìm tên hoặc danh mục nguyên liệu..."
            aria-label="Tìm nguyên liệu"
            className="w-full rounded-2xl border border-beige bg-white py-3.5 pr-4 pl-11 text-sm text-ink outline-none transition placeholder:text-muted/80 focus:border-forest"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">
            Danh sách nguyên liệu
          </h2>

          <p className="text-sm text-muted">
            {loading
              ? 'Đang tải...'
              : `${filteredIngredients.length} / ${ingredients.length} nguyên liệu`}
          </p>
        </div>

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
              onClick={() => void loadIngredients()}
              className="mt-4 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest/90"
            >
              Thử lại
            </button>
          </div>
        ) : filteredIngredients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-beige px-5 py-14 text-center">
            <Search size={28} className="mx-auto text-muted/70" />

            <h3 className="mt-4 font-semibold text-ink">
              {search
                ? 'Không tìm thấy nguyên liệu'
                : 'Kho nguyên liệu đang trống'}
            </h3>

            <p className="mt-2 text-sm text-muted">
              {search
                ? 'Thử từ khóa khác nhé.'
                : 'Thêm nguyên liệu đầu tiên để sử dụng cho các món ăn.'}
            </p>

            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-4 text-sm font-semibold text-forest hover:underline"
              >
                Xóa tìm kiếm
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

            {filteredIngredients.map((ingredient) => (
              <article
                key={ingredient.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-beige/60 px-4 py-4 last:border-b-0 hover:bg-cream/50 sm:grid-cols-[minmax(0,1fr)_minmax(100px,0.5fr)_minmax(70px,0.35fr)_auto] sm:px-5"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-ink">
                    {ingredient.name}
                  </h3>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted sm:hidden">
                    <span>{ingredient.ingredient_category_name}</span>
                    <span>·</span>
                    <span>{ingredient.default_unit}</span>
                  </div>

                  <span
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:hidden ${
                      ingredient.is_active
                        ? 'bg-sage/60 text-forest'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        ingredient.is_active
                          ? 'bg-forest'
                          : 'bg-gray-400'
                      }`}
                    />
                    {ingredient.is_active ? 'Đang dùng' : 'Ngừng dùng'}
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
                    className="rounded-lg p-2 text-muted transition hover:bg-sage/70 hover:text-forest disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingId === ingredient.id ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : ingredient.is_active ? (
                      <ToggleRight size={19} />
                    ) : (
                      <ToggleLeft size={19} />
                    )}
                  </button>
                </div>
              </article>
            ))}
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
