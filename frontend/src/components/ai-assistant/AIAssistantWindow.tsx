import {
  Bot,
  Maximize2,
  Minimize2,
  Minus,
  Move,
  X,
} from 'lucide-react'

import type { ReactNode } from 'react'

interface AIAssistantWindowProps {
  children: ReactNode
  isMinimized: boolean
  isMaximized: boolean
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
  onDragStart: (event: React.PointerEvent<HTMLDivElement>) => void
}

export default function AIAssistantWindow({
  children,
  isMinimized,
  isMaximized,
  onMinimize,
  onMaximize,
  onClose,
  onDragStart,
}: AIAssistantWindowProps) {
  return (
    <section
      className={`fixed z-[99] flex flex-col overflow-hidden border border-sage-200 bg-cream shadow-2xl shadow-forest/15 transition-[width,height,border-radius] duration-200 ${
        isMaximized
          ? 'inset-3 rounded-2xl md:inset-6'
          : 'bottom-24 right-4 h-[min(620px,calc(100dvh-130px))] w-[min(420px,calc(100vw-32px))] rounded-2xl md:bottom-24 md:right-7'
      }`}
      style={
        isMaximized
          ? undefined
          : {
              touchAction: 'pan-y',
            }
      }
    >
      <header
        onPointerDown={onDragStart}
        className="flex cursor-grab items-center gap-3 border-b border-sage-200 bg-white px-4 py-3 active:cursor-grabbing"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-white">
          <Bot size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-forest">
            Bếp Nhà AI
          </h3>
          <p className="text-xs text-sage-600">
            Trợ lý nấu ăn của bạn
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onMinimize}
            title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-sage-100 hover:text-forest"
          >
            {isMinimized ? (
              <Move size={17} />
            ) : (
              <Minus size={17} />
            )}
          </button>

          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onMaximize}
            title={isMaximized ? 'Khôi phục kích thước' : 'Phóng to'}
            className="hidden rounded-lg p-2 text-gray-500 transition hover:bg-sage-100 hover:text-forest sm:block"
          >
            {isMaximized ? (
              <Minimize2 size={17} />
            ) : (
              <Maximize2 size={17} />
            )}
          </button>

          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onClose}
            title="Đóng"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-500"
          >
            <X size={17} />
          </button>
        </div>
      </header>

      {!isMinimized && (
        <>
          <div className="min-h-0 flex-1 overflow-hidden">
            {children}
          </div>

          {!isMaximized && (
            <div className="pointer-events-none absolute bottom-0 left-0 h-4 w-4">
              <div className="absolute bottom-1 left-1 h-2 w-2 border-b-2 border-l-2 border-sage-400" />
            </div>
          )}
        </>
      )}
    </section>
  )
}