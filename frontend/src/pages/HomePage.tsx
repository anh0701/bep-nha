
import {
  ChartNoAxesColumn,
  ChefHat,
  ChevronRight,
  CookingPot,
  Plus,
  Shuffle,
  Utensils,
} from 'lucide-react'

import { useEffect, useState } from 'react'
import { getDishes } from '../services/dish.service'
import type { Dish } from '../types/dish'
import { Link, useNavigate } from 'react-router'

function getShortCategory(category: string) {
  const labels: Record<string, string> = {
    'Bún/phở/miến/mì': 'Bún · Phở · Mì',
    'Món mặn': 'Món mặn',
    'Món chay': 'Món chay',
    Canh: 'Món canh',
    Rau: 'Món rau',
    Cháo: 'Cháo',
  }

  return labels[category] ?? category
}

function getFeaturedDishes<T extends { category: string }>(
  dishes: T[],
  limit: number,
): T[] {
  const groups = new Map<string, T[]>()

  for (const dish of dishes) {
    const group = groups.get(dish.category) ?? []
    group.push(dish)
    groups.set(dish.category, group)
  }

  const featured: T[] = []
  const categories = [...groups.keys()]

  while (featured.length < limit) {
    let added = false

    for (const category of categories) {
      const group = groups.get(category)

      if (group && group.length > 0) {
        featured.push(group.shift()!)
        added = true

        if (featured.length >= limit) break
      }
    }

    if (!added) break
  }

  return featured
}

export default function HomePage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const featuredDishes = getFeaturedDishes(dishes, 6)

  const navigate = useNavigate()

  useEffect(() => {
    async function loadDishes() {
      try {
        const result = await getDishes()
        setDishes(result.data)
      } catch (err) {
        console.error('Failed to load dishes:', err)
        setError('Không thể tải danh sách món ăn.')
      } finally {
        setLoading(false)
      }
    }

    loadDishes()
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-5 py-7 md:px-10 md:py-10">
      <section className="relative overflow-hidden rounded-3xl bg-forest p-6 text-white sm:p-9 lg:p-12">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/90">
            <CookingPot size={14} />
            GỢI Ý HÔM NAY
          </span>

          <h2 className="mt-5 text-3xl leading-tight font-bold sm:text-4xl">
            Để Bếp Nhà
            <br />
            chọn món giúp bạn!
          </h2>

          <p className="mt-3 max-w-md text-sm leading-6 text-white/75 sm:text-base">
            Không cần đau đầu nghĩ hôm nay ăn gì.
            Cùng chọn những món ngon cho bữa cơm gia đình nhé.
          </p>

          <button
            type="button"
            onClick={() => navigate('/random')}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-forest transition hover:bg-sage"
          >
            <Shuffle size={18} />
            Random món ăn
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="pointer-events-none absolute -right-10 -bottom-20 hidden size-72 items-center justify-center rounded-full border border-white/10 sm:flex lg:right-8 lg:size-80">
          <div className="flex size-56 items-center justify-center rounded-full border border-white/15 bg-white/5">
            <CookingPot
              size={105}
              strokeWidth={1}
              className="text-white/80"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Hôm nay nấu gì?</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
              Khám phá món ngon
            </h2>
            <p className="mt-2 text-sm text-muted">
              Một chút gợi ý cho bữa cơm gia đình.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-forest hover:underline"
            onClick={() => navigate('/dishes')}
          >
            Xem tất cả <ChevronRight size={16} />
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted">
            Đang chuẩn bị danh sách món ngon...
          </p>
        ) : error ? (
          <p role="alert" className="py-8 text-sm text-red-600">
            {error}
          </p>
        ) : featuredDishes.length === 0 ? (
          <p className="py-8 text-sm text-muted">
            Kho món ăn đang trống. Hãy thêm món đầu tiên nhé!
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
            {featuredDishes.map((dish) => (
              <article
                key={dish.id}
                className="group flex min-w-0 items-start gap-4 border-b border-beige/80 py-5"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sage/70 text-forest transition group-hover:bg-sage">
                  <CookingPot size={22} strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold tracking-wide text-muted">
                    {getShortCategory(dish.category)}
                  </span>

                  <h3 className="mt-1 font-semibold leading-6 text-ink transition group-hover:text-forest">
                    {dish.name}
                  </h3>
                </div>

                <ChevronRight
                  size={17}
                  className="mt-5 shrink-0 text-muted/60 transition group-hover:translate-x-0.5 group-hover:text-forest"
                />
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          className="flex items-center gap-4 rounded-2xl border border-beige/80 bg-white p-5 text-left transition hover:bg-sage/20"
          onClick={() => navigate("/dishes")}
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sage text-forest">
            <Utensils size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">Kho món ăn</h3>
            <p className="mt-1 text-sm text-muted">
              Quản lý các món yêu thích của gia đình.
            </p>
          </div>

          <ChevronRight className="shrink-0 text-muted" size={19} />
        </button>

        <button
          type="button"
          className="flex items-center gap-4 rounded-2xl border border-beige/80 bg-white p-5 text-left transition hover:bg-sage/20"
          onClick={() => navigate("/history")}
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sage text-forest">
            <ChartNoAxesColumn size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">Lịch sử và thống kê</h3>
            <p className="mt-1 text-sm text-muted">
              Theo dõi những món đã thực sự được nấu.
            </p>
          </div>

          <ChevronRight className="shrink-0 text-muted" size={19} />
        </button>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-beige bg-white/50 p-5 sm:flex-row sm:items-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-beige text-forest">
          <Plus size={22} />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold">Thêm món ăn mới</h3>
          <p className="mt-1 text-sm text-muted">
            Bổ sung món vào kho để có thêm lựa chọn cho những bữa cơm sau.
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl border border-beige px-4 py-2.5 text-sm font-semibold text-forest hover:bg-sage/50"
          onClick={() => {
            window.alert('Form thêm món ăn sẽ được triển khai trong trang Kho món ăn.')
          }}
        >
          Thêm món
        </button>
      </section>
    </div>
  )
}
