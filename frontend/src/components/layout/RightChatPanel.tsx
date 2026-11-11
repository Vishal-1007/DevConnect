import { useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { avatarUrl } from '../../lib/avatar'
import { useAppSelector } from '../../hooks'
import { useGetMyProfileQuery } from '../../api/userApi'
import { useListMessagesQuery, useSendMessageMutation } from '../../api/chatApi'
import { useMatchFlow } from '../../hooks/useMatchFlow'
import { formatMessageTime } from '../../lib/formatTime'
import { extractApiError } from '../../lib/extractApiError'

export function RightChatPanel() {
  const [tab, setTab] = useState<'chat' | 'details'>('chat')
  const [message, setMessage] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const account = useAppSelector((s) => s.auth.account)
  const accountId = account?.id
  const { data: profile } = useGetMyProfileQuery()
  const userName = profile?.displayName ?? account?.username ?? 'You'
  const { session, endSession } = useMatchFlow()
  const partner = session.partner
  const conversationId = session.conversationId

  const { data: messages, isLoading, isError, error: loadError } = useListMessagesQuery(
    { conversationId: conversationId! },
    {
      skip: !conversationId,
      pollingInterval: conversationId ? 3000 : 0,
    }
  )
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation()

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!conversationId || !message.trim() || sending) return
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
    <aside className="w-[300px] shrink-0 flex flex-col h-full bg-[#12131c] border-l border-[#2d2e3e]">
      <div className="flex border-b border-[#2d2e3e]">
        {(['chat', 'details'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'text-white border-b-2 border-[#6366f1]'
                : 'text-[#8b8ca8] hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'chat' ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!conversationId && (
              <p className="text-sm text-[#8b8ca8] text-center py-8">
                Click <span className="text-white font-medium">Find Match</span> on this page to connect and start chatting.
              </p>
            )}
            {conversationId && isError && (
              <p className="text-sm text-red-400 text-center py-4">
                {extractApiError(loadError)}. Is chat-service running on port 8083?
              </p>
            )}
            {conversationId && isLoading && (
              <p className="text-sm text-[#8b8ca8]">Loading messages…</p>
            )}
            {conversationId &&
              sortedMessages.map((msg) => {
                const isMine = msg.senderId === accountId
                const senderName = isMine
                  ? userName
                  : partner?.displayName ?? 'Partner'
                return (
                  <div key={msg.id} className="flex gap-2">
                    <img
                      src={avatarUrl(senderName, 32)}
                      alt=""
                      className="w-8 h-8 rounded-full shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-white">{senderName}</span>
                        <span className="text-[10px] text-[#5c5d72]">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-[#b4b5c8] mt-0.5 leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                )
              })}
            {conversationId && sortedMessages.length === 0 && !isLoading && (
              <p className="text-sm text-[#8b8ca8] text-center py-4">
                No messages yet. Say hello!
              </p>
            )}
          </div>

          <div className="p-3 border-t border-[#2d2e3e] space-y-2">
            {sendError && <p className="text-xs text-red-400">{sendError}</p>}
            <form
              onSubmit={handleSend}
              className="flex gap-2 items-center bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={conversationId ? 'Type a message...' : 'Find a match first...'}
                disabled={!conversationId || sending}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[#5c5d72] focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!conversationId || !message.trim() || sending}
                className="p-1.5 rounded-lg dc-gradient-btn text-white disabled:opacity-40"
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 p-4 text-sm text-[#8b8ca8] space-y-3">
          {partner ? (
            <>
              <p className="text-white font-medium">{partner.displayName}</p>
              <p>{partner.role ?? 'Developer'}</p>
              {partner.bio && <p className="text-[#b4b5c8]">{partner.bio}</p>}
              {session.matchRequestId && (
                <p className="text-xs text-[#5c5d72]">
                  Match request: {session.matchRequestId.slice(0, 8)}…
                </p>
              )}
            </>
          ) : (
            <p>Session details will appear after you find a match.</p>
          )}
        </div>
      )}

      <div className="p-4 border-t border-[#2d2e3e] space-y-3">
        <p className="text-xs font-semibold text-[#8b8ca8] uppercase tracking-wide">
          In this room ({partner ? 2 : 1})
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <img src={avatarUrl(userName, 28)} alt="" className="w-7 h-7 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-[#8b8ca8]">{profile?.role ?? 'Learner'}</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          {partner && (
            <div className="flex items-center gap-2">
              <img
                src={avatarUrl(partner.displayName, 28)}
                alt=""
                className="w-7 h-7 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{partner.displayName}</p>
                <p className="text-xs text-[#8b8ca8]">{partner.role ?? 'Match'}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>
        {partner && (
          <button
            type="button"
            onClick={endSession}
            className="w-full py-2.5 rounded-lg border border-red-500/60 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors"
          >
            Leave Room
          </button>
        )}
      </div>
    </aside>
  )
}
