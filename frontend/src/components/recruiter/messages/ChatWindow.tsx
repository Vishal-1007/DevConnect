import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, BadgeCheck, MoreHorizontal, Paperclip, Phone, Send, Smile, Star, Video,
} from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import type { RecruiterConversation } from '../../../data/recruiterMessagesData'

type Props = {
  conversation: RecruiterConversation | null
  starred: boolean
  onSend: (text: string) => void
  canSend?: boolean
  onToggleStar: () => void
  onBack?: () => void
  className?: string
}

export function ChatWindow({
  conversation,
  starred,
  onSend,
  canSend = true,
  onToggleStar,
  onBack,
  className = '',
}: Props) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages.length])

  if (!conversation) {
    return (
      <div className={`flex flex-1 flex-col items-center justify-center bg-[#0b0c14]/40 ${className}`}>
        <p className="text-sm text-[#8b8ca8]">Select a conversation to start messaging</p>
      </div>
    )
  }

  function handleSend() {
    if (!draft.trim()) return
    onSend(draft)
    setDraft('')
  }

  return (
    <div className={`flex flex-1 flex-col bg-[#0b0c14]/40 ${className}`}>
      <div className="flex items-center justify-between border-b border-[#2d2e3e]/60 bg-[#161722]/60 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg p-1.5 text-[#8b8ca8] hover:bg-white/5 hover:text-white md:hidden"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
            {conversation.candidateAvatar}
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
              {conversation.candidateName}
              {conversation.verified && <BadgeCheck size={14} className="text-blue-400" />}
            </p>
            <p className="text-xs text-[#8b8ca8]">
              {conversation.role}
              <span className="ml-2 font-medium text-emerald-400">DevScore {conversation.devScore}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] hover:text-white" title="Video call">
            <Video size={16} />
          </button>
          <button type="button" className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] hover:text-white" title="Voice call">
            <Phone size={16} />
          </button>
          <button
            type="button"
            onClick={onToggleStar}
            className={`rounded-lg border border-[#2d2e3e] bg-white/5 p-2 hover:text-white ${
              starred ? 'text-amber-400' : 'text-[#8b8ca8]'
            }`}
            title="Star candidate"
          >
            <Star size={16} fill={starred ? 'currentColor' : 'none'} />
          </button>
          <button type="button" className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] hover:text-white" title="More">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {conversation.messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            candidateAvatar={conversation.candidateAvatar}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[#2d2e3e]/60 bg-[#161722]/60 p-4 backdrop-blur-md">
        {!canSend && (
          <p className="mb-2 text-xs text-amber-300">
            Upgrade to continue messaging candidates
          </p>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-[#2d2e3e] bg-white/5 p-2.5 text-[#8b8ca8] hover:text-white"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <div className="relative flex-1">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={canSend ? 'Type a message...' : 'Message limit reached'}
              disabled={!canSend}
              className="w-full rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-4 py-3 pr-10 text-sm text-white focus:border-violet-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8ca8] hover:text-white"
              title="Emoji"
            >
              <Smile size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim() || !canSend}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white transition hover:opacity-90 disabled:opacity-40"
            title="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
