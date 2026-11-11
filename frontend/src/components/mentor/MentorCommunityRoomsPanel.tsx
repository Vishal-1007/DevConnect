/**
 * MentorCommunityRoomsPanel — create, join, host discussions, and moderate community rooms.
 */
import { useMemo, useState } from 'react'
import {
  Users2, Plus, RefreshCw, Loader2, Play, Monitor, Search, X, Check,
  MessageSquare, Shield, Sparkles, Hash, Crown,
} from 'lucide-react'
import {
  useListVideoRoomsQuery,
  useCreateVideoRoomMutation,
  useJoinVideoRoomMutation,
} from '../../api/videoRoomsApi'
import { VideoRoomSessionPanel } from '../video-rooms/VideoRoomSessionPanel'
import { useAppSelector } from '../../hooks'

type CategoryFilter = 'all' | string
type ViewFilter = 'all' | 'mine' | 'featured'

const CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'java', label: 'Java' },
  { id: 'ai', label: 'AI & ML' },
  { id: 'architecture', label: 'System Design' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'interview-prep', label: 'Interview Prep' },
  { id: 'career', label: 'Career' },
  { id: 'devops', label: 'DevOps' },
  { id: 'startup', label: 'Startup' },
]

const ROOM_TEMPLATES = [
  {
    title: 'Java Experts Room',
    description: 'Deep dives on Java, Spring Boot, JVM tuning, and backend craft.',
    category: 'java',
    tags: ['java', 'spring', 'experts'],
  },
  {
    title: 'AI Developers Room',
    description: 'LLMs, agents, RAG pipelines, and practical AI engineering.',
    category: 'ai',
    tags: ['ai', 'llm', 'engineering'],
  },
  {
    title: 'System Design Lounge',
    description: 'Architecture trade-offs, scalability patterns, and mock design sessions.',
    category: 'architecture',
    tags: ['system-design', 'architecture'],
  },
]

function Pill({ children, color }: { children: React.ReactNode; color: 'green' | 'violet' | 'amber' | 'gray' }) {
  const cls = {
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8] border-[#3d3e52]',
  }[color]
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {children}
    </span>
  )
}

