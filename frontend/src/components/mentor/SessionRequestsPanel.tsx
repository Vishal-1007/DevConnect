/**
 * SessionRequestsPanel — incoming mentorship request queue for mentors.
 */
import { useMemo, useState } from 'react'
import {
  RefreshCw, CheckCircle2, XCircle, Clock, MessageSquare, CalendarDays,
  Crown, Loader2, Send, X, Filter, Inbox, Star, Code2, Briefcase,
  Layers, GraduationCap,
} from 'lucide-react'
import {
  useGetMentorSessionRequestsQuery,
  useConfirmMentorBookingMutation,
  useCancelMentorBookingMutation,
  useRescheduleMentorBookingMutation,
  type MentorPendingRequest,
} from '../../api/mentorWorkspaceApi'
import {
  useCreateConversationMutation,
  useListMessagesQuery,
  useSendMessageMutation,
} from '../../api/chatApi'

type FilterType = 'all' | 'mock-interview' | 'career-guidance' | 'project-help' | 'code-review' | 'system-design'

const FILTER_OPTIONS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All Requests' },
  { id: 'mock-interview', label: 'Mock Interview' },
  { id: 'career-guidance', label: 'Career Guidance' },
  { id: 'project-help', label: 'Project Help' },
  { id: 'code-review', label: 'Code Review' },
  { id: 'system-design', label: 'System Design' },
]

const TYPE_META: Record<string, { icon: typeof Code2; color: string }> = {
  'mock-interview': { icon: Star, color: '#a78bfa' },
  'career-guidance': { icon: GraduationCap, color: '#06b6d4' },
  'project-help': { icon: Briefcase, color: '#10b981' },
  'code-review': { icon: Code2, color: '#f59e0b' },
  'system-design': { icon: Layers, color: '#818cf8' },
}

function Av({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 flex items-center justify-center shrink-0 font-bold text-violet-300"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  )
}

function Pill({ children, color }: { children: React.ReactNode; color: 'amber' | 'green' | 'violet' | 'gray' | 'gold' }) {
  const cls = {
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8] border-[#3d3e52]',
    gold: 'bg-amber-400/15 text-amber-200 border-amber-400/30',
  }[color]
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {children}
    </span>
  )
}

