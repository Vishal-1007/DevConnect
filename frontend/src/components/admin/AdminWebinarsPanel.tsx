import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Eye,
  Loader2,
  Mic2,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  ShieldX,
  Trash2,
  UserCheck,
  Users2,
  Video,
  VideoOff,
  X,
} from 'lucide-react'
import {
  useListAdminWebinarsQuery,
  useGetWebinarAnalyticsQuery,
  useListWebinarAttendanceQuery,
  useCreateAdminWebinarMutation,
  useUpdateAdminWebinarMutation,
  useApproveWebinarHostMutation,
  useRejectWebinarHostMutation,
  useGoLiveWebinarMutation,
  useEndWebinarStreamMutation,
  useUpdateWebinarStreamMutation,
  useCheckInWebinarAttendeeMutation,
  useCancelAdminWebinarMutation,
  useRestoreAdminWebinarMutation,
  type AdminWebinar,
} from '../../api/adminWebinarsApi'
import { useListUsersQuery } from '../../api/adminApi'
import { EVENT_CATEGORIES, categoryLabels } from '../../data/eventsData'
import {
  WEBINAR_SUBTYPES,
  subtypeLabels,
  approvalLabels,
  streamLabels,
  approvalColors,
  streamColors,
} from '../../data/webinarsData'
import { extractApiError } from '../../lib/extractApiError'

const PALETTE = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#0891b2']
const avatarColor = (s: string) => PALETTE[s.charCodeAt(0) % PALETTE.length]

type WhenFilter = 'upcoming' | 'past'
type StatusFilter = 'active' | 'pending' | 'live' | 'cancelled' | 'all'

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
    gray: 'bg-[#2d2e3e] text-[#8b8ca8]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[color] ?? map.gray}`}>
      {children}
    </span>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl px-4 py-3 min-w-[100px]">
      <p className="text-[10px] uppercase tracking-wide text-[#5c5d72] font-semibold">{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
    </div>
  )
}

