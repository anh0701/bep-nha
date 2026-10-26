import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  ChefHat,
  ChevronDown,
  CircleCheck,
  CookingPot,
  LoaderCircle,
  Search,
  X,
} from 'lucide-react'

import type { Dish, DishByIngredients } from '../types/dish'
import type { Ingredient } from '../types/ingredient'

import { getDishesByIngredients } from '../services/dish.service'
import { getIngredientsPaginated } from '../services/ingredient.service'
import DishDetailModal from '../components/DishDetailModal'

type ResultFilter = 'all' | 'ready' | 'missing'

export default function IngredientSearchPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Lưu thông tin các nguyên liệu đã chọn độc lập với kết quả tìm kiếm.
  const [selectedIngredientsMap, setSelectedIngredientsMap] =
    useState<Map<string, Ingredient>>(new Map())

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

  const pickerRef = useRef<HTMLDivElement | null>(null)

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
          search,
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

  // Đóng dropdown khi click bên ngoài.
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setPickerOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  // Luôn lấy nguyên liệu đã chọn từ Map, không phụ thuộc kết quả tìm kiếm hiện tại.
  const selectedIngredients = useMemo(
    () =>
      selectedIds
        .map((id) => selectedIngredientsMap.get(id))
        .filter((ingredient): ingredient is Ingredient => Boolean(ingredient)),
    [selectedIds, selectedIngredientsMap],
  )

  // Sắp xếp nguyên liệu đã chọn lên đầu danh sách kết quả hiện tại.
  const filteredIngredients = useMemo(() => {
    return [...ingredients].sort((a, b) => {
      const aSelected = selectedIds.includes(a.id)
      const bSelected = selectedIds.includes(b.id)

      if (aSelected !== bSelected) {
        return aSelected ? -1 : 1
      }

      return a.name.localeCompare(b.name, 'vi')
    })
  }, [ingredients, selectedIds])

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

  // Chọn hoặc bỏ chọn nguyên liệu.
  function toggleIngredient(id: string) {
    const ingredient = ingredients.find((item) => item.id === id)

    if (!ingredient) return

    const isSelected = selectedIds.includes(id)

    if (isSelected) {
      setSelectedIds((current) => current.filter((item) => item !== id))

      setSelectedIngredientsMap((current) => {
        const next = new Map(current)
        next.delete(id)
        return next
      })
    } else {
      setSelectedIds((current) =>
        current.includes(id) ? current : [...current, id],
      )

      setSelectedIngredientsMap((current) => {
        const next = new Map(current)
        next.set(id, ingredient)
        return next
      })
    }

    invalidateResults()
  }

  function removeIngredient(id: string) {
    setSelectedIds((current) => current.filter((item) => item !== id))

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
      setSearchError('Chọn ít nhất một nguyên liệu để bắt đầu tìm món nhé.')
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

        <div className="relative mt-6" ref={pickerRef}>
          <label
            htmlFor="ingredient-picker"
            className="mb-2 block text-sm font-medium text-ink"
          >
            Tìm nguyên liệu
          </label>

          <div
            className={`flex items-center gap-3 rounded-2xl border bg-white px-4 transition ${
              pickerOpen
                ? 'border-forest ring-2 ring-sage/60'
                : 'border-beige hover:border-sage'
            } focus-within:border-forest focus-within:ring-2 focus-within:ring-sage/60`}
          >
            <Search size={19} className="shrink-0 text-muted" />

            <input
              id="ingredient-picker"
              type="search"
              value={search}
              onFocus={() => setPickerOpen(true)}
              onChange={(event) => {
                setSearch(event.target.value)
                setPickerOpen(true)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setPickerOpen(false)
                }
              }}
              placeholder="Ví dụ: thịt bò, trứng gà, cà chua..."
              autoComplete="off"
              aria-expanded={pickerOpen}
              aria-controls="ingredient-picker-options"
              role="combobox"
              aria-autocomplete="list"
              className="min-w-0 flex-1 appearance-none border-0 bg-transparent py-4 text-sm text-ink outline-none ring-0 placeholder:text-muted !outline-none !ring-0 focus:!border-0 focus:!outline-none focus:!ring-0 focus-visible:!outline-none"
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setPickerOpen(true)
                }}
                aria-label="Xóa từ khóa tìm kiếm"
                className="rounded-full p-1 text-muted hover:bg-cream hover:text-ink"
              >
                <X size={16} />
              </button>
            )}

            <ChevronDown
              size={18}
              className={`shrink-0 text-muted transition-transform ${
                pickerOpen ? 'rotate-180' : ''
              }`}
            />
          </div>

          {pickerOpen && (
            <div
              id="ingredient-picker-options"
              className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-beige bg-white shadow-xl shadow-ink/10"
            >
              <div className="flex items-center justify-between border-b border-beige/70 bg-cream/60 px-4 py-3">
                <span className="text-xs font-semibold text-muted">
                  {loadingIngredients
                    ? 'Đang cập nhật nguyên liệu'
                    : `${filteredIngredients.length} nguyên liệu`}
                </span>

                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={clearIngredients}
                    className="text-xs font-medium text-forest hover:underline"
                  >
                    Xóa lựa chọn
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto p-2">
                {filteredIngredients.length === 0 && loadingIngredients ? (
                  <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted">
                    <LoaderCircle size={17} className="animate-spin" />
                    Đang tải danh sách...
                  </div>
                ) : filteredIngredients.length === 0 ? (
                  <div className="p-6 text-center">
                    <Search size={23} className="mx-auto text-muted" />
                    <p className="mt-2 text-sm font-medium text-ink">
                      Chưa tìm thấy nguyên liệu
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Thử tìm bằng một tên khác nhé.
                    </p>
                  </div>
                ) : (
                  <>
                    {loadingIngredients && (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted">
                        <LoaderCircle size={14} className="animate-spin" />
                        Đang cập nhật kết quả...
                      </div>
                    )}

                    {filteredIngredients.map((ingredient) => {
                      const checked = selectedIds.includes(ingredient.id)

                      return (
                        <button
                          key={ingredient.id}
                          type="button"
                          role="option"
                          aria-selected={checked}
                          onClick={() => toggleIngredient(ingredient.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                            checked ? 'bg-sage/50' : 'hover:bg-cream'
                          }`}
                        >
                          <span
                            className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                              checked
                                ? 'border-forest bg-forest text-white'
                                : 'border-beige bg-white'
                            }`}
                          >
                            {checked && <Check size={13} strokeWidth={3} />}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-ink">
                              {ingredient.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted">
                              {ingredient.ingredient_category_name}
                            </span>
                          </span>

                          {checked && (
                            <span className="text-xs font-medium text-forest">
                              Đã chọn
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </>
                )}
              </div>

              {!loadingIngredients && (
                <div className="border-t border-beige/70 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setPickerOpen(false)
                    }}
                    className="w-full rounded-xl bg-cream px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-sage/50"
                  >
                    Xong, tiếp tục
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-5">
          {selectedIngredients.length > 0 ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Đã chọn
                </p>

                <button
                  type="button"
                  onClick={clearIngredients}
                  className="text-xs font-medium text-muted transition hover:text-forest"
                >
                  Bỏ chọn tất cả
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {selectedIngredients.map((ingredient) => (
                  <span
                    key={ingredient.id}
                    className="inline-flex max-w-full items-center gap-2 rounded-full bg-sage/60 py-2 pl-3.5 pr-2 text-sm font-medium text-forest"
                  >
                    <span className="truncate">{ingredient.name}</span>

                    <button
                      type="button"
                      onClick={() => removeIngredient(ingredient.id)}
                      aria-label={`Bỏ chọn ${ingredient.name}`}
                      className="flex size-6 shrink-0 items-center justify-center rounded-full transition hover:bg-sage"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-beige bg-cream/60 p-4 text-left transition hover:border-sage hover:bg-cream"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-forest">
                <Search size={18} />
              </div>

              <div>
                <p className="text-sm font-medium text-ink">
                  Bắt đầu với nguyên liệu bạn có
                </p>
                <p className="mt-1 text-xs text-muted">
                  Chọn một hoặc nhiều nguyên liệu từ danh sách.
                </p>
              </div>
            </button>
          )}
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
              phù hợp. Bạn không nhất thiết phải có đủ mọi nguyên liệu ngay từ đầu.
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
        <section aria-live="polite" className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-forest">
                <CircleCheck size={16} />
                Kết quả dành cho bạn
              </div>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">
                Tìm thấy {total} món
              </h2>

              <p className="mt-1 text-sm text-muted">
                Dựa trên {selectedIds.length} nguyên liệu bạn đã chọn.
              </p>
            </div>

            {results.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['all', `Tất cả (${results.length})`],
                    ['ready', `Nấu ngay (${readyCount})`],
                    ['missing', `Cần bổ sung (${results.length - readyCount})`],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={resultFilter === value}
                    onClick={() => setResultFilter(value)}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                      resultFilter === value
                        ? 'bg-forest text-white'
                        : 'bg-white text-muted ring-1 ring-beige hover:bg-cream'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {results.length === 0 ? (
            <div className="rounded-3xl bg-white px-5 py-10 text-center ring-1 ring-beige/80 sm:px-8">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-cream text-muted">
                <Search size={25} />
              </div>

              <h3 className="mt-4 font-semibold text-ink">
                Chưa tìm thấy món phù hợp
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                Thử chọn thêm nguyên liệu hoặc thay đổi lựa chọn để khám phá
                những món khác trong kho.
              </p>

              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-forest/90"
              >
                <Search size={16} />
                Thay đổi nguyên liệu
              </button>
            </div>
          ) : visibleResults.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-beige/80">
              <p className="text-sm font-medium text-ink">
                Không có món nào trong nhóm này.
              </p>
              <p className="mt-1 text-sm text-muted">
                Chuyển sang bộ lọc khác để xem các món còn lại.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleResults.map((dish) => (
                <article
                  key={dish.id}
                  className={`flex flex-col rounded-3xl bg-white p-5 ring-1 transition hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${
                    dish.can_cook_now ? 'ring-sage' : 'ring-beige/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                        dish.can_cook_now
                          ? 'bg-sage/60 text-forest'
                          : 'bg-cream text-ink'
                      }`}
                    >
                      {dish.can_cook_now ? (
                        <ChefHat size={22} />
                      ) : (
                        <CookingPot size={22} />
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        dish.can_cook_now
                          ? 'bg-sage/60 text-forest'
                          : 'bg-cream text-muted'
                      }`}
                    >
                      {dish.can_cook_now && <CircleCheck size={14} />}
                      {dish.can_cook_now
                        ? 'Có thể nấu ngay'
                        : `Thiếu ${dish.missing_count} nguyên liệu`}
                    </span>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => openDishDetail(dish)}
                      className="text-left text-lg font-bold leading-7 text-ink transition hover:text-forest focus-visible:outline-none focus-visible:underline"
                    >
                      {dish.name}
                    </button>

                    <p className="mt-1 text-sm text-muted">{dish.category}</p>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-end justify-between gap-3">
                      <span className="text-sm text-muted">
                        Nguyên liệu đã khớp
                      </span>
                      <span className="text-sm font-bold text-ink">
                        {dish.matched_count}/{dish.total_ingredients}
                      </span>
                    </div>

                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-cream"
                      role="progressbar"
                      aria-label={`Mức độ phù hợp của ${dish.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={dish.match_percentage}
                    >
                      <div
                        className="h-full rounded-full bg-forest transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, dish.match_percentage),
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1.5 text-right text-xs text-muted">
                      Khớp {dish.match_percentage}%
                    </p>
                  </div>

                  <div className="mt-4 flex-1 border-t border-beige/70 pt-4">
                    {dish.missing_ingredients.length > 0 ? (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Cần bổ sung
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {dish.missing_ingredients.map((name) => (
                            <span
                              key={name}
                              className="rounded-full bg-cream px-3 py-1.5 text-xs text-ink"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start gap-2 text-sm text-forest">
                        <CircleCheck size={17} className="mt-0.5 shrink-0" />
                        <span className="leading-5">
                          Đã đủ các nguyên liệu theo công thức.
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openDishDetail(dish)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-beige px-4 py-3 text-sm font-semibold text-ink transition hover:border-forest hover:bg-cream"
                  >
                    <CookingPot size={17} />
                    Xem món và công thức
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
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
