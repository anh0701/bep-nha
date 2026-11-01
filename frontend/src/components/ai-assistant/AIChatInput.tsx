import { useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'

interface AIChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export default function AIChatInput({
  onSend,
  disabled = false,
}: AIChatInputProps) {
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = message.trim()

    if (!value || disabled) {
      return
    }

    onSend(value)
    setMessage('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-sage-100 bg-white p-3"
    >
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }
        }}
        placeholder="Nhập câu hỏi của bạn..."
        rows={1}
        disabled={disabled}
        className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-sage-200 bg-cream px-3 py-2.5 text-sm text-forest outline-none transition focus:border-sage-500 disabled:opacity-60"
      />

      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest text-white transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Gửi tin nhắn"
      >
        <Send size={17} />
      </button>
    </form>
  )
}