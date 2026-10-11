
import { CalendarDays, ChefHat, CookingPot } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-beige/80 bg-cream/95 px-5 py-4 backdrop-blur-sm md:px-10 md:py-6">
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex size-10 items-center justify-center rounded-xl bg-forest text-white">
          <CookingPot size={22} />
        </div>

        <span className="text-lg font-bold text-forest">
          Bếp Nhà
        </span>
      </div>

      <div className="hidden md:block">
        <p className="text-sm text-muted">
          Không gian của những bữa cơm ngon
        </p>

        <p className="mt-1 text-lg font-semibold">
          Chào bạn, hôm nay ăn gì nhỉ?
        </p>
      </div>

      <div className="hidden rounded-full bg-white px-4 py-2 text-sm text-muted sm:block">
        <CalendarDays size={16} className="mr-2 inline" />
        Bữa cơm gia đình
      </div>

      <div className="md:hidden">
        <ChefHat className="text-forest" size={24} />
      </div>
    </header>
  )
}
