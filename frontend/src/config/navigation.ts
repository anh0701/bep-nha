
import {
  CalendarDays,
  ChartNoAxesColumn,
  Clock3,
  CookingPot,
  Package,
  Shuffle,
  Utensils,
} from 'lucide-react'

export const navigation = [
  { label: 'Trang chủ', path: '/', icon: CookingPot },
  { label: 'Random món ăn', path: '/random', icon: Shuffle },
  { label: 'Thực đơn', path: '/meal-plan', icon: CalendarDays },
  { label: 'Kho món ăn', path: '/dishes', icon: Utensils },
  { label: 'Kho nguyên liệu', path: '/ingredients', icon: Package },
  { label: 'Lịch sử nấu', path: '/history', icon: Clock3 },
  { label: 'Thống kê', path: '/statistics', icon: ChartNoAxesColumn },
] as const

export const mobileNavigation = [
  navigation[0],
  navigation[1],
  navigation[2],
  navigation[3],
  navigation[6],
]
