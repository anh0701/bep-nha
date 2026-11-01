import { Bot, X } from 'lucide-react'

interface AIAssistantButtonProps {
  isOpen: boolean
  onClick: () => void
}

export default function AIAssistantButton({
  isOpen,
  onClick,
}: AIAssistantButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? 'Đóng Bếp Nhà AI' : 'Mở Bếp Nhà AI'}
      className="group fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-forest text-white shadow-lg shadow-forest/25 transition duration-300 hover:scale-105 hover:bg-sage-700 md:bottom-7 md:right-7"
    >
      {!isOpen && (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-sage-500 opacity-20" />
          <Bot
            size={27}
            className="relative transition-transform duration-300 group-hover:rotate-6"
          />
        </>
      )}

      {isOpen && <X size={23} />}
    </button>
  )
}