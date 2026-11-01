import { Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

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
        className={`max-w-[85%] min-w-0 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'whitespace-pre-wrap rounded-tr-sm bg-forest text-white'
            : 'rounded-tl-sm bg-white text-gray-700 shadow-sm'
        }`}
      >
        {isUser ? (
          content
        ) : (
          <div className="ai-markdown break-words">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0">
                    {children}
                  </p>
                ),

                strong: ({ children }) => (
                  <strong className="font-semibold text-forest">
                    {children}
                  </strong>
                ),

                ul: ({ children }) => (
                  <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0">
                    {children}
                  </ul>
                ),

                ol: ({ children }) => (
                  <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0">
                    {children}
                  </ol>
                ),

                li: ({ children }) => (
                  <li className="pl-1">
                    {children}
                  </li>
                ),

                h1: ({ children }) => (
                  <h1 className="mb-2 text-lg font-bold text-forest">
                    {children}
                  </h1>
                ),

                h2: ({ children }) => (
                  <h2 className="mb-2 text-base font-bold text-forest">
                    {children}
                  </h2>
                ),

                h3: ({ children }) => (
                  <h3 className="mb-2 font-semibold text-forest">
                    {children}
                  </h3>
                ),

                blockquote: ({ children }) => (
                  <blockquote className="my-3 border-l-2 border-sage-400 pl-3 text-gray-600">
                    {children}
                  </blockquote>
                ),

                code: ({ children }) => (
                  <code className="rounded bg-sage-100 px-1 py-0.5 text-xs text-forest">
                    {children}
                  </code>
                ),

                hr: () => (
                  <hr className="my-3 border-sage-200" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}