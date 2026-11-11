import { useMemo, useState } from 'react'
import {
  Calendar,
  CalendarDays,
  Eye,
  Hash,
  Loader2,
  Mic2,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  Trash2,
  Users2,
  X,
} from 'lucide-react'
import {
  useListAdminEventsQuery,
  useGetEventAnalyticsQuery,
  useGetEventRevenueQuery,
  useListEventRegistrationsQuery,
  useCreateAdminEventMutation,
  useUpdateAdminEventMutation,
  useCancelAdminEventMutation,
  useRestoreAdminEventMutation,
  useApproveEventMutation,
  useRejectEventMutation,
  useSetEventFeaturedMutation,
  type AdminCommunityEvent,
} from '../../api/adminEventsApi'
import { AdminEventsRevenueSidebar } from './AdminEventsRevenueSidebar'
import { approvalStatusColors } from '../../data/eventsData'
import { formatInr } from '../../lib/formatTime'
import { useListUsersQuery } from '../../api/adminApi'
import {
  EVENT_CATEGORIES,
  EVENT_TYPES,
  categoryLabels,
  formatLabels,
  typeLabels,
} from '../../data/eventsData'
import { extractApiError } from '../../lib/extractApiError'

const PALETTE = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#0891b2']
const avatarColor = (s: string) => PALETTE[s.charCodeAt(0) % PALETTE.length]

type WhenFilter = 'upcoming' | 'past'
type StatusFilter = 'active' | 'cancelled' | 'all'

function defaultStartLocal() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(18, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}

function defaultEndLocal() {
  const d = new Date(defaultStartLocal())
  d.setHours(d.getHours() + 1)
  return d.toISOString().slice(0, 16)
}

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
    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl px-4 py-3 min-w-[110px]">
      <p className="text-[10px] uppercase tracking-wide text-[#5c5d72] font-semibold">{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
    </div>
  )
}

function EventTypeIcon({ type }: { type: string }) {
  return type?.toLowerCase() === 'webinar'
    ? <Radio size={18} />
    : <Calendar size={18} />
}

