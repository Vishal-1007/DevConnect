import { useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { avatarUrl } from '../../lib/avatar'
import { useAppSelector } from '../../hooks'
import { useGetMyProfileQuery } from '../../api/userApi'
import { useListMessagesQuery, useSendMessageMutation } from '../../api/chatApi'
import { formatMessageTime } from '../../lib/formatTime'
import { extractApiError } from '../../lib/extractApiError'
import type { MatchPartner } from '../../store/matchSessionSlice'

interface InterviewChatPanelProps {
  conversationId: string
  partner: MatchPartner
}

export function InterviewChatPanel({ conversationId, partner }: InterviewChatPanelProps) {
  const [message, setMessage] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const accountId = useAppSelector((s) => s.auth.account?.id)
  const { data: profile } = useGetMyProfileQuery()
  const userName = profile?.displayName ?? 'You'

  const { data: messages, isLoading } = useListMessagesQuery(
    { conversationId },
    { pollingInterval: 3000 }
  )
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation()

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!message.trim() || sending) return
    setSendError(null)
    try {
      await sendMessage({ conversationId, content: message.trim() }).unwrap()
      setMessage('')
    } catch (err) {
      setSendError(extractApiError(err))
    }
  }

  const sortedMessages = messages?.slice().reverse() ?? []

  return (
    <div className="flex flex-col h-full min-h-[320px] rounded-xl bg-[#12131c] border border-[#2d2e3e]">
      <div className="px-4 py-3 border-b border-[#2d2e3e]">
        <p className="text-sm font-semibold text-white">Interview chat</p>
        <p className="text-xs text-[#8b8ca8]">Ask clarifying questions to {partner.displayName}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && <p className="text-sm text-[#8b8ca8]">Loading messages…</p>}
        {sortedMessages.map((msg) => {
          const isMine = msg.senderId === accountId
          const senderName = isMine ? userName : partner.displayName
          return (
            <div key={msg.id} className="flex gap-2">
              <img src={avatarUrl(senderName, 28)} alt="" className="w-7 h-7 rounded-full shrink-0" />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-white">{senderName}</span>
                  <span className="text-[10px] text-[#5c5d72]">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-[#b4b5c8] mt-0.5">{msg.content}</p>
              </div>
            </div>
          )
        })}
        {!isLoading && sortedMessages.length === 0 && (
          <p className="text-sm text-[#8b8ca8] text-center py-6">
            Introduce yourself to start the mock interview.
          </p>
        )}
      </div>

      <div className="p-3 border-t border-[#2d2e3e] space-y-2">
        {sendError && <p className="text-xs text-red-400">{sendError}</p>}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message…"
            disabled={sending}
            className="flex-1 h-9 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-sm text-white placeholder:text-[#5c5d72] focus:outline-none focus:border-[#6366f1]"
          />
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="p-2 rounded-lg dc-gradient-btn text-white disabled:opacity-40"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
