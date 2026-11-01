import { useRef, useState } from 'react'
import { Bot, LoaderCircle } from 'lucide-react'

import AIAssistantButton from './AIAssistantButton'
import AIAssistantWindow from './AIAssistantWindow'
import AIChatMessage from './AIChatMessage'
import AIChatInput from './AIChatInput'
import { useAIAssistant } from './useAIAssistant'

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  const [position, setPosition] = useState<{
    x: number
    y: number
  } | null>(null)

  const dragRef = useRef<{
    pointerX: number
    pointerY: number
    startX: number
    startY: number
  } | null>(null)

  const {
    messages,
    isLoading,
    error,
    sendMessage,
  } = useAIAssistant()

  function handleDragStart(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (
      isMaximized ||
      window.innerWidth < 640 ||
      event.button !== 0
    ) {
      return
    }

    const target = event.target as HTMLElement

    if (target.closest('button')) {
      return
    }

    const rect = event.currentTarget.parentElement?.getBoundingClientRect()

    if (!rect) {
      return
    }

    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: rect.left,
      startY: rect.top,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleDragMove(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (!dragRef.current) {
      return
    }

    const drag = dragRef.current

    const width = 420
    const height = 620

    const x = drag.startX + event.clientX - drag.pointerX
    const y = drag.startY + event.clientY - drag.pointerY

    setPosition({
      x: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - height - 8)),
    })
  }

  function handleDragEnd() {
    dragRef.current = null
  }

  return (
    <>
      {isOpen && (
        <AIAssistantWindow
          isMinimized={isMinimized}
          isMaximized={isMaximized}
          onMinimize={() => setIsMinimized((value) => !value)}
          onMaximize={() => setIsMaximized((value) => !value)}
          onClose={() => {
            setIsOpen(false)
            setIsMinimized(false)
            setIsMaximized(false)
            setPosition(null)
          }}
          onDragStart={(event) => {
            handleDragStart(event)

            event.currentTarget.onpointermove = (moveEvent) => {
              if (!dragRef.current) return

              const drag = dragRef.current
              const rect = event.currentTarget.parentElement?.getBoundingClientRect()

              if (!rect) return

              const x = drag.startX + moveEvent.clientX - drag.pointerX
              const y = drag.startY + moveEvent.clientY - drag.pointerY

              setPosition({
                x: Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)),
                y: Math.max(8, Math.min(y, window.innerHeight - rect.height - 8)),
              })
            }

            event.currentTarget.onpointerup = handleDragEnd
            event.currentTarget.onpointercancel = handleDragEnd
          }}
        >
          <div className="flex h-full flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((message) => (
                <AIChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                />
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-sage-600">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white">
                    <Bot size={17} />
                  </div>

                  <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm">
                    <LoaderCircle
                      size={15}
                      className="animate-spin"
                    />
                    Bếp Nhà AI đang suy nghĩ...
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            <AIChatInput
              onSend={sendMessage}
              disabled={isLoading}
            />
          </div>
        </AIAssistantWindow>
      )}

      <AIAssistantButton
        isOpen={isOpen}
        onClick={() => {
          setIsOpen((value) => !value)
          setIsMinimized(false)
        }}
      />
    </>
  )
}