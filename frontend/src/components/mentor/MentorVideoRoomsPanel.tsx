/**
 * MentorVideoRoomsPanel — video room lobby and session management for mentors.
 */
import { useMemo, useState } from 'react'
import {
  Video, Play, Plus, RefreshCw, Loader2, Eye, Users, Lock, Globe,
  GraduationCap, Briefcase, Layers, Settings,
} from 'lucide-react'
import {
  useListVideoRoomsQuery,
  useCreateVideoRoomMutation,
  useJoinVideoRoomMutation,
} from '../../api/videoRoomsApi'
import { VideoRoomSessionPanel } from '../video-rooms/VideoRoomSessionPanel'

type RoomTypeFilter = 'all' | 'public' | 'private' | 'interview' | 'study'

const ROOM_TYPES = [
  { id: 'public' as const, label: 'Public Room', icon: Globe, sub: 'Open community discussions' },
  { id: 'private' as const, label: 'Private Room', icon: Lock, sub: 'Invite-only mentoring' },
  { id: 'interview' as const, label: 'Interview Room', icon: Briefcase, sub: 'Mock interviews & assessments' },
  { id: 'study' as const, label: 'Study Group', icon: GraduationCap, sub: 'Group learning sessions' },
]

const FILTER_TABS: { id: RoomTypeFilter; label: string }[] = [
  { id: 'all', label: 'All Rooms' },
  { id: 'public', label: 'Public' },
  { id: 'private', label: 'Private' },
  { id: 'interview', label: 'Interview' },
  { id: 'study', label: 'Study Groups' },
]

function roomTypeLabel(roomType: string, useCase: string) {
  if (roomType === 'private') return 'Private'
  if (useCase === 'interview' || roomType === 'interview') return 'Interview'
  if (useCase === 'study' || roomType === 'study') return 'Study Group'
  return 'Public'
}

function Pill({ children, color }: { children: React.ReactNode; color: 'green' | 'violet' | 'gray' | 'blue' }) {
  const cls = {
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8] border-[#3d3e52]',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  }[color]
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {children}
    </span>
  )
}

