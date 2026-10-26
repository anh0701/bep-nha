
import {
  CalendarDays,
  ChartNoAxesColumn,
  Clock3,
  CookingPot,
  Package,
  Search,
  Shuffle,
  Utensils,
} from 'lucide-react'

export const navigation = [
  { label: 'Trang chủ', path: '/', icon: CookingPot },
  { label: 'Random món ăn', path: '/random', icon: Shuffle },
  { label: 'Tìm món theo nguyên liệu', path: '/ingredient-search', icon: Search,},
  { label: 'Thực đơn', path: '/meal-plan', icon: CalendarDays },
  { label: 'Kho món ăn', path: '/dishes', icon: Utensils },
  { label: 'Kho nguyên liệu', path: '/ingredients', icon: Package },
  { label: 'Lịch sử nấu', path: '/history', icon: Clock3 },
  { label: 'Thống kê', path: '/statistics', icon: ChartNoAxesColumn },
  // { label: 'Vision', path: '/vision', icon: Clock3},
] as const

export const mobileNavigation = [
  navigation[0],
  navigation[1],
  navigation[2],
  navigation[4],
  navigation[7],
]