function AttendanceModal({ webinar, onClose }: { webinar: AdminWebinar; onClose: () => void }) {
  const { data: attendance, isLoading } = useListWebinarAttendanceQuery(webinar.id)
  const [checkIn, { isLoading: checkingIn }] = useCheckInWebinarAttendeeMutation()
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  async function handleCheckIn(userId: string) {
    setBusyUserId(userId)
    try {
      await checkIn({ webinarId: webinar.id, userId }).unwrap()
    } finally {
      setBusyUserId(null)
    }
  }

  const rate = webinar.registeredCount > 0
    ? Math.round((webinar.attendedCount / webinar.registeredCount) * 100)
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[#2d2e3e]">
          <div>
            <h3 className="text-sm font-bold text-white">Attendance Tracking</h3>
            <p className="text-xs text-[#8b8ca8] mt-1 line-clamp-1">{webinar.title}</p>
            <p className="text-[10px] text-[#5c5d72] mt-1">
              {webinar.attendedCount}/{webinar.registeredCount} attended ({rate}% show rate)
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#818cf8]" /></div>
          ) : !attendance?.length ? (
            <p className="text-xs text-[#5c5d72] text-center py-10">No registrations yet</p>
          ) : (
            attendance.map((reg) => (
              <div key={reg.userId} className="flex items-center gap-3 bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2.5">
                <Av name={reg.displayName} size={30} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{reg.displayName}</p>
                  <p className="text-[10px] text-[#5c5d72]">Registered {new Date(reg.registeredAt).toLocaleString()}</p>
                </div>
                {reg.attended ? (
                  <Pill color="green"><CheckCircle2 size={10} /> Attended</Pill>
                ) : (
                  <button
                    type="button"
                    disabled={busyUserId === reg.userId || checkingIn}
                    onClick={() => handleCheckIn(reg.userId)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-[#818cf8]/15 text-[#818cf8] hover:bg-[#818cf8]/25 disabled:opacity-50"
                  >
                    {busyUserId === reg.userId ? <Loader2 size={10} className="animate-spin" /> : <UserCheck size={10} />}
                    Check in
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StreamModal({
  webinar,
  onClose,
  onDone,
}: {
  webinar: AdminWebinar
  onClose: () => void
  onDone: (type: 'success' | 'error', msg: string) => void
}) {
  const [streamUrl, setStreamUrl] = useState(webinar.streamUrl ?? '')
  const [recordingUrl, setRecordingUrl] = useState(webinar.recordingUrl ?? '')
  const [updateStream, { isLoading }] = useUpdateWebinarStreamMutation()
  const [goLive, { isLoading: goingLive }] = useGoLiveWebinarMutation()
  const [endStream, { isLoading: ending }] = useEndWebinarStreamMutation()

  const inputClass = 'w-full px-3 py-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-xs focus:outline-none focus:border-[#818cf8]'

  async function saveStream() {
    try {
      await updateStream({ id: webinar.id, streamUrl: streamUrl.trim() || undefined, recordingUrl: recordingUrl.trim() || undefined }).unwrap()
      onDone('success', 'Stream settings updated.')
      onClose()
    } catch (err) {
      onDone('error', extractApiError(err))
    }
  }

  async function handleGoLive() {
    try {
      await goLive(webinar.id).unwrap()
      onDone('success', `"${webinar.title}" is now live.`)
      onClose()
    } catch (err) {
      onDone('error', extractApiError(err))
    }
  }

  async function handleEndStream() {
    try {
      await endStream(webinar.id).unwrap()
      onDone('success', 'Stream ended.')
      onClose()
    } catch (err) {
      onDone('error', extractApiError(err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#2d2e3e]">
          <div>
            <h3 className="text-sm font-bold text-white">Manage Streaming</h3>
            <p className="text-xs text-[#5c5d72] mt-0.5">{streamLabels[webinar.streamStatus] ?? webinar.streamStatus}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase">Stream URL</label>
            <input value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} placeholder="https://stream.devconnect.local/..." className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase">Recording URL</label>
            <input value={recordingUrl} onChange={(e) => setRecordingUrl(e.target.value)} placeholder="https://recordings.devconnect.local/..." className={`${inputClass} mt-1`} />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" onClick={saveStream} disabled={isLoading} className="px-3 py-2 rounded-lg text-xs font-bold bg-[#818cf8] text-white disabled:opacity-50">
              {isLoading ? 'Saving…' : 'Save URLs'}
            </button>
            {webinar.streamStatus !== 'live' && webinar.hostApprovalStatus === 'approved' && !webinar.cancelled && (
              <button type="button" onClick={handleGoLive} disabled={goingLive} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white disabled:opacity-50">
                <Video size={12} /> Go Live
              </button>
            )}
            {webinar.streamStatus === 'live' && (
              <button type="button" onClick={handleEndStream} disabled={ending} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-red-600 text-white disabled:opacity-50">
                <VideoOff size={12} /> End Stream
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function WebinarFormModal({
  mode,
  webinar,
  users,
  onClose,
  onDone,
}: {
  mode: 'create' | 'edit'
  webinar?: AdminWebinar
  users: { id: string; username: string }[]
  onClose: () => void
  onDone: (type: 'success' | 'error', msg: string) => void
}) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(18, 0, 0, 0)
  const end = new Date(tomorrow)
  end.setHours(19, 0, 0, 0)

  const [hostId, setHostId] = useState(webinar?.hostId ?? users[0]?.id ?? '')
  const [title, setTitle] = useState(webinar?.title ?? '')
  const [description, setDescription] = useState(webinar?.description ?? '')
  const [subtype, setSubtype] = useState(webinar?.webinarSubtype ?? 'mentor')
  const [category, setCategory] = useState(webinar?.category ?? 'general')
  const [streamUrl, setStreamUrl] = useState(webinar?.streamUrl ?? '')
  const [startsAt, setStartsAt] = useState(webinar ? new Date(webinar.startsAt).toISOString().slice(0, 16) : tomorrow.toISOString().slice(0, 16))
  const [endsAt, setEndsAt] = useState(webinar ? new Date(webinar.endsAt).toISOString().slice(0, 16) : end.toISOString().slice(0, 16))
  const [maxAttendees, setMaxAttendees] = useState(String(webinar?.maxAttendees ?? 200))
  const [speakerIds, setSpeakerIds] = useState<string[]>(webinar?.speakers.map((s) => s.userId) ?? [])

  const [create, { isLoading: creating }] = useCreateAdminWebinarMutation()
  const [update, { isLoading: updating }] = useUpdateAdminWebinarMutation()
  const loading = creating || updating
  const inputClass = 'w-full px-3 py-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-xs focus:outline-none focus:border-[#818cf8]'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      hostId,
      title: title.trim(),
      description: description.trim(),
      webinarSubtype: subtype,
      category,
      streamUrl: streamUrl.trim() || undefined,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      maxAttendees: Number(maxAttendees) || 200,
      speakerIds: speakerIds.filter((id) => id !== hostId),
    }
    try {
      if (mode === 'create') {
        await create(payload).unwrap()
        onDone('success', 'Webinar scheduled successfully.')
      } else if (webinar) {
        await update({ id: webinar.id, ...payload }).unwrap()
        onDone('success', 'Webinar updated.')
      }
      onClose()
    } catch (err) {
      onDone('error', extractApiError(err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 overflow-y-auto">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-xl shadow-2xl my-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#2d2e3e]">
          <h3 className="text-sm font-bold text-white">{mode === 'create' ? 'Schedule Webinar' : 'Edit Webinar'}</h3>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase">Host</label>
              <select value={hostId} onChange={(e) => setHostId(e.target.value)} className={`${inputClass} mt-1`}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase">Format</label>
              <select value={subtype} onChange={(e) => setSubtype(e.target.value)} className={`${inputClass} mt-1`}>
                {WEBINAR_SUBTYPES.filter((s) => s.id !== 'all').map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={inputClass} required />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className={`${inputClass} resize-none`} required />
          <div className="grid sm:grid-cols-3 gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {EVENT_CATEGORIES.filter((c) => c.id !== 'all').map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} required />
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} required />
          </div>
          <input value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} placeholder="Stream URL" className={inputClass} />
          <input type="number" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} placeholder="Max attendees" className={inputClass} min={1} />
          <div>
            <p className="text-[10px] font-semibold text-[#8b8ca8] uppercase mb-1">Speakers</p>
            <div className="max-h-28 overflow-y-auto space-y-1 bg-[#0b0c14] border border-[#2d2e3e] rounded-lg p-2">
              {users.filter((u) => u.id !== hostId).map((u) => (
                <label key={u.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#161722] cursor-pointer text-xs text-white">
                  <input type="checkbox" checked={speakerIds.includes(u.id)} onChange={() => setSpeakerIds((p) => p.includes(u.id) ? p.filter((id) => id !== u.id) : [...p, u.id])} className="accent-[#818cf8]" />
                  <Mic2 size={11} className="text-[#818cf8]" /> {u.username}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#2d2e3e] text-[#8b8ca8]">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-bold rounded-lg bg-[#818cf8] text-white disabled:opacity-50">
              {loading ? 'Saving…' : mode === 'create' ? 'Schedule' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdminWebinarsPanel() {
  const [when, setWhen] = useState<WhenFilter>('upcoming')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [subtype, setSubtype] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [attendanceWebinar, setAttendanceWebinar] = useState<AdminWebinar | null>(null)
  const [streamWebinar, setStreamWebinar] = useState<AdminWebinar | null>(null)
  const [editWebinar, setEditWebinar] = useState<AdminWebinar | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data: analytics } = useGetWebinarAnalyticsQuery()
  const { data: users } = useListUsersQuery()
  const { data: webinars, isLoading, isFetching, refetch } = useListAdminWebinarsQuery({ when, status, subtype, q: query, limit: 100 })

  const [approveHost] = useApproveWebinarHostMutation()
  const [rejectHost] = useRejectWebinarHostMutation()
  const [cancelWebinar] = useCancelAdminWebinarMutation()
  const [restoreWebinar] = useRestoreAdminWebinarMutation()

  const userOptions = useMemo(() => (users ?? []).map((u) => ({ id: u.id, username: u.username })), [users])

  async function handleApprove(id: string) {
    setBusyId(id)
    try {
      await approveHost(id).unwrap()
      setBanner({ type: 'success', message: 'Host approved — webinar is now visible to users.' })
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id: string) {
    setBusyId(id)
    try {
      await rejectHost(id).unwrap()
      setBanner({ type: 'success', message: 'Host request rejected.' })
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    } finally {
      setBusyId(null)
    }
  }

  async function handleCancel(id: string, title: string) {
    if (!window.confirm(`Cancel "${title}"?`)) return
    setBusyId(id)
    try {
      await cancelWebinar(id).unwrap()
      setBanner({ type: 'success', message: `"${title}" cancelled.` })
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    } finally {
      setBusyId(null)
    }
  }

  async function handleRestore(id: string, title: string) {
    setBusyId(id)
    try {
      await restoreWebinar(id).unwrap()
      setBanner({ type: 'success', message: `"${title}" restored.` })
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    } finally {
      setBusyId(null)
    }
  }

  const statusTabs: { id: StatusFilter; label: string; count?: number }[] = [
    { id: 'active', label: 'Active', count: analytics?.upcomingWebinars },
    { id: 'pending', label: 'Pending Hosts', count: analytics?.pendingHostApprovals },
    { id: 'live', label: 'Live', count: analytics?.liveWebinars },
    { id: 'cancelled', label: 'Cancelled', count: analytics?.cancelledWebinars },
    { id: 'all', label: 'All', count: analytics?.totalWebinars },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Webinars</h2>
          <p className="text-xs text-[#5c5d72] mt-0.5">Approve hosts, manage streaming, and track attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#818cf8] hover:bg-[#6366f1] text-white text-xs font-bold">
            <Plus size={13} /> Schedule
          </button>
          <button type="button" onClick={() => refetch()} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white">
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {banner && (
        <div className={`mb-4 flex items-start justify-between gap-3 px-4 py-3 rounded-lg text-xs border ${banner.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
          <p>{banner.message}</p>
          <button type="button" onClick={() => setBanner(null)} className="text-[#8b8ca8] hover:text-white">✕</button>
        </div>
      )}

      <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
        <StatCard label="Upcoming" value={analytics?.upcomingWebinars ?? 0} color="#34d399" />
        <StatCard label="Live" value={analytics?.liveWebinars ?? 0} color="#f87171" />
        <StatCard label="Pending Hosts" value={analytics?.pendingHostApprovals ?? 0} color="#fbbf24" />
        <StatCard label="Attended" value={analytics?.totalAttended ?? 0} color="#818cf8" />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setQuery(searchInput.trim())} placeholder="Search webinars…" className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#818cf8]" />
        </div>
        <select value={subtype} onChange={(e) => setSubtype(e.target.value)} className="bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2.5 text-xs text-white">
          {WEBINAR_SUBTYPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button type="button" onClick={() => setQuery(searchInput.trim())} className="px-4 py-2.5 rounded-lg bg-[#818cf8] text-white text-xs font-bold">Search</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1 bg-[#161722] border border-[#2d2e3e] rounded-lg p-1">
          {(['upcoming', 'past'] as WhenFilter[]).map((w) => (
            <button key={w} type="button" onClick={() => setWhen(w)} className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize ${when === w ? 'bg-[#818cf8] text-white' : 'text-[#8b8ca8] hover:text-white'}`}>{w}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#161722] border border-[#2d2e3e] rounded-lg p-1 flex-wrap">
          {statusTabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setStatus(tab.id)} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${status === tab.id ? 'bg-[#818cf8] text-white' : 'text-[#8b8ca8] hover:text-white'}`}>
              {tab.label}{tab.count !== undefined && <span className="ml-1 opacity-70">({tab.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#818cf8]" /></div>
      ) : !webinars?.length ? (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl flex flex-col items-center py-20 gap-3">
          <Radio size={40} className="text-[#2d2e3e]" />
          <p className="text-sm text-[#5c5d72]">No webinars match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] text-[#5c5d72] uppercase tracking-wide font-semibold">{webinars.length} webinar{webinars.length === 1 ? '' : 's'}</p>
          {webinars.map((w) => (
            <div key={w.id} className={`bg-[#161722] border rounded-xl p-4 transition-colors ${w.cancelled ? 'border-red-500/20 opacity-80' : w.streamStatus === 'live' ? 'border-emerald-500/40' : 'border-[#2d2e3e] hover:border-[#3d3e52]'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${w.streamStatus === 'live' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#818cf8]/15 text-[#818cf8]'}`}>
                  <Radio size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-white">{w.title}</p>
                    <Pill color="purple">{subtypeLabels[w.webinarSubtype] ?? w.webinarSubtype}</Pill>
                    <Pill color={approvalColors[w.hostApprovalStatus] ?? 'gray'}>{approvalLabels[w.hostApprovalStatus] ?? w.hostApprovalStatus}</Pill>
                    <Pill color={streamColors[w.streamStatus] ?? 'gray'}>{streamLabels[w.streamStatus] ?? w.streamStatus}</Pill>
                    {w.cancelled && <Pill color="red">Cancelled</Pill>}
                    <span className="ml-auto text-[10px] text-[#5c5d72]">{new Date(w.startsAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-[#8b8ca8] line-clamp-2 mb-2">{w.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-[#5c5d72] flex-wrap">
                    <span className="flex items-center gap-1"><Users2 size={11} /> {w.attendedCount}/{w.registeredCount} attended · {w.registeredCount}/{w.maxAttendees} registered</span>
                    <span>Host: {w.hostDisplayName}</span>
                    <span>{categoryLabels[w.category] ?? w.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end max-w-[140px]">
                  {w.hostApprovalStatus === 'pending' && !w.cancelled && (
                    <>
                      <button type="button" title="Approve host" disabled={busyId === w.id} onClick={() => handleApprove(w.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-400 hover:bg-emerald-500/10"><ShieldCheck size={13} /></button>
                      <button type="button" title="Reject host" disabled={busyId === w.id} onClick={() => handleReject(w.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10"><ShieldX size={13} /></button>
                    </>
                  )}
                  <button type="button" title="Track attendance" onClick={() => setAttendanceWebinar(w)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-[#818cf8] hover:bg-[#2d2e3e]"><Eye size={13} /></button>
                  <button type="button" title="Manage streaming" onClick={() => setStreamWebinar(w)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-[#818cf8] hover:bg-[#2d2e3e]"><Video size={13} /></button>
                  {!w.cancelled && (
                    <button type="button" title="Edit webinar" onClick={() => setEditWebinar(w)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-[#818cf8] hover:bg-[#2d2e3e]"><Settings2 size={13} /></button>
                  )}
                  {w.cancelled ? (
                    <button type="button" title="Restore" disabled={busyId === w.id} onClick={() => handleRestore(w.id, w.title)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-emerald-400 hover:bg-[#2d2e3e]"><RotateCcw size={13} /></button>
                  ) : (
                    <button type="button" title="Cancel webinar" disabled={busyId === w.id} onClick={() => handleCancel(w.id, w.title)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-red-400 hover:bg-[#2d2e3e]"><Trash2 size={13} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && userOptions.length > 0 && (
        <WebinarFormModal mode="create" users={userOptions} onClose={() => setShowCreate(false)} onDone={(type, message) => setBanner({ type, message })} />
      )}
      {editWebinar && userOptions.length > 0 && (
        <WebinarFormModal mode="edit" webinar={editWebinar} users={userOptions} onClose={() => setEditWebinar(null)} onDone={(type, message) => setBanner({ type, message })} />
      )}
      {attendanceWebinar && <AttendanceModal webinar={attendanceWebinar} onClose={() => setAttendanceWebinar(null)} />}
      {streamWebinar && <StreamModal webinar={streamWebinar} onClose={() => setStreamWebinar(null)} onDone={(type, message) => setBanner({ type, message })} />}
    </div>
  )
}