function ChatModal({ req, onClose }: { req: MentorPendingRequest; onClose: () => void }) {
  const [createConversation, { isLoading: creating }] = useCreateConversationMutation()
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [draft, setDraft] = useState(`Hi ${req.learnerName}, I saw your request about "${req.topic}". Happy to help — when works best for you?`)
  const [started, setStarted] = useState(false)

  const { data: messages = [] } = useListMessagesQuery(
    { conversationId: conversationId ?? '', limit: 50 },
    { skip: !conversationId, pollingInterval: 4000 },
  )

  async function openChat() {
    if (conversationId) return
    setStarted(true)
    try {
      const conv = await createConversation({ participantIds: [req.learnerId] }).unwrap()
      setConversationId(conv.id)
      await sendMessage({
        conversationId: conv.id,
        content: draft,
      }).unwrap()
    } catch {
      setStarted(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#161722] border border-[#2d2e3e] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2e3e]">
          <div>
            <h3 className="text-sm font-bold text-white">Chat with {req.learnerName}</h3>
            <p className="text-[10px] text-[#5c5d72]">Discuss before accepting the session</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2d2e3e] text-[#8b8ca8]">
            <X size={16} />
          </button>
        </div>

        {!conversationId ? (
          <div className="p-5 space-y-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-xl p-3 text-sm text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500/50 resize-none"
            />
            <button
              onClick={openChat}
              disabled={creating || !draft.trim()}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-lg"
            >
              {creating || started ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send Message
            </button>
          </div>
        ) : (
          <>
            <div className="h-56 overflow-y-auto p-4 space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={`text-xs rounded-lg px-3 py-2 max-w-[85%] ${
                  m.senderId === req.learnerId
                    ? 'bg-[#1c1d2a] text-[#a5a6bb] mr-auto'
                    : 'bg-violet-600/20 text-violet-100 ml-auto'
                }`}>
                  {m.content}
                </div>
              ))}
            </div>
            <form
              className="flex gap-2 p-4 border-t border-[#2d2e3e]"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!draft.trim() || !conversationId) return
                await sendMessage({ conversationId, content: draft }).unwrap()
                setDraft('')
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/50"
              />
              <button type="submit" disabled={sending} className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white">
                <Send size={14} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function RescheduleModal({
  req,
  onClose,
  onSaved,
}: {
  req: MentorPendingRequest
  onClose: () => void
  onSaved: () => void
}) {
  const [reschedule, { isLoading }] = useRescheduleMentorBookingMutation()
  const defaultDate = new Date(req.scheduledAt)
  defaultDate.setDate(defaultDate.getDate() + 1)
  const [datetime, setDatetime] = useState(defaultDate.toISOString().slice(0, 16))
  const [confirmNow, setConfirmNow] = useState(false)

  async function save() {
    await reschedule({
      bookingId: req.bookingId,
      scheduledAt: new Date(datetime).toISOString(),
      confirmImmediately: confirmNow,
    }).unwrap()
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#161722] border border-[#2d2e3e] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2e3e]">
          <div>
            <h3 className="text-sm font-bold text-white">Schedule Session</h3>
            <p className="text-[10px] text-[#5c5d72]">{req.topic}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2d2e3e] text-[#8b8ca8]">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] text-[#5c5d72] mb-1">New date & time</label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-[#8b8ca8] cursor-pointer">
            <input type="checkbox" checked={confirmNow} onChange={(e) => setConfirmNow(e.target.checked)} className="rounded" />
            Confirm booking immediately (accept & schedule)
          </label>
          <button
            onClick={save}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-lg"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CalendarDays size={14} />}
            Save Schedule
          </button>
        </div>
      </div>
    </div>
  )
}

export function SessionRequestsPanel() {
  const { data: requests = [], isLoading, refetch, isFetching } = useGetMentorSessionRequestsQuery(undefined, {
    pollingInterval: 30_000,
  })
  const [confirmBooking] = useConfirmMentorBookingMutation()
  const [cancelBooking] = useCancelMentorBookingMutation()
  const [filter, setFilter] = useState<FilterType>('all')
  const [premiumOnly, setPremiumOnly] = useState(false)
  const [chatReq, setChatReq] = useState<MentorPendingRequest | null>(null)
  const [rescheduleReq, setRescheduleReq] = useState<MentorPendingRequest | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = [...requests]
    if (filter !== 'all') list = list.filter((r) => r.requestType === filter)
    if (premiumOnly) list = list.filter((r) => r.premiumLearner)
    return list.sort((a, b) => b.priorityScore - a.priorityScore || b.requestedAt.localeCompare(a.requestedAt))
  }, [requests, filter, premiumOnly])

  const premiumCount = requests.filter((r) => r.premiumLearner).length

  async function handleAccept(id: string) {
    setActionId(id)
    try {
      await confirmBooking(id).unwrap()
    } finally {
      setActionId(null)
    }
  }

  async function handleDecline(id: string) {
    setActionId(id)
    try {
      await cancelBooking(id).unwrap()
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats + filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: requests.length, color: 'text-amber-400' },
          { label: 'Premium', value: premiumCount, color: 'text-amber-200' },
          { label: 'Mock Interviews', value: requests.filter((r) => r.requestType === 'mock-interview').length, color: 'text-violet-400' },
          { label: 'Code Reviews', value: requests.filter((r) => r.requestType === 'code-review').length, color: 'text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3.5">
            <p className="text-[10px] text-[#5c5d72] mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-[#5c5d72]" />
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              filter === f.id
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:bg-[#1c1d2a]'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setPremiumOnly((v) => !v)}
          className={`ml-auto flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
            premiumOnly ? 'bg-amber-500/15 border-amber-500/30 text-amber-200' : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
          }`}
        >
          <Crown size={11} /> Premium First
        </button>
        <button
          onClick={() => refetch()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white"
        >
          {isFetching ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        </button>
      </div>

      {/* Queue */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox size={40} className="text-[#3d3e52] mb-3" />
          <p className="text-sm font-semibold text-[#8b8ca8]">No pending requests</p>
          <p className="text-xs text-[#5c5d72] mt-1 max-w-sm">
            Learner requests for mock interviews, career guidance, code reviews, and more will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const meta = TYPE_META[req.requestType] ?? TYPE_META['project-help']
            const Icon = meta.icon
            const busy = actionId === req.bookingId
            return (
              <div
                key={req.bookingId}
                className={`bg-[#161722] border rounded-xl p-5 transition-colors ${
                  req.premiumLearner ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-[#2d2e3e] hover:border-[#3d3e52]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <Av name={req.learnerName} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ color: meta.color, background: `${meta.color}18` }}
                      >
                        <Icon size={11} /> {req.requestTypeLabel}
                      </span>
                      <Pill color="amber">Pending</Pill>
                      {req.premiumLearner && (
                        <Pill color="gold"><Crown size={9} /> Premium</Pill>
                      )}
                      <Pill color="gray">{req.bookingCode}</Pill>
                      <span className="ml-auto text-[10px] text-[#5c5d72]">{req.requestedAtLabel}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1">{req.topic}</h3>
                    <p className="text-xs text-[#8b8ca8] mb-3 leading-relaxed italic">"{req.message}"</p>

                    <div className="flex items-center gap-4 text-[10px] text-[#5c5d72] mb-4 flex-wrap">
                      <span className="text-white font-medium">{req.learnerName}</span>
                      <span>·</span>
                      <span>{req.scheduledAtLabel}</span>
                      <span>·</span>
                      <span>{req.durationMinutes} min</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-semibold">{req.amountLabel}</span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleAccept(req.bookingId)}
                        disabled={busy}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Accept Instantly
                      </button>
                      <button
                        onClick={() => setRescheduleReq(req)}
                        className="flex items-center gap-1.5 border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-600 hover:text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        <CalendarDays size={13} /> Schedule Later
                      </button>
                      <button
                        onClick={() => setChatReq(req)}
                        className="flex items-center gap-1.5 border border-[#2d2e3e] bg-[#1c1d2a] text-[#8b8ca8] hover:text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        <MessageSquare size={13} /> Chat First
                      </button>
                      <button
                        onClick={() => handleDecline(req.bookingId)}
                        disabled={busy}
                        className="flex items-center gap-1.5 border border-red-500/30 bg-[#1c1d2a] text-red-400 hover:bg-red-600 hover:text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        <XCircle size={13} /> Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {chatReq && <ChatModal req={chatReq} onClose={() => setChatReq(null)} />}
      {rescheduleReq && (
        <RescheduleModal
          req={rescheduleReq}
          onClose={() => setRescheduleReq(null)}
          onSaved={() => refetch()}
        />
      )}
    </div>
  )
}
