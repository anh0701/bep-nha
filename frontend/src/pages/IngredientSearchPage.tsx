
import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ChefHat,
  CircleCheck,
  CookingPot,
  LoaderCircle,
  Search,
} from 'lucide-react'

import type { Dish, DishByIngredients } from '../types/dish'
import type { Ingredient } from '../types/ingredient'

import { getDishesByIngredients } from '../services/dish.service'
import { getIngredientsPaginated } from '../services/ingredient.service'
import DishDetailModal from '../components/DishDetailModal'

import IngredientPicker from '../components/ingredient-search/IngredientPicker'
import SelectedIngredients from '../components/ingredient-search/SelectedIngredients'
import DishSearchResults, {
  type ResultFilter,
} from '../components/ingredient-search/DishSearchResults'

export default function IngredientSearchPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedIngredientsMap, setSelectedIngredientsMap] = useState<
    Map<string, Ingredient>
  >(() => new Map())

  const [search, setSearch] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  const [loadingIngredients, setLoadingIngredients] = useState(true)
  const [ingredientError, setIngredientError] = useState<string | null>(null)

  const [results, setResults] = useState<DishByIngredients[] | null>(null)
  const [total, setTotal] = useState(0)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all')
  const [detailDish, setDetailDish] = useState<Dish | null>(null)

  // Tìm nguyên liệu qua API, debounce 300 ms.
  useEffect(() => {
    let cancelled = false

    const timer = window.setTimeout(async () => {
      try {
        setLoadingIngredients(true)
        setIngredientError(null)

        const response = await getIngredientsPaginated({
          page: 1,
          limit: 20,
          search: search.trim(),
        })

        if (cancelled) return

        setIngredients(
          response.data.filter((ingredient) => ingredient.is_active),
        )
      } catch (error) {
        if (cancelled) return

        setIngredientError(
          error instanceof Error
            ? error.message
            : 'Không thể tải danh sách nguyên liệu',
        )
      } finally {
        if (!cancelled) {
          setLoadingIngredients(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [search])

  // Luôn hiển thị nguyên liệu đã chọn, kể cả khi chúng không nằm
  // trong trang kết quả tìm kiếm hiện tại.
  const selectedIngredients = useMemo(() => {
    return selectedIds
      .map((id) => selectedIngredientsMap.get(id))
      .filter((ingredient): ingredient is Ingredient => Boolean(ingredient))
  }, [selectedIds, selectedIngredientsMap])

  const readyCount = useMemo(
    () => results?.filter((dish) => dish.can_cook_now).length ?? 0,
    [results],
  )

  const visibleResults = useMemo(() => {
    if (!results) return []

    if (resultFilter === 'ready') {
      return results.filter((dish) => dish.can_cook_now)
    }

    if (resultFilter === 'missing') {
      return results.filter((dish) => !dish.can_cook_now)
    }

    return results
  }, [results, resultFilter])

  function invalidateResults() {
    setResults(null)
    setTotal(0)
    setSearchError(null)
    setResultFilter('all')
  }

  function toggleIngredient(ingredient: Ingredient) {
    const { id } = ingredient
    const isSelected = selectedIds.includes(id)

    if (isSelected) {
      setSelectedIds((current) =>
        current.filter((item) => item !== id),
      )

      setSelectedIngredientsMap((current) => {
        const next = new Map(current)
        next.delete(id)
        return next
      })
    } else {
      setSelectedIds((current) => [...current, id])

      setSelectedIngredientsMap((current) => {
        const next = new Map(current)
        next.set(id, ingredient)
        return next
      })
    }

    invalidateResults()
  }

  function removeIngredient(id: string) {
    setSelectedIds((current) =>
      current.filter((item) => item !== id),
    )

    setSelectedIngredientsMap((current) => {
      const next = new Map(current)
      next.delete(id)
      return next
    })

    invalidateResults()
  }

  function clearIngredients() {
    setSelectedIds([])
    setSelectedIngredientsMap(new Map())
    invalidateResults()
  }

  async function handleSearch() {
    if (selectedIds.length === 0) {
      setSearchError(
        'Chọn ít nhất một nguyên liệu để bắt đầu tìm món nhé.',
      )
      setResults(null)
      return
    }

    try {
      setSearching(true)
      setSearchError(null)
      setPickerOpen(false)

      const response = await getDishesByIngredients(selectedIds)

      setResults(response.data)
      setTotal(response.total)
      setResultFilter('all')
    } catch (error) {
      console.error('Failed to search dishes by ingredients:', error)

      setResults(null)
      setSearchError(
        error instanceof Error
          ? error.message
          : 'Không thể tìm món phù hợp. Vui lòng thử lại.',
      )
    } finally {
      setSearching(false)
    }
  }

  function openDishDetail(dish: DishByIngredients) {
    setDetailDish({
      id: dish.id,
      name: dish.name,
      category_id: dish.category_id,
      category: dish.category,
      meal_role: dish.meal_role,
      is_active: true,
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-5 py-7 md:px-10 md:py-10">
      <header>
        <div className="inline-flex items-center gap-2 rounded-full bg-sage/50 px-3 py-1.5 text-sm font-medium text-forest">
          Gợi ý từ căn bếp của bạn
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Có gì, nấu món gì?
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          Chọn nguyên liệu bạn đang có. Bếp Nhà sẽ tìm những món phù hợp,
          ưu tiên món có thể nấu ngay và gợi ý những gì bạn còn thiếu.
        </p>
      </header>

      {ingredientError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {ingredientError}
        </div>
      )}

      <section className="overflow-visible rounded-3xl bg-white p-5 shadow-sm ring-1 ring-beige/80 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sage/60 text-forest">
            <CookingPot size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-ink">
              Nguyên liệu bạn đang có
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted">
              Tìm và chọn nhiều nguyên liệu để có gợi ý sát với thực tế hơn.
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-forest">
            {selectedIds.length} đã chọn
          </span>
        </div>

        <IngredientPicker
          ingredients={ingredients}
          selectedIds={selectedIds}
          search={search}
          pickerOpen={pickerOpen}
          loading={loadingIngredients}
          onSearchChange={setSearch}
          onPickerOpenChange={setPickerOpen}
          onToggle={toggleIngredient}
          onClear={clearIngredients}
        />

        <div className="mt-5">
          <SelectedIngredients
            ingredients={selectedIngredients}
            onRemove={removeIngredient}
            onClear={clearIngredients}
            onOpenPicker={() => setPickerOpen(true)}
          />
        </div>

        {searchError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            {searchError}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-beige/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted">
            Mẹo nhỏ: chọn càng sát nguyên liệu đang có, gợi ý càng hữu ích.
          </p>

          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={
              loadingIngredients ||
              searching ||
              Boolean(ingredientError) ||
              selectedIds.length === 0
            }
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {searching ? (
              <LoaderCircle size={19} className="animate-spin" />
            ) : (
              <Search size={19} />
            )}

            {searching ? 'Đang tìm món...' : 'Tìm món phù hợp'}
          </button>
        </div>
      </section>

      {results === null && !searching && !searchError && (
        <section className="relative overflow-hidden rounded-3xl bg-sage/30 p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-5 -top-8 opacity-[0.08]">
            <CookingPot size={170} strokeWidth={1} />
          </div>

          <div className="relative max-w-xl">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white text-forest">
              <ChefHat size={22} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-ink">
              Bữa ăn tiếp theo bắt đầu từ đây
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              Chọn nguyên liệu trong bếp, rồi để Bếp Nhà giúp bạn tìm món
              phù hợp. Bạn không nhất thiết phải có đủ mọi nguyên liệu ngay
              từ đầu.
            </p>
          </div>
        </section>
      )}

      {searching && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl bg-white p-5 ring-1 ring-beige/80"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage/60 text-forest">
            <LoaderCircle size={21} className="animate-spin" />
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">
              Đang tìm món phù hợp...
            </p>
            <p className="mt-1 text-xs text-muted">
              Bếp Nhà đang đối chiếu nguyên liệu bạn đã chọn.
            </p>
          </div>
        </div>
      )}

      {results !== null && (
        <DishSearchResults
          results={results}
          visibleResults={visibleResults}
          total={total}
          selectedCount={selectedIds.length}
          readyCount={readyCount}
          resultFilter={resultFilter}
          onFilterChange={setResultFilter}
          onViewDetail={openDishDetail}
          onChangeIngredients={() => setPickerOpen(true)}
        />
      )}

      {detailDish && (
        <DishDetailModal
          dish={detailDish}
          onClose={() => setDetailDish(null)}
        />
      )}
    </div>
  )
}