export function MentorVideoRoomsPanel() {
  const { data: rooms = [], isLoading, refetch, isFetching } = useListVideoRoomsQuery({ status: 'live', limit: 100 })
  const [createRoom] = useCreateVideoRoomMutation()
  const [joinRoom] = useJoinVideoRoomMutation()

  const [filter, setFilter] = useState<RoomTypeFilter>('all')
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    roomType: 'public' as 'public' | 'private' | 'interview' | 'study',
    category: 'Mentorship',
    maxParticipants: 12,
    breakoutEnabled: true,
    chatEnabled: true,
    screenShareEnabled: true,
  })

  const filtered = useMemo(() => {
    if (filter === 'all') return rooms
    return rooms.filter((r) => {
      if (filter === 'public') return r.roomType === 'public' || r.visibility === 'public'
      if (filter === 'private') return r.roomType === 'private'
      if (filter === 'interview') return r.useCase === 'interview' || r.roomType === 'interview'
      return r.useCase === 'study' || r.roomType === 'study' || r.category?.toLowerCase().includes('study')
    })
  }, [rooms, filter])

  async function handleJoin(roomId: string) {
    setJoiningId(roomId)
    try {
      await joinRoom(roomId).unwrap()
      setActiveRoomId(roomId)
    } finally {
      setJoiningId(null)
    }
  }

  async function handleCreate() {
    if (!form.title.trim()) return
    const useCase = form.roomType === 'interview' ? 'interview' : form.roomType === 'study' ? 'study' : 'community'
    const room = await createRoom({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      roomType: form.roomType === 'study' ? 'public' : form.roomType,
      useCase,
      maxParticipants: form.maxParticipants,
      breakoutEnabled: form.breakoutEnabled,
      chatEnabled: form.chatEnabled,
      screenShareEnabled: form.screenShareEnabled,
    }).unwrap()
    setShowForm(false)
    setForm((f) => ({ ...f, title: '', description: '' }))
    await joinRoom(room.id).unwrap()
    setActiveRoomId(room.id)
    refetch()
  }

  if (activeRoomId) {
    return (
      <div className="h-full min-h-[600px]">
        <VideoRoomSessionPanel
          roomId={activeRoomId}
          embedMode
          onExit={() => { setActiveRoomId(null); refetch() }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Live Rooms', value: rooms.length, icon: Video },
          { label: 'Public', value: rooms.filter((r) => r.roomType === 'public').length, icon: Globe },
          { label: 'Interview', value: rooms.filter((r) => r.useCase === 'interview').length, icon: Briefcase },
          { label: 'Study Groups', value: rooms.filter((r) => r.useCase === 'study').length, icon: GraduationCap },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <Icon size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] text-[#5c5d72]">{label}</p>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              filter === t.id
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:bg-[#1c1d2a]'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white"
          >
            {isFetching ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
          >
            <Plus size={13} /> Create Room
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings size={14} className="text-violet-400" /> Create Video Room
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {ROOM_TYPES.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, roomType: t.id }))}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    form.roomType === t.id
                      ? 'bg-violet-500/10 border-violet-500/40'
                      : 'border-[#2d2e3e] hover:border-[#3d3e52]'
                  }`}
                >
                  <Icon size={14} className="text-violet-400 mb-1" />
                  <p className="text-[11px] font-bold text-white">{t.label}</p>
                  <p className="text-[9px] text-[#5c5d72]">{t.sub}</p>
                </button>
              )
            })}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[#5c5d72] mb-1">Room Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Spring Boot Office Hours"
                className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#5c5d72] mb-1">Max Participants</label>
              <input
                type="number"
                min={2}
                max={50}
                value={form.maxParticipants}
                onChange={(e) => setForm((f) => ({ ...f, maxParticipants: Number(e.target.value) }))}
                className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-[#5c5d72] mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What will you discuss in this room?"
              rows={2}
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-[#8b8ca8]">
            {[
              ['chatEnabled', 'Room chat'],
              ['screenShareEnabled', 'Screen share'],
              ['breakoutEnabled', 'Breakout rooms'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                  className="rounded"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-[#1c1d2a] text-[#8b8ca8] hover:text-white text-xs">
              Cancel
            </button>
            <button type="button" onClick={handleCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">
              <Play size={12} /> Create & Join
            </button>
          </div>
        </div>
      )}

      {/* Room grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Layers size={40} className="text-[#3d3e52] mb-3" />
          <p className="text-sm font-semibold text-[#8b8ca8]">No active rooms</p>
          <p className="text-xs text-[#5c5d72] mt-1">Create a room to host workshops, study groups, or community discussions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((room) => (
            <div key={room.id} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 hover:border-violet-500/30 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0 relative">
                  <Video size={18} className="text-violet-400" />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-2 border-[#161722]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-white truncate">{room.title}</p>
                    <Pill color="green"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE</Pill>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Pill color="violet">{roomTypeLabel(room.roomType, room.useCase)}</Pill>
                    <span className="text-[10px] text-[#5c5d72]">{room.category}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#8b8ca8] mb-3 line-clamp-2">{room.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-[#5c5d72] mb-3">
                <span className="flex items-center gap-1"><Users size={11} /> {room.participantCount}/{room.maxParticipants}</span>
                <span>Host: {room.hostDisplayName}</span>
                {room.breakoutEnabled && <span className="text-violet-400">Breakouts on</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleJoin(room.id)}
                  disabled={joiningId === room.id || room.full}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white transition-colors"
                >
                  {joiningId === room.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                  {room.full ? 'Room Full' : 'Join'}
                </button>
                <button
                  onClick={() => handleJoin(room.id)}
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:bg-[#2d2e3e] transition-colors"
                  title="View room"
                >
                  <Eye size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
