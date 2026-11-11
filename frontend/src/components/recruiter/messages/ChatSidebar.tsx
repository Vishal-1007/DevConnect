import { Search, SlidersHorizontal } from 'lucide-react'
import { ConversationCard } from './ConversationCard'
import type { RecruiterConversation } from '../../../data/recruiterMessagesData'
import type { ConversationTab } from '../../../lib/recruiterMessagesStore'

type Props = {
  conversations: RecruiterConversation[]
  selectedId: string | null
  activeTab: ConversationTab
  search: string
  unreadTotal: number
  onTabChange: (tab: ConversationTab) => void
  onSearchChange: (q: string) => void
  onSelect: (id: string) => void
  onBack?: () => void
  className?: string
}

const TABS: { id: ConversationTab; label: string; showCount?: boolean }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread', showCount: true },
  { id: 'starred', label: 'Starred' },
]

export function ChatSidebar({
  conversations,
  selectedId,
  activeTab,
  search,
  unreadTotal,
  onTabChange,
  onSearchChange,
  onSelect,
  className = '',
}: Props) {
  return (
    <aside
      className={`flex flex-col border-[#2d2e3e]/80 bg-[#161722]/60 backdrop-blur-md ${className}`}
    >
      <div className="border-b border-[#2d2e3e]/60 px-4 py-4">
        <h2 className="text-base font-bold text-white">Messages</h2>
        <div className="mt-3 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#6366f1]/25 to-[#a855f7]/20 text-white'
                  : 'text-[#8b8ca8] hover:text-white'
              }`}
            >
              {tab.label}
              {tab.showCount && unreadTotal > 0 && (
                <span className="ml-1 text-violet-300">({unreadTotal})</span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8ca8]" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search candidates..."
              className="w-full rounded-xl border border-[#2d2e3e] bg-[#0b0c14] py-2 pl-9 pr-3 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            className="rounded-xl border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] hover:text-white"
            title="Filter"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-[#8b8ca8]">No conversations found.</p>
        ) : (
          conversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conversation={conv}
              selected={conv.id === selectedId}
              onSelect={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>
    </aside>
  )
}