function RegistrationsModal({
  event,
  onClose,
}: {
  event: AdminCommunityEvent
  onClose: () => void
}) {
  const { data: registrations, isLoading } = useListEventRegistrationsQuery(event.id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[#2d2e3e]">
          <div>
            <h3 className="text-sm font-bold text-white">Registrations</h3>
            <p className="text-xs text-[#8b8ca8] mt-1 line-clamp-1">{event.title}</p>
            <p className="text-[10px] text-[#5c5d72] mt-1">
              {event.attendeeCount}/{event.maxAttendees} registered
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin text-[#818cf8]" />
            </div>
          ) : !registrations?.length ? (
            <p className="text-xs text-[#5c5d72] text-center py-10">No registrations yet</p>
          ) : (
            registrations.map((reg) => (
              <div key={reg.userId} className="flex items-center gap-3 bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2.5">
                <Av name={reg.displayName} size={30} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{reg.displayName}</p>
                  <p className="text-[10px] text-[#5c5d72]">@{reg.username}</p>
                </div>
                <span className="text-[10px] text-[#5c5d72] shrink-0">
                  {new Date(reg.registeredAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function EventFormModal({
  mode,
  event,
  users,
  defaultType,
  onClose,
  onDone,
}: {
  mode: 'create' | 'edit'
  event?: AdminCommunityEvent
  users: { id: string; username: string }[]
  defaultType?: string
  onClose: () => void
  onDone: (type: 'success' | 'error', message: string) => void
}) {
  const [hostId, setHostId] = useState(event?.hostId ?? users[0]?.id ?? '')
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [eventType, setEventType] = useState(event?.eventType ?? defaultType ?? 'webinar')
  const [category, setCategory] = useState(event?.category ?? 'general')
  const [format, setFormat] = useState(event?.format ?? 'online')
  const [locationOrLink, setLocationOrLink] = useState(event?.locationOrLink ?? '')
  const [startsAt, setStartsAt] = useState(
    event ? new Date(event.startsAt).toISOString().slice(0, 16) : defaultStartLocal()
  )
  const [endsAt, setEndsAt] = useState(
    event ? new Date(event.endsAt).toISOString().slice(0, 16) : defaultEndLocal()
  )
  const [maxAttendees, setMaxAttendees] = useState(String(event?.maxAttendees ?? 100))
  const [tagInput, setTagInput] = useState(event?.tags.join(', ') ?? '')
  const [speakerIds, setSpeakerIds] = useState<string[]>(event?.speakers.map((s) => s.userId) ?? [])
  const [error, setError] = useState<string | null>(null)

  const [createEvent, { isLoading: creating }] = useCreateAdminEventMutation()
  const [updateEvent, { isLoading: updating }] = useUpdateAdminEventMutation()
  const loading = creating || updating

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-xs focus:outline-none focus:border-[#818cf8]'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!hostId || !title.trim() || !description.trim()) {
      setError('Host, title, and description are required.')
      return
    }

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5)

    const payload = {
      hostId,
      title: title.trim(),
      description: description.trim(),
      eventType,
      category,
      format,
      locationOrLink: locationOrLink.trim() || undefined,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      maxAttendees: Number(maxAttendees) || 100,
      tags: tags.length ? tags : undefined,
      speakerIds: speakerIds.filter((id) => id && id !== hostId),
    }

    try {
      if (mode === 'create') {
        await createEvent(payload).unwrap()
        onDone('success', `"${title.trim()}" scheduled successfully.`)
      } else if (event) {
        await updateEvent({ id: event.id, ...payload }).unwrap()
        onDone('success', `"${title.trim()}" updated successfully.`)
      }
      onClose()
    } catch (err) {
      setError(extractApiError(err))
    }
  }

  function toggleSpeaker(userId: string) {
    setSpeakerIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 overflow-y-auto">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-2xl shadow-2xl my-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#2d2e3e]">
          <div>
            <h3 className="text-sm font-bold text-white">
              {mode === 'create' ? 'Schedule Event' : 'Manage Event'}
            </h3>
            <p className="text-xs text-[#5c5d72] mt-0.5">
              {mode === 'create' ? 'Create a hackathon, webinar, workshop, or meetup' : 'Update schedule, host, and speakers'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wide">Host</label>
              <select value={hostId} onChange={(e) => setHostId(e.target.value)} className={`${inputClass} mt-1`}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wide">Event type</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={`${inputClass} mt-1`}>
                {EVENT_TYPES.filter((t) => t.id !== 'all').map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wide">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} mt-1`} />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wide">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass} mt-1 resize-none`}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wide">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} mt-1`}>
                {EVENT_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wide">Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)} className={`${inputClass} mt-1`}>
                <option value="online">Online</option>
                <option value="in-person">In person</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wide">Max attendees</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(e.target.value)}
                className={`${inputClass} mt-1`}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wide">Starts</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className={`${inputClass} mt-1`}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wide">Ends</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className={`${inputClass} mt-1`}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wide">Location / link</label>
            <input
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              placeholder="Zoom link or venue address"
              className={`${inputClass} mt-1`}
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wide">Tags (comma-separated)</label>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} className={`${inputClass} mt-1`} />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wide mb-2 block">
              Assign speakers
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1.5 bg-[#0b0c14] border border-[#2d2e3e] rounded-lg p-2">
              {users.filter((u) => u.id !== hostId).map((u) => (
                <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#161722] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={speakerIds.includes(u.id)}
                    onChange={() => toggleSpeaker(u.id)}
                    className="accent-[#818cf8]"
                  />
                  <Mic2 size={12} className="text-[#818cf8]" />
                  <span className="text-xs text-white">{u.username}</span>
                </label>
              ))}
              {users.filter((u) => u.id !== hostId).length === 0 && (
                <p className="text-xs text-[#5c5d72] px-2 py-2">No other users available</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#818cf8] hover:bg-[#6366f1] text-white disabled:opacity-50"
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              {mode === 'create' ? 'Schedule Event' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmClass: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-md p-5 shadow-2xl">
        <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
        <p className="text-xs text-[#8b8ca8] mb-5 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg ${confirmClass}`}>
            {loading && <Loader2 size={12} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminEventsPanel({ webinarsOnly = false }: { webinarsOnly?: boolean }) {
  const [when, setWhen] = useState<WhenFilter>('upcoming')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [category, setCategory] = useState('all')
  const [eventType, setEventType] = useState(webinarsOnly ? 'webinar' : 'all')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [registrationsEvent, setRegistrationsEvent] = useState<AdminCommunityEvent | null>(null)
  const [editEvent, setEditEvent] = useState<AdminCommunityEvent | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [confirm, setConfirm] = useState<{ action: 'cancel' | 'restore'; event: AdminCommunityEvent } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data: analytics } = useGetEventAnalyticsQuery()
  const { data: revenue } = useGetEventRevenueQuery()
  const { data: users } = useListUsersQuery()
  const { data: events, isLoading, isFetching, refetch } = useListAdminEventsQuery({
    when,
    status,
    category,
    type: eventType,
    q: query,
    limit: 100,
  })

  const [cancelEvent, { isLoading: cancelling }] = useCancelAdminEventMutation()
  const [restoreEvent, { isLoading: restoring }] = useRestoreAdminEventMutation()
  const [approveEvent] = useApproveEventMutation()
  const [rejectEvent] = useRejectEventMutation()
  const [setFeatured] = useSetEventFeaturedMutation()

  const visible = useMemo(() => {
    const list = events ?? []
    if (!webinarsOnly) return list
    return list.filter((e) => e.eventType?.toLowerCase() === 'webinar')
  }, [events, webinarsOnly])

  const userOptions = useMemo(
    () => (users ?? []).map((u) => ({ id: u.id, username: u.username })),
    [users]
  )

  async function handleConfirm() {
    if (!confirm) return
    setBusyId(confirm.event.id)
    setBanner(null)
    try {
      if (confirm.action === 'cancel') {
        await cancelEvent(confirm.event.id).unwrap()
        setBanner({ type: 'success', message: `"${confirm.event.title}" cancelled.` })
      } else {
        await restoreEvent(confirm.event.id).unwrap()
        setBanner({ type: 'success', message: `"${confirm.event.title}" restored.` })
      }
      setConfirm(null)
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    } finally {
      setBusyId(null)
    }
  }

  async function handleApprove(eventId: string) {
    setBusyId(eventId)
    try {
      await approveEvent(eventId).unwrap()
      setBanner({ type: 'success', message: 'Event approved and published.' })
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(eventId: string) {
    setBusyId(eventId)
    try {
      await rejectEvent({ eventId }).unwrap()
      setBanner({ type: 'success', message: 'Event rejected.' })
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    } finally {
      setBusyId(null)
    }
  }

  const title = webinarsOnly ? 'Webinars' : 'Events Management'
  const statusTabs: { id: StatusFilter; label: string; count?: number }[] = [
    { id: 'active', label: 'Active', count: analytics ? analytics.upcomingEvents + analytics.pastEvents : undefined },
    { id: 'cancelled', label: 'Cancelled', count: analytics?.cancelledEvents },
    { id: 'all', label: 'All', count: analytics?.totalEvents },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="flex flex-col xl:flex-row gap-6">
      <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="text-xs text-[#5c5d72] mt-0.5">
            Schedule events, assign speakers, and track registrations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#818cf8] hover:bg-[#6366f1] text-white text-xs font-bold transition-colors"
          >
            <Plus size={13} />
            Schedule
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white transition-colors"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {banner && (
        <div className={`mb-4 flex items-start justify-between gap-3 px-4 py-3 rounded-lg text-xs border ${
          banner.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <p>{banner.message}</p>
          <button type="button" onClick={() => setBanner(null)} className="text-[#8b8ca8] hover:text-white shrink-0">✕</button>
        </div>
      )}

      <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
        <StatCard label="Total Events" value={revenue?.totalEvents ?? analytics?.totalEvents ?? 0} color="#818cf8" />
        <StatCard label="Approved" value={revenue?.approvedEvents ?? 0} color="#34d399" />
        <StatCard label="Pending" value={revenue?.pendingApprovals ?? 0} color="#fbbf24" />
        <StatCard label="Registrations" value={revenue?.totalRegistrations ?? analytics?.totalRegistrations ?? 0} color="#a5b4fc" />
        <StatCard label="Revenue" value={revenue?.totalRevenueInr ?? 0} color="#c084fc" />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setQuery(searchInput.trim())}
            placeholder="Search events…"
            className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#818cf8]"
          />
        </div>
        {!webinarsOnly && (
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#818cf8]"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        )}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#818cf8]"
        >
          {EVENT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setQuery(searchInput.trim())}
          className="px-4 py-2.5 rounded-lg bg-[#818cf8] hover:bg-[#6366f1] text-white text-xs font-bold"
        >
          Search
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1 bg-[#161722] border border-[#2d2e3e] rounded-lg p-1">
          {(['upcoming', 'past'] as WhenFilter[]).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWhen(w)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                when === w ? 'bg-[#818cf8] text-white' : 'text-[#8b8ca8] hover:text-white'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#161722] border border-[#2d2e3e] rounded-lg p-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatus(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                status === tab.id ? 'bg-[#818cf8] text-white' : 'text-[#8b8ca8] hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && <span className="ml-1 opacity-70">({tab.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#818cf8]" />
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl flex flex-col items-center py-20 gap-3">
          <CalendarDays size={40} className="text-[#2d2e3e]" />
          <p className="text-sm text-[#5c5d72]">No {webinarsOnly ? 'webinars' : 'events'} match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] text-[#5c5d72] uppercase tracking-wide font-semibold">
            {visible.length} {webinarsOnly ? 'webinar' : 'event'}{visible.length === 1 ? '' : 's'}
          </p>
          {visible.map((evt) => (
            <div
              key={evt.id}
              className={`bg-[#161722] border rounded-xl p-4 transition-colors ${
                evt.cancelled ? 'border-red-500/20 opacity-80' : 'border-[#2d2e3e] hover:border-[#3d3e52]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#818cf8]/15 flex items-center justify-center shrink-0 text-[#818cf8]">
                  <EventTypeIcon type={evt.eventType} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-white">{evt.title}</p>
                    <Pill color="blue">{typeLabels[evt.eventType] ?? evt.eventType}</Pill>
                    {evt.approvalStatus && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${approvalStatusColors[evt.approvalStatus] ?? approvalStatusColors.pending}`}>
                        {evt.approvalStatus}
                      </span>
                    )}
                    {evt.paid && <Pill color="purple">{formatInr(evt.priceInr ?? 0)}</Pill>}
                    {evt.featured && <Pill color="amber">Featured</Pill>}
                    {evt.full && !evt.cancelled && <Pill color="red">Full</Pill>}
                    {evt.cancelled && <Pill color="red">Cancelled</Pill>}
                    <span className="ml-auto text-[10px] text-[#5c5d72]">
                      {new Date(evt.startsAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#8b8ca8] line-clamp-2 mb-2">{evt.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-[#5c5d72] flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users2 size={11} />
                      {evt.attendeeCount}/{evt.maxAttendees} attendees
                    </span>
                    <span>Host: {evt.hostDisplayName}</span>
                    {evt.speakers.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Mic2 size={11} />
                        {evt.speakers.map((s) => s.displayName).join(', ')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Hash size={11} />
                      {categoryLabels[evt.category] ?? evt.category}
                    </span>
                    <span>{formatLabels[evt.format] ?? evt.format}</span>
                    {(evt.revenueInr ?? 0) > 0 && (
                      <span>Revenue: {formatInr(evt.revenueInr!)} (mentor {formatInr(evt.mentorShareInr ?? 0)})</span>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[#2d2e3e] overflow-hidden max-w-xs">
                    <div
                      className="h-full bg-[#6366f1] rounded-full"
                      style={{ width: `${Math.min(100, (evt.attendeeCount / evt.maxAttendees) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                  {evt.approvalStatus === 'pending' && !evt.cancelled && (
                    <>
                      <button
                        type="button"
                        title="Approve"
                        disabled={busyId === evt.id}
                        onClick={() => handleApprove(evt.id)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        title="Reject"
                        disabled={busyId === evt.id}
                        onClick={() => handleReject(evt.id)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-600/20 text-red-400 hover:bg-red-600/30"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {!evt.cancelled && evt.approvalStatus === 'approved' && (
                    <button
                      type="button"
                      title={evt.featured ? 'Unfeature' : 'Feature'}
                      onClick={() => setFeatured({ eventId: evt.id, featured: !evt.featured })}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-600/20 text-amber-400"
                    >
                      {evt.featured ? 'Unfeature' : 'Feature'}
                    </button>
                  )}
                  <button
                    type="button"
                    title="View registrations"
                    onClick={() => setRegistrationsEvent(evt)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-[#818cf8] hover:bg-[#2d2e3e] transition-colors"
                  >
                    <Eye size={13} />
                  </button>
                  {!evt.cancelled && (
                    <button
                      type="button"
                      title="Manage event"
                      onClick={() => setEditEvent(evt)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-[#818cf8] hover:bg-[#2d2e3e] transition-colors"
                    >
                      <Settings2 size={13} />
                    </button>
                  )}
                  {evt.cancelled ? (
                    <button
                      type="button"
                      title="Restore event"
                      disabled={busyId === evt.id}
                      onClick={() => setConfirm({ action: 'restore', event: evt })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-emerald-400 hover:bg-[#2d2e3e] transition-colors disabled:opacity-50"
                    >
                      {busyId === evt.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                    </button>
                  ) : (
                    <button
                      type="button"
                      title="Cancel event"
                      disabled={busyId === evt.id}
                      onClick={() => setConfirm({ action: 'cancel', event: evt })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-red-400 hover:bg-[#2d2e3e] transition-colors disabled:opacity-50"
                    >
                      {busyId === evt.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && userOptions.length > 0 && (
        <EventFormModal
          mode="create"
          users={userOptions}
          defaultType={webinarsOnly ? 'webinar' : undefined}
          onClose={() => setShowCreate(false)}
          onDone={(type, message) => setBanner({ type, message })}
        />
      )}

      {editEvent && userOptions.length > 0 && (
        <EventFormModal
          mode="edit"
          event={editEvent}
          users={userOptions}
          onClose={() => setEditEvent(null)}
          onDone={(type, message) => setBanner({ type, message })}
        />
      )}

      {registrationsEvent && (
        <RegistrationsModal event={registrationsEvent} onClose={() => setRegistrationsEvent(null)} />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.action === 'cancel' ? 'Cancel event?' : 'Restore event?'}
          message={
            confirm.action === 'cancel'
              ? `"${confirm.event.title}" will be hidden from the public events page. Registrations are preserved and you can restore it later.`
              : `"${confirm.event.title}" will be visible again on the public events page.`
          }
          confirmLabel={confirm.action === 'cancel' ? 'Cancel Event' : 'Restore'}
          confirmClass={
            confirm.action === 'cancel'
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
          loading={cancelling || restoring}
        />
      )}
      </div>
      {!webinarsOnly && <AdminEventsRevenueSidebar />}
      </div>
    </div>
  )
}
