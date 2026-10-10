
import { Utensils } from 'lucide-react'

export default function DishesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-7 md:px-10 md:py-10">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sage text-forest">
          <Utensils size={24} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Kho món ăn
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted">
            Quản lý danh sách món ăn của gia đình. Chúng ta sẽ bổ sung
            tìm kiếm, lọc danh mục và thêm, sửa, ngừng sử dụng món ăn
            ở bước tiếp theo.
          </p>
        </div>
      </div>
    </div>
  )
}
