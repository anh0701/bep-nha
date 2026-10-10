
import {
  CalendarDays,
  ChartNoAxesColumn,
  CookingPot,
  Shuffle,
  Utensils,
} from 'lucide-react'

const navigation = [
  { label: 'Trang chủ', icon: CookingPot, active: true },
  { label: 'Random món ăn', icon: Shuffle, active: false },
  { label: 'Thực đơn', icon: CalendarDays, active: false },
  { label: 'Kho món ăn', icon: Utensils, active: false },
  { label: 'Thống kê', icon: ChartNoAxesColumn, active: false },
]

export default function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-beige bg-cream/95 px-1 py-2 backdrop-blur md:hidden">
      {navigation.map(({ label, icon: Icon, active }) => (
        <button
          key={label}
          type="button"
          className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[10px] ${
            active
              ? 'font-semibold text-forest'
              : 'text-muted'
          }`}
        >
          <Icon size={19} />

          <span>
            {label === 'Random món ăn' ? 'Random' : label}
          </span>
        </button>
      ))}
    </nav>
  )
}
