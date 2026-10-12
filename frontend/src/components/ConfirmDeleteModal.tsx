import type { ReactNode } from 'react'
import { AlertTriangle, LoaderCircle, Trash2 } from 'lucide-react'

interface ConfirmDeleteModalProps {
  title: string
  description: ReactNode
  confirmLabel: string
  loadingLabel?: string
  isLoading: boolean
  error?: string | null
  icon?: ReactNode
  children?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDeleteModal({
  title,
  description,
  confirmLabel,
  loadingLabel = 'Đang xóa...',
  isLoading,
  error,
  icon,
  children,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isLoading
        ) {
          onCancel()
        }
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-description"
        className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl border border-beige bg-cream p-6 shadow-2xl duration-200 sm:p-7"
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          {icon ?? <AlertTriangle size={24} strokeWidth={2} />}
        </div>

        <h2
          id="confirm-delete-title"
          className="mt-5 text-xl font-bold text-ink"
        >
          {title}
        </h2>

        <div
          id="confirm-delete-description"
          className="mt-2 text-sm leading-6 text-muted"
        >
          {description}
        </div>

        {children}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-xl border border-beige px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-sage/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                {loadingLabel}
              </>
            ) : (
              <>
                <Trash2 size={16} />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  )
}
