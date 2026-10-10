
import {
  CalendarDays,
  ChartNoAxesColumn,
  ChefHat,
  Clock3,
  CookingPot,
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

export default function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-beige bg-white/60 p-6 md:flex">
      <a href="#" className="mb-10 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-forest text-white">
          <CookingPot size={25} />
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-forest">
            Bếp Nhà
          </h1>
          <p className="text-xs text-muted">
            Bữa cơm nhà, niềm vui nhỏ
          </p>
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

        <p className="font-semibold text-forest">
          Bí ý tưởng hôm nay?
        </p>

        <p className="mt-1 text-sm leading-5 text-muted">
          Để Bếp Nhà chọn giúp bạn một bữa thật ngon.
        </p>
      </div>
    </aside>
  )
}
