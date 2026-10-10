
import {
  CalendarDays,
  ChartNoAxesColumn,
  ChefHat,
  ChevronRight,
  Clock3,
  CookingPot,
  Plus,
  Shuffle,
  Utensils,
} from 'lucide-react'

const navigation = [
  { label: 'Trang chủ', icon: CookingPot, active: true },
  { label: 'Random món ăn', icon: Shuffle, active: false },
  { label: 'Thực đơn', icon: CalendarDays, active: false },
  { label: 'Kho món ăn', icon: Utensils, active: false },
  { label: 'Lịch sử nấu', icon: Clock3, active: false },
  { label: 'Thống kê', icon: ChartNoAxesColumn, active: false },
]

const todayMeals = [
  { category: 'MÓN CANH', name: 'Canh bí đỏ nấu xương', time: 'Bữa trưa' },
  { category: 'MÓN MẶN', name: 'Gà kho gừng', time: 'Bữa trưa' },
  { category: 'MÓN RAU', name: 'Rau muống luộc', time: 'Bữa trưa' },
]

function App() {
  return (
    <div className="min-h-screen bg-cream md:flex">
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-beige bg-white/60 p-6 md:flex">
        <a href="#" className="mb-10 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-forest text-white">
            <CookingPot size={25} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-forest">
              Bếp Nhà
            </h1>
            <p className="text-xs text-muted">Bữa cơm nhà, niềm vui nhỏ</p>
          </div>
        </a>

        <p className="mb-3 px-3 text-xs font-semibold tracking-widest text-muted">
          KHÔNG GIAN BẾP
        </p>

        <nav className="space-y-1">
          {navigation.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              type="button"
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                active
                  ? 'bg-sage text-forest'
                  : 'text-muted hover:bg-sage/50 hover:text-forest'
              }`}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-sage/70 p-4">
          <ChefHat size={24} className="mb-3 text-forest" />
          <p className="font-semibold text-forest">Bí ý tưởng hôm nay?</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            Để Bếp Nhà chọn giúp bạn một bữa thật ngon.
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-24 md:pb-8">
        <header className="flex items-center justify-between border-b border-beige/80 px-5 py-4 md:px-10 md:py-6">
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-forest text-white">
              <CookingPot size={22} />
            </div>
            <span className="text-lg font-bold text-forest">Bếp Nhà</span>
          </div>

          <div className="hidden md:block">
            <p className="text-sm text-muted">Không gian của những bữa cơm ngon</p>
            <p className="mt-1 text-lg font-semibold">Chào bạn, hôm nay ăn gì nhỉ?</p>
          </div>

          <div className="hidden rounded-full bg-white px-4 py-2 text-sm text-muted sm:block">
            <CalendarDays size={16} className="mr-2 inline" />
            Bữa cơm gia đình
          </div>

          <div className="md:hidden">
            <ChefHat className="text-forest" size={24} />
          </div>
        </header>

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
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-forest transition hover:bg-sage"
              >
                <Shuffle size={18} />
                Random món ăn
                <ChevronRight size={17} />
              </button>
            </div>

            <div className="pointer-events-none absolute -right-10 -bottom-20 hidden size-72 items-center justify-center rounded-full border border-white/10 sm:flex lg:right-8 lg:size-80">
              <div className="flex size-56 items-center justify-center rounded-full border border-white/15 bg-white/5">
                <CookingPot size={105} strokeWidth={1} className="text-white/80" />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm text-muted">Gợi ý cho gia đình</p>
                <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                  Thực đơn hôm nay
                </h2>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline"
              >
                Xem thực đơn <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {todayMeals.map((meal, index) => (
                <article
                  key={meal.name}
                  className="rounded-2xl border border-beige/80 bg-white p-5 transition hover:border-forest/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-lg bg-sage px-2.5 py-1 text-xs font-semibold tracking-wide text-forest">
                      {meal.category}
                    </span>
                    <span className="text-xs text-muted">{meal.time}</span>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cream text-forest">
                      {index === 0 ? (
                        <CookingPot size={21} />
                      ) : (
                        <Utensils size={21} />
                      )}
                    </div>
                    <h3 className="font-semibold leading-6">{meal.name}</h3>
                  </div>

                  <div className="mt-5 border-t border-beige/70 pt-4">
                    <span className="text-xs text-muted">
                      Chưa xác nhận đã nấu
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-3 text-xs leading-5 text-muted">
              Đây là dữ liệu minh họa giao diện. Thực đơn thật sẽ được lấy từ
              database sau khi hoàn thành backend.
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl border border-beige/80 bg-white p-5">
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
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-beige/80 bg-white p-5">
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
            </div>
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
            >
              Thêm món
            </button>
          </section>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-beige bg-cream/95 px-1 py-2 backdrop-blur md:hidden">
        {navigation
          .filter(({ label }) => label !== 'Lịch sử nấu')
          .map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              type="button"
              className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[10px] ${
                active ? 'font-semibold text-forest' : 'text-muted'
              }`}
            >
              <Icon size={19} />
              <span>{label === 'Random món ăn' ? 'Random' : label}</span>
            </button>
          ))}
      </nav>
    </div>
  )
}

export default App
