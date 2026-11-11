import { BadgeCheck } from 'lucide-react'
import type { RecruiterConversation } from '../../../data/recruiterMessagesData'

type Props = {
  conversation: RecruiterConversation
  selected: boolean
  onSelect: () => void
}

export function ConversationCard({ conversation, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full gap-3 rounded-xl border p-3 text-left transition ${
        selected
          ? 'border-violet-500/40 bg-gradient-to-r from-[#6366f1]/20 to-[#a855f7]/15'
          : 'border-transparent bg-white/[0.02] hover:border-[#2d2e3e] hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
        {conversation.candidateAvatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="flex items-center gap-1 truncate text-sm font-semibold text-white">
            {conversation.candidateName}
            {conversation.verified && <BadgeCheck size={13} className="shrink-0 text-blue-400" />}
          </p>
          <span className="shrink-0 text-[10px] text-[#8b8ca8]">{conversation.lastMessageTime}</span>
        </div>
        <p className="truncate text-[11px] text-[#8b8ca8]">{conversation.role}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-[#c4c5d6]">{conversation.lastMessage}</p>
          {conversation.unreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-1.5 text-[10px] font-bold text-white">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
