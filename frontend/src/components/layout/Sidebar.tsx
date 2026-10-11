
import {
    CalendarDays,
    ChartNoAxesColumn,
    ChefHat,
    Clock3,
    CookingPot,
    Shuffle,
    Utensils,
} from 'lucide-react'

import { NavLink } from 'react-router'

const navigation = [
    { label: 'Trang chủ', path: '/', icon: CookingPot },
    { label: 'Random món ăn', path: '/random', icon: Shuffle },
    { label: 'Thực đơn', path: '/meal-plan', icon: CalendarDays },
    { label: 'Kho món ăn', path: '/dishes', icon: Utensils },
    { label: 'Lịch sử nấu', path: '/history', icon: Clock3 },
    { label: 'Thống kê', path: '/statistics', icon: ChartNoAxesColumn },
]

export default function Sidebar() {
    return (
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-beige bg-white/60 p-6 md:flex">
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
                {navigation.map(({ label, path, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        className={({ isActive }) =>
                            `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${isActive
                                ? 'bg-sage text-forest'
                                : 'text-muted hover:bg-sage/50 hover:text-forest'
                            }`
                        }
                    >
                        <Icon size={19} />
                        {label}
                    </NavLink>
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
