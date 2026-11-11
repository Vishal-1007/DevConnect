import { useEffect, useMemo, useState } from 'react'
import {
  Globe,
  Lock,
  GraduationCap,
  Users,
  Video,
  RefreshCw,
  Plus,
  Search,
  Mic,
  MicOff,
  UserMinus,
  Settings2,
  Layers,
  MessageSquare,
  Monitor,
  XCircle,
  Loader2,
  Hand,
} from 'lucide-react'
import {
  useListVideoRoomsQuery,
  useGetVideoRoomAdminAnalyticsQuery,
  useGetVideoRoomQuery,
  useCreateVideoRoomMutation,
  useEndVideoRoomMutation,
  useUpdateVideoRoomPermissionsMutation,
  useSetParticipantMutedMutation,
  useRemoveVideoRoomParticipantMutation,
  useCreateBreakoutRoomMutation,
} from '../../api/videoRoomsApi'
import type { VideoRoom, VideoRoomParticipant } from '../../api/types'
import {
  VIDEO_ROOM_TYPES,
  VIDEO_ROOM_USE_CASES,
  roomTypeMeta,
  useCaseMeta,
  type VideoRoomTypeId,
  type VideoRoomUseCaseId,
} from '../../data/videoRoomTypes'
import { extractApiError } from '../../lib/extractApiError'
import { useAppSelector } from '../../hooks'
import { hasAdminRole } from '../../lib/roles'

const TYPE_ICONS: Record<string, typeof Globe> = {
  public: Globe,
  private: Lock,
  interview: GraduationCap,
  study_group: Users,
}

const PALETTE = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#0891b2']
const avatarColor = (s: string) => PALETTE[s.charCodeAt(0) % PALETTE.length]

function Av({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.38 }}
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
    >
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    green: 'bg-emerald-500/15 text-emerald-400',
    red: 'bg-red-500/15 text-red-400',
    amber: 'bg-amber-500/15 text-amber-400',
    blue: 'bg-blue-500/15 text-blue-400',
    purple: 'bg-violet-500/15 text-violet-400',
    cyan: 'bg-cyan-500/15 text-cyan-400',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[color] ?? map.gray}`}>
      {children}
    </span>
  )
}

function Toggle({
  label,
  icon,
  checked,
  onChange,
  disabled,
}: {
  label: string
  icon: React.ReactNode
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={`flex items-center justify-between gap-3 p-3 rounded-lg bg-[#12131c] border border-[#2d2e3e] ${disabled ? 'opacity-50' : 'cursor-pointer hover:border-[#818cf8]/30'}`}>
      <span className="flex items-center gap-2 text-xs text-[#a5a6bb]">
        {icon}
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-[#2d2e3e]'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
      </button>
    </label>
  )
}

function AlertBanner({ type, message, onDismiss }: { type: 'error' | 'success'; message: string; onDismiss?: () => void }) {
  return (
    <div
      className={`flex items-start justify-between gap-3 px-4 py-3 rounded-lg text-xs ${
        type === 'error'
          ? 'bg-red-500/10 border border-red-500/30 text-red-300'
          : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
      }`}
    >
      <p className="leading-relaxed">{message}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-[#8b8ca8] hover:text-white shrink-0">
          ✕
        </button>
      )}
    </div>
  )
}

function CreateRoomModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [createRoom, { isLoading }] = useCreateVideoRoomMutation()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [roomType, setRoomType] = useState<VideoRoomTypeId>('public')
  const [useCase, setUseCase] = useState<VideoRoomUseCaseId>('community')
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [chatEnabled, setChatEnabled] = useState(true)
  const [screenShareEnabled, setScreenShareEnabled] = useState(true)
  const [breakoutEnabled, setBreakoutEnabled] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    setError(null)
    try {
      const room = await createRoom({
        title: title.trim(),
        description: description.trim(),
        roomType,
        useCase,
        maxParticipants,
        chatEnabled,
        screenShareEnabled,
        breakoutEnabled,
        category: useCase === 'mentoring' ? 'mentorship' : useCase,
      }).unwrap()
      onCreated(room.id)
      onClose()
    } catch (err) {
      setError(extractApiError(err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleCreate}
        className="bg-[#161722] border border-[#2d2e3e] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-[#2d2e3e] flex items-center justify-between">
          <h3 className="font-bold text-white">Create Video Room</h3>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white text-sm">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}
          <label className="block">
            <span className="text-xs text-[#8b8ca8]">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white focus:border-[#818cf8] focus:outline-none"
              placeholder="Kubernetes Study Group"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs text-[#8b8ca8]">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white focus:border-[#818cf8] focus:outline-none resize-none"
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-[#8b8ca8]">Room type</span>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as VideoRoomTypeId)}
                className="mt-1 w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                {VIDEO_ROOM_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-[#8b8ca8]">Use case</span>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value as VideoRoomUseCaseId)}
                className="mt-1 w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                {VIDEO_ROOM_USE_CASES.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-[#8b8ca8]">Max participants ({maxParticipants})</span>
            <input
              type="range"
              min={2}
              max={20}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              className="mt-2 w-full accent-violet-500"
            />
          </label>
          <div className="space-y-2">
            <Toggle label="Chat enabled" icon={<MessageSquare size={14} />} checked={chatEnabled} onChange={setChatEnabled} />
            <Toggle label="Screen share" icon={<Monitor size={14} />} checked={screenShareEnabled} onChange={setScreenShareEnabled} />
            <Toggle label="Breakout rooms" icon={<Layers size={14} />} checked={breakoutEnabled} onChange={setBreakoutEnabled} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#2d2e3e] flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#8b8ca8] hover:text-white">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            Create room
          </button>
        </div>
      </form>
    </div>
  )
}

function ParticipantRow({
  participant,
  roomId,
  isLive,
  onError,
}: {
  participant: VideoRoomParticipant
  roomId: string
  isLive: boolean
  onError: (msg: string) => void
}) {
  const [setMuted, { isLoading: muting }] = useSetParticipantMutedMutation()
  const [remove, { isLoading: removing }] = useRemoveVideoRoomParticipantMutation()

  async function toggleMute() {
    try {
      await setMuted({ roomId, userId: participant.userId, muted: !participant.muted }).unwrap()
    } catch (err) {
      onError(extractApiError(err))
    }
  }

  async function handleRemove() {
    try {
      await remove({ roomId, userId: participant.userId }).unwrap()
    } catch (err) {
      onError(extractApiError(err))
    }
  }

  return (
    <tr className="hover:bg-[#1c1d2a]/50">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Av name={participant.displayName} size={28} />
          <div>
            <p className="text-xs font-semibold text-white">{participant.displayName}</p>
            <p className="text-[10px] text-[#5c5d72]">{participant.role ?? 'Member'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5">
        {participant.host ? <Pill color="purple">Host</Pill> : <Pill color="gray">Member</Pill>}
      </td>
      <td className="px-4 py-2.5">
        {participant.muted ? (
          <Pill color="red"><MicOff size={10} /> Muted</Pill>
        ) : participant.handRaised ? (
          <Pill color="amber"><Hand size={10} /> Hand</Pill>
        ) : (
          <Pill color="green"><Mic size={10} /> Active</Pill>
        )}
      </td>
      <td className="px-4 py-2.5 text-[10px] text-[#5c5d72]">
        {new Date(participant.joinedAt).toLocaleTimeString()}
      </td>
      <td className="px-4 py-2.5">
        {isLive && !participant.host && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={muting}
              title={participant.muted ? 'Unmute' : 'Mute'}
              onClick={() => void toggleMute()}
              className="p-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:border-[#818cf8]/40 disabled:opacity-50"
            >
              {participant.muted ? <Mic size={13} /> : <MicOff size={13} />}
            </button>
            <button
              type="button"
              disabled={removing}
              title="Remove participant"
              onClick={() => void remove({ roomId, userId: participant.userId })}
              className="p-1.5 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              <UserMinus size={13} />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

function RoomDetailPanel({
  roomId,
  onEnded,
}: {
  roomId: string
  onEnded: () => void
}) {
  const account = useAppSelector((s) => s.auth.account)
  const isAdmin = hasAdminRole(account?.roles)
  const { data: room, isFetching, refetch } = useGetVideoRoomQuery(roomId, {
    pollingInterval: 10_000,
  })
  const [updatePermissions, { isLoading: savingPerms }] = useUpdateVideoRoomPermissionsMutation()
  const [createBreakout, { isLoading: creatingBreakout }] = useCreateBreakoutRoomMutation()
  const [endRoom, { isLoading: ending }] = useEndVideoRoomMutation()
  const [breakoutTitle, setBreakoutTitle] = useState('')
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [perms, setPerms] = useState({
    chatEnabled: true,
    screenShareEnabled: true,
    breakoutEnabled: false,
  })

  useEffect(() => {
    if (room) {
      setPerms({
        chatEnabled: room.chatEnabled,
        screenShareEnabled: room.screenShareEnabled,
        breakoutEnabled: room.breakoutEnabled,
      })
    }
  }, [room?.id, room?.chatEnabled, room?.screenShareEnabled, room?.breakoutEnabled])

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#5c5d72] text-sm">
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading room…
      </div>
    )
  }

  const isLive = room.status === 'live'
  const typeMeta = roomTypeMeta(room.roomType)
  const caseMeta = useCaseMeta(room.useCase)
  const TypeIcon = TYPE_ICONS[room.roomType] ?? Globe

  async function handlePermissionChange(
    key: 'chatEnabled' | 'screenShareEnabled' | 'breakoutEnabled',
    value: boolean
  ) {
    const previous = perms
    setPerms((p) => ({ ...p, [key]: value }))
    setError(null)
    setSuccess(null)
    try {
      await updatePermissions({ roomId, body: { [key]: value } }).unwrap()
      setSuccess('Room permissions updated')
      window.setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setPerms(previous)
      setError(extractApiError(err))
    }
  }

  async function handleCreateBreakout(e: React.FormEvent) {
    e.preventDefault()
    if (!breakoutTitle.trim()) return
    setError(null)
    try {
      await createBreakout({
        parentRoomId: roomId,
        body: { title: breakoutTitle.trim(), maxParticipants: 6 },
      }).unwrap()
      setBreakoutTitle('')
      setSuccess('Breakout room created')
      refetch()
    } catch (err) {
      setError(extractApiError(err))
    }
  }

  async function handleEnd() {
    setError(null)
    try {
      await endRoom(roomId).unwrap()
      setConfirmEnd(false)
      onEnded()
    } catch (err) {
      setError(extractApiError(err))
      setConfirmEnd(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1e1f2e] shrink-0">
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${typeMeta.color}22` }}
          >
            <TypeIcon size={20} style={{ color: typeMeta.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-white text-sm truncate">{room.title}</h3>
              <Pill color={isLive ? 'green' : 'gray'}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-[#5c5d72]'}`} />
                {room.status}
              </Pill>
              <Pill color="cyan">{typeMeta.label}</Pill>
            </div>
            <p className="text-[11px] text-[#5c5d72] mt-0.5 line-clamp-2">{room.description}</p>
            <p className="text-[10px] text-[#8b8ca8] mt-1">
              {caseMeta.label} · {room.participantCount}/{room.maxParticipants} participants · Host: {room.hostDisplayName}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => refetch()}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#2d2e3e] text-[#5c5d72] hover:text-white"
              title="Refresh"
            >
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
            {isLive && (
              <button
                type="button"
                onClick={() => setConfirmEnd(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                <XCircle size={12} /> End
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}
        {success && <AlertBanner type="success" message={success} />}
        {!isAdmin && isLive && (
          <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            Sign in as an admin account to end rooms and change permissions on rooms you do not host.
          </p>
        )}
        <section>
          <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <Settings2 size={14} className="text-violet-400" />
            Room permissions
            {savingPerms && <Loader2 size={12} className="animate-spin text-[#818cf8]" />}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Toggle
              label="Chat"
              icon={<MessageSquare size={14} />}
              checked={perms.chatEnabled}
              onChange={(v) => void handlePermissionChange('chatEnabled', v)}
              disabled={!isLive || savingPerms}
            />
            <Toggle
              label="Screen share"
              icon={<Monitor size={14} />}
              checked={perms.screenShareEnabled}
              onChange={(v) => void handlePermissionChange('screenShareEnabled', v)}
              disabled={!isLive || savingPerms}
            />
            <Toggle
              label="Breakouts"
              icon={<Layers size={14} />}
              checked={perms.breakoutEnabled}
              onChange={(v) => void handlePermissionChange('breakoutEnabled', v)}
              disabled={!isLive || savingPerms}
            />
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <Users size={14} className="text-violet-400" />
            Participants ({room.participants.length})
          </h4>
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#2d2e3e] bg-[#12131c]">
                  {['Participant', 'Role', 'Audio', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1d2a]">
                {room.participants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-[#5c5d72]">
                      No participants in this room
                    </td>
                  </tr>
                ) : (
                  room.participants.map((p) => (
                    <ParticipantRow
                      key={p.userId}
                      participant={p}
                      roomId={roomId}
                      isLive={isLive}
                      onError={setError}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {perms.breakoutEnabled && isLive && (
          <section>
            <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <Layers size={14} className="text-violet-400" />
              Breakout discussions
            </h4>
            {(room.breakouts ?? []).length > 0 && (
              <ul className="space-y-2 mb-3">
                {room.breakouts.map((b: VideoRoom) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#12131c] border border-[#2d2e3e] text-xs"
                  >
                    <span className="text-white font-medium">{b.title}</span>
                    <span className="text-[#5c5d72]">
                      {b.participantCount}/{b.maxParticipants} · live
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleCreateBreakout} className="flex gap-2">
              <input
                value={breakoutTitle}
                onChange={(e) => setBreakoutTitle(e.target.value)}
                placeholder="Breakout room title…"
                className="flex-1 bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:border-[#818cf8] focus:outline-none"
              />
              <button
                type="submit"
                disabled={creatingBreakout || !breakoutTitle.trim()}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1"
              >
                {creatingBreakout ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Add breakout
              </button>
            </form>
          </section>
        )}

        <section className="rounded-xl bg-[#12131c] border border-[#2d2e3e] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5c5d72] mb-2">Use cases</p>
          <div className="grid grid-cols-2 gap-2">
            {VIDEO_ROOM_USE_CASES.map((u) => (
              <div
                key={u.id}
                className={`px-3 py-2 rounded-lg text-[11px] ${room.useCase === u.id ? 'bg-violet-600/20 border border-violet-500/30 text-violet-300' : 'text-[#5c5d72] border border-transparent'}`}
              >
                <p className="font-semibold">{u.label}</p>
                <p className="text-[10px] opacity-80 mt-0.5">{u.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {confirmEnd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-2xl p-6 w-80">
            <h3 className="font-bold text-white mb-2">End room?</h3>
            <p className="text-xs text-[#8b8ca8] mb-5">
              Ending &quot;{room.title}&quot; disconnects all participants and closes breakouts.
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setConfirmEnd(false)} className="px-4 py-2 text-sm text-[#8b8ca8]">
                Cancel
              </button>
              <button
                type="button"
                disabled={ending}
                onClick={() => void handleEnd()}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                End room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminVideoRoomsPanel() {
  const [status, setStatus] = useState<'live' | 'ended'>('live')
  const [roomType, setRoomType] = useState<string>('all')
  const [useCase, setUseCase] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const poll = { pollingInterval: 12_000 }
  const { data: analytics } = useGetVideoRoomAdminAnalyticsQuery(undefined, poll)
  const { data: rooms = [], isLoading, refetch, isFetching } = useListVideoRoomsQuery(
    {
      status,
      roomType: roomType === 'all' ? undefined : roomType,
      q: search.trim() || undefined,
      limit: 100,
    },
    poll
  )

  const filtered = useMemo(() => {
    if (useCase === 'all') return rooms
    return rooms.filter((r) => r.useCase === useCase)
  }, [rooms, useCase])

  const selectedRoom = filtered.find((r) => r.id === selectedId) ?? filtered[0]

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setSelectedId(id)
            refetch()
          }}
        />
      )}

      <div className="px-6 py-4 border-b border-[#1e1f2e] shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Video Rooms</h2>
            <p className="text-xs text-[#5c5d72] mt-0.5">
              Manage public, private, interview, and study rooms · mentoring, workshops, teaching
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-lg"
            >
              <Plus size={14} /> Create room
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white"
            >
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
            {[
              { label: 'Total rooms', value: analytics.totalRoomsCreated },
              { label: 'Active', value: analytics.activeRooms },
              { label: 'Premium users', value: analytics.premiumUsers },
              { label: 'Payments', value: analytics.completedPayments },
              {
                label: 'Revenue',
                value: `₹${Math.round(analytics.revenueCents / 100)}`,
              },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-[#12131c] border border-[#2d2e3e] px-3 py-2">
                <p className="text-[10px] text-[#5c5d72]">{s.label}</p>
                <p className="text-sm font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms…"
              className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:border-[#818cf8] focus:outline-none"
            />
          </div>
          <div className="flex bg-[#161722] border border-[#2d2e3e] rounded-xl p-0.5">
            {(['live', 'ended'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                  status === s ? 'bg-[#2d2e3e] text-white' : 'text-[#5c5d72] hover:text-[#8b8ca8]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none"
          >
            <option value="all">All types</option>
            {VIDEO_ROOM_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <select
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            className="bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none"
          >
            <option value="all">All use cases</option>
            {VIDEO_ROOM_USE_CASES.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-[42%] max-w-md border-r border-[#1e1f2e] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[#818cf8]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 px-6 text-center">
              <Video size={40} className="text-[#2d2e3e] mb-3" />
              <p className="text-sm text-[#5c5d72]">No {status} rooms match your filters</p>
            </div>
          ) : (
            <ul className="p-3 space-y-2">
              {filtered.map((room) => {
                const meta = roomTypeMeta(room.roomType ?? 'public')
                const Icon = TYPE_ICONS[room.roomType] ?? Globe
                const active = (selectedId ?? selectedRoom?.id) === room.id
                return (
                  <li key={room.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(room.id)}
                      className={`w-full text-left rounded-xl p-4 border transition-all ${
                        active
                          ? 'bg-violet-600/15 border-violet-500/40'
                          : 'bg-[#161722] border-[#2d2e3e] hover:border-[#3d3e52]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${meta.color}18` }}
                        >
                          <Icon size={16} style={{ color: meta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm truncate">{room.title}</span>
                            {room.status === 'live' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-[#5c5d72] mt-0.5 line-clamp-1">{room.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-[#8b8ca8]">
                            <span>{meta.label}</span>
                            <span>·</span>
                            <span>{useCaseMeta(room.useCase ?? 'community').label}</span>
                            <span>·</span>
                            <span>
                              {room.participantCount}/{room.maxParticipants}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {(selectedId ?? selectedRoom?.id) ? (
          <RoomDetailPanel
            roomId={selectedId ?? selectedRoom!.id}
            onEnded={() => {
              setSelectedId(null)
              refetch()
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#5c5d72] p-8 text-center">
            <Video size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-medium text-[#8b8ca8]">Select a room to manage</p>
            <p className="text-xs mt-1 max-w-xs">
              View participants, mute controls, permissions, and breakout sessions
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
