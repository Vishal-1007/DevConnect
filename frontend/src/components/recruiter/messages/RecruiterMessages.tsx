import { useEffect, useMemo, useState } from 'react'
import { ChatSidebar } from './ChatSidebar'
import { ChatWindow } from './ChatWindow'
import { CandidateInfoPanel } from './CandidateInfoPanel'
import { CandidateProfileView } from '../CandidateProfileView'
import { ScheduleInterviewModal } from '../interviews/ScheduleInterviewModal'
import { RECRUITER_CANDIDATES } from '../../../data/recruiterData'
import {
  filterConversations,
  getUnreadTotal,
  loadRecruiterConversations,
  markConversationRead,
  saveConversationNotes,
  sendMessage,
  toggleConversationStar,
  type ConversationTab,
} from '../../../lib/recruiterMessagesStore'
import { useSubscription } from '../../../contexts/SubscriptionContext'

type MobileView = 'list' | 'chat' | 'details'

export function RecruiterMessages() {
  const { consumeUsage, canUse } = useSubscription()
  const [conversations, setConversations] = useState(() => loadRecruiterConversations())
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null)
  const [activeTab, setActiveTab] = useState<ConversationTab>('all')
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState('')
  const [mobileView, setMobileView] = useState<MobileView>('list')
  const [showProfile, setShowProfile] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  const filtered = useMemo(
    () => filterConversations(conversations, activeTab, search),
    [conversations, activeTab, search],
  )

  const unreadTotal = useMemo(() => getUnreadTotal(conversations), [conversations])

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  )

  const profileCandidate = useMemo(
    () => RECRUITER_CANDIDATES.find((c) => c.id === selected?.candidateId) ?? null,
    [selected?.candidateId],
  )

  useEffect(() => {
    if (selected) {
      setNotes(selected.recruiterNotes ?? '')
      if (selected.unreadCount > 0) {
        setConversations((prev) => markConversationRead(prev, selected.id))
      }
    }
  }, [selected?.id])

  function handleSelect(id: string) {
    setSelectedId(id)
    setMobileView('chat')
  }

  async function handleSend(text: string) {
    if (!selectedId) return
    const allowed = await consumeUsage('MESSAGE')
    if (!allowed) return
    setConversations((prev) => sendMessage(prev, selectedId, text))
  }

  function handleToggleStar() {
    if (!selectedId) return
    setConversations((prev) => toggleConversationStar(prev, selectedId))
  }

  function handleSaveNotes() {
    if (!selectedId) return
    setConversations((prev) => saveConversationNotes(prev, selectedId, notes))
  }

  const showList = mobileView === 'list'
  const showChat = mobileView === 'chat'
  const showDetails = mobileView === 'details'

  return (
    <>
      <div className="flex h-[calc(100vh-8.5rem)] min-h-[520px] overflow-hidden rounded-2xl border border-[#2d2e3e]/80">
        <ChatSidebar
          conversations={filtered}
          selectedId={selectedId}
          activeTab={activeTab}
          search={search}
          unreadTotal={unreadTotal}
          onTabChange={setActiveTab}
          onSearchChange={setSearch}
          onSelect={handleSelect}
          className={`w-full shrink-0 border-r md:w-[280px] lg:w-[300px] ${
            showList ? 'flex' : 'hidden md:flex'
          }`}
        />

        <ChatWindow
          conversation={selected}
          starred={selected?.starred ?? false}
          onSend={handleSend}
          canSend={canUse('MESSAGE')}
          onToggleStar={handleToggleStar}
          onBack={() => setMobileView('list')}
          className={`min-w-0 flex-1 ${
            showChat ? 'flex' : showList ? 'hidden md:flex' : 'hidden md:flex'
          }`}
        />

        <CandidateInfoPanel
          conversation={selected}
          notes={notes}
          onNotesChange={setNotes}
          onSaveNotes={handleSaveNotes}
          onViewProfile={() => setShowProfile(true)}
          onViewApplication={() => {}}
          onScheduleInterview={() => setShowScheduleModal(true)}
          onBack={() => setMobileView('chat')}
          className={`w-full shrink-0 xl:w-[300px] ${
            showDetails ? 'flex md:hidden xl:flex' : 'hidden xl:flex'
          }`}
        />
      </div>

      {selected && showChat && (
        <button
          type="button"
          onClick={() => setMobileView('details')}
          className="mt-3 w-full rounded-xl border border-[#2d2e3e] bg-white/5 py-2 text-sm text-[#8b8ca8] hover:text-white xl:hidden"
        >
          View candidate details
        </button>
      )}

      {showProfile && profileCandidate && (
        <CandidateProfileView
          candidate={profileCandidate}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showScheduleModal && (
        <ScheduleInterviewModal
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => setShowScheduleModal(false)}
        />
      )}
    </>
  )
}
