
import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CookingPot,
  LoaderCircle,
  PieChart,
  RefreshCw,
  Soup,
  TrendingUp,
  Utensils,
} from 'lucide-react'

import {
  getStatisticsOverview,
  getStatisticsTimeline,
  getStatisticsTopDishes,
  getStatisticsByCategory,
} from '../services/statistics.service'
import type { CategoryStatisticsItem, StatisticsOverview, TimelineItem, TopDishItem } from '../types/statistics'

type GroupBy = 'day' | 'week' | 'month'

interface StatisticsData {
  overview: StatisticsOverview
  timeline: TimelineItem[]
  topDishes: TopDishItem[]
  categories: CategoryStatisticsItem[]
}

const emptyOverview: StatisticsOverview = {
  total_sessions: 0,
  cooking_days: 0,
  total_dishes_cooked: 0,
  unique_dishes_cooked: 0,
}

function getCurrentMonth() {
  const now = new Date()

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
  ].join('-')
}

function getMonthRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)

  const nextMonth = new Date(year, monthNumber, 1)

  return {
    from: `${month}-01`,
    to: [
      nextMonth.getFullYear(),
      String(nextMonth.getMonth() + 1).padStart(2, '0'),
      '01',
    ].join('-'),
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value ?? 0)
}

function formatDate(value: string, groupBy: GroupBy) {
  if (groupBy === 'month') {
    const [year, month] = value.split('-').map(Number)

    return `T${month}/${year}`
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return `${String(date.getDate()).padStart(2, '0')}/${
    String(date.getMonth() + 1).padStart(2, '0')
  }`
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)

  return `Tháng ${monthNumber}, ${year}`
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: number
  description: string
  icon: typeof CookingPot
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#e7e5d9] bg-white/70 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm leading-5 text-[#777b70]">{title}</p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#294b3b] sm:text-3xl">
            {formatNumber(value)}
          </p>
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf0e7] text-[#47745a]">
          <Icon size={20} strokeWidth={1.8} />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#85877e]">
        {description}
      </p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-4 py-8 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-[#f0f1e9] text-[#7d927e]">
        <CookingPot size={21} />
      </div>

      <p className="mt-3 text-sm font-medium text-[#526354]">
        Chưa có dữ liệu
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-[#85877e]">
        {message}
      </p>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BarChart3
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf0e7] text-[#47745a]">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <h2 className="font-semibold text-[#294b3b]">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-[#85877e]">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function StatisticsPage() {
  const [month, setMonth] = useState(getCurrentMonth)
  const [groupBy, setGroupBy] = useState<GroupBy>('day')

  const [data, setData] = useState<StatisticsData>({
    overview: emptyOverview,
    timeline: [],
    topDishes: [],
    categories: [],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const filters = useMemo(() => getMonthRange(month), [month])

  useEffect(() => {
    let cancelled = false

    async function loadStatistics() {
      setLoading(true)
      setError('')

      try {
        const [
          overview,
          timeline,
          topDishes,
          categories,
        ] = await Promise.all([
          getStatisticsOverview(filters),
          getStatisticsTimeline(filters, groupBy),
          getStatisticsTopDishes(filters, 10),
          getStatisticsByCategory(filters),
        ])

        if (cancelled) return

        setData({
          overview,
          timeline,
          topDishes,
          categories,
        })
      } catch (err) {
        if (cancelled) return

        setError(
          err instanceof Error
            ? err.message
            : 'Đã xảy ra lỗi khi tải dữ liệu thống kê.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadStatistics()

    return () => {
      cancelled = true
    }
  }, [filters, groupBy])

  const maxSessions = Math.max(
    1,
    ...data.timeline.map((item) => item.total_sessions),
  )

  const maxCategoryCount = Math.max(
    1,
    ...data.categories.map((item) => item.cooked_count),
  )

  const maxDishCount = Math.max(
    1,
    ...data.topDishes.map((item) => item.cooked_count),
  )

  const hasCookingData = data.overview.total_sessions > 0

  function changeMonth(offset: number) {
    const [year, monthNumber] = month.split('-').map(Number)
    const next = new Date(year, monthNumber - 1 + offset, 1)

    setMonth(
      `${next.getFullYear()}-${String(
        next.getMonth() + 1,
      ).padStart(2, '0')}`,
    )
  }

  return (
    <div className="min-h-full bg-[#faf9f4] px-4 py-6 text-[#344b3c] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* Page heading */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-[#6f8b73]">
              <TrendingUp size={16} />
              <span>Nhìn lại những bữa cơm nhà</span>
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#294b3b] sm:text-3xl">
              Thống kê
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#777b70]">
              Theo dõi thói quen nấu ăn và những món quen thuộc
              trong căn bếp của bạn.
            </p>
          </div>

          {/* Month filter */}
          <div className="flex items-center gap-2 self-start rounded-xl border border-[#e7e5d9] bg-white px-2 py-2 sm:self-auto">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Tháng trước"
              className="flex size-9 items-center justify-center rounded-lg text-[#647565] transition hover:bg-[#f0f1e9]"
            >
              <ChevronLeft size={19} />
            </button>

            <label className="flex min-w-0 items-center gap-2 px-1">
              <CalendarDays
                size={17}
                className="shrink-0 text-[#6f8b73]"
              />

              <input
                type="month"
                value={month}
                max={getCurrentMonth()}
                onChange={(event) => {
                  if (event.target.value) {
                    setMonth(event.target.value)
                  }
                }}
                aria-label="Chọn tháng thống kê"
                className="w-[145px] min-w-0 cursor-pointer bg-transparent text-sm font-medium text-[#344b3c] outline-none"
              />
            </label>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              disabled={month >= getCurrentMonth()}
              aria-label="Tháng tiếp theo"
              className="flex size-9 items-center justify-center rounded-lg text-[#647565] transition hover:bg-[#f0f1e9] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-[#596c5c]">
            Tổng quan · {formatMonth(month)}
          </p>

          {loading && (
            <span className="flex items-center gap-2 text-xs text-[#7c897b]">
              <LoaderCircle size={15} className="animate-spin" />
              Đang cập nhật
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-medium">Không thể tải thống kê</p>
              <p className="mt-1 break-words leading-5">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                // Trigger a fresh load by reselecting the current month.
                setMonth((current) => {
                  const [year, monthNumber] = current.split('-')
                  return `${year}-${monthNumber}`
                })
                setGroupBy((current) => current)
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-red-100"
            >
              <RefreshCw size={14} />
              Tải lại
            </button>
          </div>
        )}

        {/* Overview cards */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Số lần nấu"
            value={data.overview.total_sessions}
            description="Tổng số lần ghi nhận nấu ăn"
            icon={CookingPot}
          />

          <StatCard
            title="Ngày có nấu"
            value={data.overview.cooking_days}
            description="Số ngày khác nhau có nấu ăn"
            icon={CalendarDays}
          />

          <StatCard
            title="Tổng lượt món"
            value={data.overview.total_dishes_cooked}
            description="Tổng lượt món trong các lần nấu"
            icon={Utensils}
          />

          <StatCard
            title="Món khác nhau"
            value={data.overview.unique_dishes_cooked}
            description="Số món riêng biệt đã từng nấu"
            icon={Soup}
          />
        </div>

        {!loading && !error && !hasCookingData && (
          <div className="mt-5 rounded-2xl border border-dashed border-[#d9dece] bg-white/50">
            <EmptyState message="Tháng này chưa có lịch sử nấu ăn. Hãy ghi lại một lần nấu để bắt đầu theo dõi nhé." />
          </div>
        )}

        {/* Timeline chart */}
        <section className="mt-6 rounded-2xl border border-[#e7e5d9] bg-white/70 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeader
              icon={BarChart3}
              title="Nhịp điệu căn bếp"
              description="Số lần nấu được ghi nhận trong khoảng thời gian đã chọn."
            />

            <label className="flex w-fit items-center gap-2 rounded-lg border border-[#e7e5d9] bg-white px-3 py-2">
              <span className="text-xs text-[#777b70]">Theo</span>

              <select
                value={groupBy}
                onChange={(event) =>
                  setGroupBy(event.target.value as GroupBy)
                }
                className="cursor-pointer appearance-none bg-transparent text-sm font-medium text-[#45634c] outline-none"
              >
                <option value="day">Ngày</option>
                <option value="week">Tuần</option>
                <option value="month">Tháng</option>
              </select>

              <ChevronDown size={14} className="text-[#7c897b]" />
            </label>
          </div>

          {loading && data.timeline.length === 0 ? (
            <div className="flex h-52 items-center justify-center">
              <LoaderCircle
                size={24}
                className="animate-spin text-[#6f8b73]"
              />
            </div>
          ) : data.timeline.length === 0 ? (
            <EmptyState message="Chưa có dữ liệu để vẽ biểu đồ trong khoảng thời gian này." />
          ) : (
            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between text-xs text-[#85877e]">
                <span>Số lần nấu</span>
                <span>
                  Cao nhất: {formatNumber(maxSessions)}
                </span>
              </div>

              <div className="flex h-48 items-end gap-1.5 border-b border-[#e8e9df] pb-0 sm:gap-2">
                {data.timeline.map((item) => {
                  const height = Math.max(
                    item.total_sessions > 0 ? 5 : 0,
                    (item.total_sessions / maxSessions) * 100,
                  )

                  return (
                    <div
                      key={item.period}
                      title={`${formatDate(item.period, groupBy)}: ${item.total_sessions} lần nấu, ${item.total_dishes} lượt món`}
                      className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                    >
                      <span className="mb-1 text-[10px] text-[#607463] opacity-0 transition group-hover:opacity-100 sm:text-xs">
                        {item.total_sessions || ''}
                      </span>

                      <div
                        className="w-full max-w-10 rounded-t-md bg-[#8eae91] transition-colors group-hover:bg-[#527d5d]"
                        style={{
                          height: `${height}%`,
                          minHeight: item.total_sessions > 0 ? '4px' : '0',
                        }}
                      />

                      <span className="mt-2 h-4 w-full truncate text-center text-[9px] text-[#85877e] sm:text-[11px]">
                        {formatDate(item.period, groupBy)}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#85877e]">
                <span>{data.timeline.length} mốc thời gian có dữ liệu</span>

                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-[#8eae91]" />
                  Số lần nấu
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Category + Top dishes */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Categories */}
          <section className="min-w-0 rounded-2xl border border-[#e7e5d9] bg-white/70 p-4 sm:p-6">
            <SectionHeader
              icon={PieChart}
              title="Khẩu vị gia đình"
              description="Tần suất nấu theo danh mục món ăn."
            />

            {loading && data.categories.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <LoaderCircle
                  size={23}
                  className="animate-spin text-[#6f8b73]"
                />
              </div>
            ) : data.categories.length === 0 ? (
              <EmptyState message="Chưa có danh mục để thống kê." />
            ) : (
              <div className="mt-6 space-y-5">
                {data.categories.map((category) => {
                  const percentage =
                    (category.cooked_count / maxCategoryCount) * 100

                  return (
                    <div key={category.category_id}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-[#526354]">
                          {category.category_name}
                        </span>

                        <span className="shrink-0 text-xs tabular-nums text-[#85877e]">
                          {formatNumber(category.cooked_count)} lượt
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#edf0e7]">
                        <div
                          className="h-full rounded-full bg-[#8eae91] transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <p className="mt-1.5 text-[11px] text-[#85877e]">
                        {formatNumber(category.unique_dishes_cooked)} món khác nhau đã nấu
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Top dishes */}
          <section className="min-w-0 rounded-2xl border border-[#e7e5d9] bg-white/70 p-4 sm:p-6">
            <SectionHeader
              icon={CookingPot}
              title="Món quen thuộc"
              description="Top 10 món được nấu nhiều nhất trong kỳ."
            />

            {loading && data.topDishes.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <LoaderCircle
                  size={23}
                  className="animate-spin text-[#6f8b73]"
                />
              </div>
            ) : data.topDishes.length === 0 ? (
              <EmptyState message="Hãy ghi lại các lần nấu để khám phá những món quen thuộc của gia đình." />
            ) : (
              <div className="mt-5 divide-y divide-[#edede5]">
                {data.topDishes.map((dish, index) => {
                  const percentage =
                    (dish.cooked_count / maxDishCount) * 100

                  return (
                    <div
                      key={dish.dish_id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                          index < 3
                            ? 'bg-[#eaf0e7] text-[#47745a]'
                            : 'bg-[#f1f0e9] text-[#7d8176]'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#405544]">
                          {dish.dish_name}
                        </p>

                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#edf0e7]">
                          <div
                            className="h-full rounded-full bg-[#9db69b]"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <p className="mt-1 text-[11px] text-[#85877e]">
                          {dish.category_name}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-[#45634c]">
                          {formatNumber(dish.cooked_count)}
                        </p>
                        <p className="text-[10px] text-[#85877e]">
                          lần nấu
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-[#93958a]">
          Thống kê được tổng hợp từ lịch sử nấu ăn đã ghi nhận trong Bếp Nhà.
        </p>
      </div>
    </div>
  )
}
