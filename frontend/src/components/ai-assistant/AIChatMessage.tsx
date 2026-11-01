import { Bot, User } from 'lucide-react'

interface AIChatMessageProps {
  role: 'user' | 'model'
  content: string
}

export default function AIChatMessage({
  role,
  content,
}: AIChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div
      className={`flex items-start gap-2.5 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-sage-100 text-forest'
            : 'bg-forest text-white'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={17} />}
      </div>

      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm bg-forest text-white'
            : 'rounded-tl-sm bg-white text-gray-700 shadow-sm'
        }`}
      >
        {content}
      </div>
    </div>
  )
}