export function MentorCommunityRoomsPanel() {
  const myId = useAppSelector((s) => s.auth.account?.id)
  const { data: rooms = [], isLoading, refetch, isFetching, isError } = useListVideoRoomsQuery({
    status: 'live',
    limit: 100,
  })
  const [createRoom, { isLoading: creating }] = useCreateVideoRoomMutation()
  const [joinRoom] = useJoinVideoRoomMutation()

  const [category, setCategory] = useState<CategoryFilter>('all')
  const [view, setView] = useState<ViewFilter>('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [activeSession, setActiveSession] = useState<{ roomId: string; moderate: boolean } | null>(null)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'java',
    maxParticipants: 12,
    chatEnabled: true,
    screenShareEnabled: true,
    breakoutEnabled: true,
  })

  const communityRooms = useMemo(
    () => rooms.filter((r) => ['community', 'teaching', 'workshop'].includes(r.useCase)),
    [rooms],
  )

  const filtered = useMemo(() => {
    let list = communityRooms
    if (view === 'mine' && myId) list = list.filter((r) => r.hostId === myId)
    if (view === 'featured') list = list.filter((r) => r.featured)
    if (category !== 'all') list = list.filter((r) => r.category === category)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q),
      )
    }
    return list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.title.localeCompare(b.title))
  }, [communityRooms, view, category, search, myId])

  const myRoomCount = useMemo(
    () => (myId ? communityRooms.filter((r) => r.hostId === myId).length : 0),
    [communityRooms, myId],
  )
  const totalMembers = useMemo(
    () => communityRooms.reduce((s, r) => s + r.participantCount, 0),
    [communityRooms],
  )

  async function enterRoom(roomId: string, moderate: boolean) {
    setJoiningId(roomId)
    try {
      await joinRoom(roomId).unwrap()
      setActiveSession({ roomId, moderate })
    } catch {
      /* join may fail if full — session panel shows error */
      setActiveSession({ roomId, moderate })
    } finally {
      setJoiningId(null)
    }
  }

  async function handleCreate() {
    if (!form.title.trim()) return
    setCreateError('')
    try {
      const room = await createRoom({
        title: form.title.trim(),
        description: form.description.trim() || `Community room for ${form.category} discussions and Q&A.`,
        category: form.category,
        roomType: 'public',
        useCase: 'community',
        maxParticipants: form.maxParticipants,
        chatEnabled: form.chatEnabled,
        screenShareEnabled: form.screenShareEnabled,
        breakoutEnabled: form.breakoutEnabled,
        tags: [form.category, 'community', 'mentor'],
      }).unwrap()
      setShowCreate(false)
      setForm((f) => ({ ...f, title: '', description: '' }))
      await enterRoom(room.id, true)
      refetch()
    } catch {
      setCreateError('Could not create room. Please try again.')
    }
  }

  function applyTemplate(t: (typeof ROOM_TEMPLATES)[0]) {
    setForm((f) => ({
      ...f,
      title: t.title,
      description: t.description,
      category: t.category,
    }))
    setShowCreate(true)
  }

  if (activeSession) {
    return (
      <div className="h-full min-h-[620px]">
        <VideoRoomSessionPanel
          roomId={activeSession.roomId}
          embedMode
          initialManageOpen={activeSession.moderate}
          onExit={() => { setActiveSession(null); refetch() }}
        />
      </div>
    )
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Live Rooms', value: communityRooms.length, icon: Users2, color: 'text-violet-400' },
          { label: 'My Rooms', value: myRoomCount, icon: Crown, color: 'text-amber-400' },
          { label: 'Active Members', value: totalMembers, icon: MessageSquare, color: 'text-emerald-400' },
          { label: 'Featured', value: communityRooms.filter((r) => r.featured).length, icon: Sparkles, color: 'text-cyan-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1"><Icon size={14} className={color} /><p className="text-[10px] text-[#5c5d72]">{label}</p></div>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Quick templates */}
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
        <p className="text-xs font-bold text-white mb-3">Quick-start templates</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ROOM_TEMPLATES.map((t) => (
            <button
              key={t.title}
              type="button"
              onClick={() => applyTemplate(t)}
              className="text-left p-3 rounded-lg border border-[#2d2e3e] hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
            >
              <p className="text-[11px] font-semibold text-white">{t.title}</p>
              <p className="text-[9px] text-[#5c5d72] mt-0.5 line-clamp-2">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms, topics, skills..."
            className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'mine', 'featured'] as ViewFilter[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`text-[10px] font-semibold px-3 py-2 rounded-lg border capitalize transition-colors ${
                view === v ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
              }`}
            >
              {v === 'mine' ? 'My Rooms' : v}
            </button>
          ))}
          <button type="button" onClick={() => refetch()} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white">
            {isFetching ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
          <button type="button" onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-2 rounded-lg">
            <Plus size={13} /> Create Room
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`text-[10px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              category === c.id ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-[#2d2e3e] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Create Community Room</h3>
              <button type="button" onClick={() => setShowCreate(false)} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] text-[#5c5d72]">Room name</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Java Experts Room"
                  className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-[10px] text-[#5c5d72]">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  placeholder="What will learners discuss here?"
                  className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#5c5d72]">Topic</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-2 py-2 text-xs text-white">
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#5c5d72]">Max members</label>
                  <input type="number" min={4} max={50} value={form.maxParticipants}
                    onChange={(e) => setForm({ ...form, maxParticipants: Number(e.target.value) })}
                    className="mt-1 w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'chatEnabled' as const, label: 'Live chat & Q&A' },
                  { key: 'screenShareEnabled' as const, label: 'Screen sharing' },
                  { key: 'breakoutEnabled' as const, label: 'Breakout rooms' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-xs text-[#8b8ca8] cursor-pointer">
                    <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
                    {label}
                  </label>
                ))}
              </div>
              {createError && <p className="text-xs text-red-400">{createError}</p>}
              <button type="button" onClick={handleCreate} disabled={creating || !form.title.trim()}
                className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2">
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Create & Host
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room grid */}
      {isError ? (
        <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
          <p className="text-sm font-semibold text-white">Could not load community rooms</p>
          <button type="button" onClick={() => refetch()} className="mt-3 text-xs text-violet-400 hover:text-violet-300">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
          <Users2 size={40} className="mx-auto text-[#3d3e52] mb-3" />
          <p className="text-sm font-semibold text-white">No community rooms found</p>
          <p className="text-xs text-[#5c5d72] mt-1 mb-4">Create a room to host discussions and answer learner questions.</p>
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">
            <Plus size={12} /> Create Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((room) => {
            const isMine = room.hostId === myId
            const isMod = room.moderatorId === myId
            const canModerate = isMine || isMod
            const busy = joiningId === room.id
            return (
              <div key={room.id} className={`bg-[#161722] border rounded-xl p-4 hover:border-[#3d3e52] transition-colors ${room.featured ? 'border-violet-500/30' : 'border-[#2d2e3e]'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
                    <Users2 size={16} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white truncate">{room.title}</p>
                      {room.featured && <Pill color="violet"><Sparkles size={8} /> Featured</Pill>}
                      {isMine && <Pill color="amber"><Crown size={8} /> Host</Pill>}
                    </div>
                    <p className="text-[10px] text-[#5c5d72] flex items-center gap-1 mt-0.5">
                      <Hash size={9} />{room.category} · {room.participantCount}/{room.maxParticipants} members
                    </p>
                    <p className="text-[9px] text-[#5c5d72] mt-0.5">Hosted by {room.hostDisplayName}</p>
                  </div>
                  <Pill color="green"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE</Pill>
                </div>
                <p className="text-xs text-[#8b8ca8] mb-3 line-clamp-2">{room.description}</p>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {room.chatEnabled && <Pill color="gray"><MessageSquare size={8} /> Q&A</Pill>}
                  {room.screenShareEnabled && <Pill color="gray"><Monitor size={8} /> Share</Pill>}
                  {room.breakoutEnabled && <Pill color="gray">Breakouts</Pill>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy || room.full}
                    onClick={() => enterRoom(room.id, false)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white transition-colors"
                  >
                    {busy ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                    {room.full ? 'Full' : 'Join'}
                  </button>
                  <button
                    type="button"
                    disabled={busy || !canModerate}
                    onClick={() => enterRoom(room.id, true)}
                    title={canModerate ? 'Open moderation controls' : 'Only the room host can moderate'}
                    className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                      canModerate
                        ? 'border-violet-500/40 text-violet-300 hover:bg-violet-500/10'
                        : 'border-[#2d2e3e] text-[#5c5d72] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Shield size={12} /> Moderate
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
