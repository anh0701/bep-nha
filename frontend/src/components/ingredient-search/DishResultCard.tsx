
import { ChefHat, CircleCheck, CookingPot } from 'lucide-react'

import type { DishByIngredients } from '../../types/dish'

interface DishResultCardProps {
  dish: DishByIngredients
  onViewDetail: (dish: DishByIngredients) => void
}

export default function DishResultCard({
  dish,
  onViewDetail,
}: DishResultCardProps) {
  return (
    <article
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
          onClick={() => onViewDetail(dish)}
          className="text-left text-lg font-bold leading-7 text-ink transition hover:text-forest focus-visible:outline-none focus-visible:underline"
        >
          {dish.name}
        </button>

        <p className="mt-1 text-sm text-muted">{dish.category}</p>
      </div>

      <div className="mt-5">
        <div className="flex items-end justify-between gap-3">
          <span className="text-sm text-muted">Nguyên liệu đã khớp</span>
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
        onClick={() => onViewDetail(dish)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-beige px-4 py-3 text-sm font-semibold text-ink transition hover:border-forest hover:bg-cream"
      >
        <CookingPot size={17} />
        Xem món và công thức
      </button>
    </article>
  )
}
