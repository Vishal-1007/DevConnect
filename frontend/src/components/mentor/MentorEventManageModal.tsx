import { useEffect, useMemo, useState } from 'react'
import {
  Calendar, ExternalLink, Loader2, Play, Trash2, Users2, Video, X,
} from 'lucide-react'
import type { CommunityEvent } from '../../api/types'
import {
  useCancelHostedEventMutation,
  useGetHostedEventManageQuery,
  useListHostedEventRegistrationsQuery,
  useUpdateHostedEventMutation,
} from '../../api/mentorEventsApi'
import {
  approvalStatusColors,
  EVENT_CATEGORIES,
  EVENT_TYPES,
  formatLabels,
  typeLabels,
} from '../../data/eventsData'
import { avatarUrl } from '../../lib/avatar'
import { extractApiError } from '../../lib/extractApiError'
import { formatEventDateTime, formatInr } from '../../lib/formatTime'

type Tab = 'overview' | 'edit' | 'participants'

interface MentorEventManageModalProps {
  event: CommunityEvent
  onClose: () => void
  onUpdated: () => void
}

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function MentorEventManageModal({ event: initialEvent, onClose, onUpdated }: MentorEventManageModalProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { data: manage, isLoading, refetch } = useGetHostedEventManageQuery(initialEvent.id)
  const { data: registrations = [], isLoading: loadingRegs } = useListHostedEventRegistrationsQuery(initialEvent.id)
  const [updateEvent, { isLoading: saving }] = useUpdateHostedEventMutation()
  const [cancelEvent, { isLoading: cancelling }] = useCancelHostedEventMutation()

  const event = manage?.event ?? initialEvent

  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [eventType, setEventType] = useState(event.eventType)
  const [category, setCategory] = useState(event.category)
  const [format, setFormat] = useState(event.format)
  const [locationOrLink, setLocationOrLink] = useState(event.locationOrLink ?? '')
  const [startsAt, setStartsAt] = useState(toLocalInput(event.startsAt))
  const [endsAt, setEndsAt] = useState(toLocalInput(event.endsAt))
  const [maxAttendees, setMaxAttendees] = useState(String(event.maxAttendees))
  const [thumbnailUrl, setThumbnailUrl] = useState(event.thumbnailUrl ?? '')
  const [paid, setPaid] = useState(event.paid ?? false)
  const [priceInr, setPriceInr] = useState(event.priceInr ?? 199)
  const [topicsCovered, setTopicsCovered] = useState(event.topicsCovered ?? '')
  const [requirements, setRequirements] = useState(event.requirements ?? '')

  useEffect(() => {
    if (!manage?.event) return
    const e = manage.event
    setTitle(e.title)
    setDescription(e.description)
    setEventType(e.eventType)
    setCategory(e.category)
    setFormat(e.format)
    setLocationOrLink(e.locationOrLink ?? '')
    setStartsAt(toLocalInput(e.startsAt))
    setEndsAt(toLocalInput(e.endsAt))
    setMaxAttendees(String(e.maxAttendees))
    setThumbnailUrl(e.thumbnailUrl ?? '')
    setPaid(e.paid ?? false)
    setPriceInr(e.priceInr ?? 199)
    setTopicsCovered(e.topicsCovered ?? '')
    setRequirements(e.requirements ?? '')
  }, [manage?.event])

  const isPast = new Date(event.endsAt).getTime() < Date.now()
  const isCompleted = isPast
  const canStart = useMemo(() => {
    const startMs = new Date(event.startsAt).getTime()
    const endMs = new Date(event.endsAt).getTime()
    const now = Date.now()
    return now >= startMs - 30 * 60 * 1000 && now <= endMs && event.approvalStatus === 'approved'
  }, [event.startsAt, event.endsAt, event.approvalStatus])

  const statusLabel = isCompleted
    ? 'Completed'
    : event.approvalStatus === 'pending'
      ? 'Pending Approval'
      : event.approvalStatus === 'rejected'
        ? 'Rejected'
        : 'Approved'

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-xs focus:outline-none focus:border-violet-500'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      await updateEvent({
        eventId: event.id,
        body: {
          title: title.trim(),
          description: description.trim(),
          eventType,
          category,
          format,
          locationOrLink: locationOrLink.trim() || undefined,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          maxAttendees: Number(maxAttendees) || 100,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          paid,
          priceInr: paid ? priceInr : undefined,
          topicsCovered: topicsCovered.trim() || undefined,
          requirements: requirements.trim() || undefined,
        },
      }).unwrap()
      setSuccess('Event updated successfully.')
      refetch()
      onUpdated()
    } catch (err) {
      setError(extractApiError(err))
    }
  }

  async function handleCancel() {
    setError(null)
    try {
      await cancelEvent(event.id).unwrap()
      onUpdated()
      onClose()
    } catch (err) {
      setError(extractApiError(err))
    }
  }

  function handleStartEvent() {
    if (!event.locationOrLink) {
      setError('Add a meeting link before starting the event.')
      return
    }
    if (event.locationOrLink.startsWith('http')) {
      window.open(event.locationOrLink, '_blank', 'noopener,noreferrer')
      return
    }
    if (event.locationOrLink.startsWith('/')) {
      window.open(event.locationOrLink, '_blank', 'noopener,noreferrer')
      return
    }
    window.open(`https://${event.locationOrLink}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 overflow-y-auto">
      <div className="bg-[#161722] border border-violet-500/30 rounded-2xl w-full max-w-3xl shadow-2xl my-auto max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[#2d2e3e] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Manage Event</h2>
            <p className="text-xs text-[#8b8ca8] mt-0.5 line-clamp-1">{event.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b8ca8] hover:text-white hover:bg-[#2d2e3e]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 px-5 pt-4 shrink-0">
          {(['overview', 'edit', 'participants'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                tab === t ? 'dc-gradient-btn text-white' : 'text-[#8b8ca8] hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {isLoading && tab === 'overview' && (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-violet-400" />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 mb-4">
              {success}
            </p>
          )}

          {tab === 'overview' && !isLoading && (
            <div className="space-y-4">
              <div className="dc-glass-card rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    approvalStatusColors[event.approvalStatus ?? 'approved'] ?? 'text-emerald-400'
                  }`}>
                    {statusLabel}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300">
                    {typeLabels[event.eventType] ?? event.eventType}
                  </span>
                  <span className="text-[10px] text-[#8b8ca8]">
                    {formatLabels[event.format] ?? event.format}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{event.title}</h3>
                <p className="text-xs text-[#8b8ca8] leading-relaxed">{event.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="dc-glass-card rounded-xl p-3 text-center">
                  <Users2 size={16} className="mx-auto text-violet-400 mb-1" />
                  <p className="text-lg font-bold text-white">{manage?.totalRegistrations ?? event.attendeeCount}</p>
                  <p className="text-[10px] text-[#8b8ca8]">Registrations</p>
                </div>
                <div className="dc-glass-card rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-white">{formatInr(manage?.revenueInr ?? 0)}</p>
                  <p className="text-[10px] text-[#8b8ca8]">Revenue</p>
                </div>
                <div className="dc-glass-card rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-emerald-400">{formatInr(manage?.mentorEarningsInr ?? 0)}</p>
                  <p className="text-[10px] text-[#8b8ca8]">Your share (60%)</p>
                </div>
                <div className="dc-glass-card rounded-xl p-3 text-center">
                  <Calendar size={16} className="mx-auto text-violet-400 mb-1" />
                  <p className="text-[10px] font-semibold text-white">{formatEventDateTime(event.startsAt)}</p>
                  <p className="text-[10px] text-[#8b8ca8]">Start</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canStart}
                  onClick={handleStartEvent}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl dc-gradient-btn text-white text-xs font-semibold disabled:opacity-40"
                >
                  <Play size={14} />
                  Start Event
                </button>
                {!canStart && !isPast && event.approvalStatus === 'approved' && (
                  <span className="text-[10px] text-[#8b8ca8] self-center">
                    Available 30 minutes before start
                  </span>
                )}
                {event.locationOrLink && (
                  <a
                    href={event.locationOrLink.startsWith('http') ? event.locationOrLink : `https://${event.locationOrLink}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#2d2e3e] text-[#8b8ca8] text-xs hover:text-white"
                  >
                    <ExternalLink size={13} />
                    Meeting link
                  </a>
                )}
              </div>

              {!confirmCancel ? (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
                >
                  <Trash2 size={13} />
                  Cancel event
                </button>
              ) : (
                <div className="dc-glass-card rounded-xl p-4 border border-red-500/30">
                  <p className="text-sm text-white font-medium mb-2">Are you sure you want to cancel this event?</p>
                  <p className="text-xs text-[#8b8ca8] mb-3">All registered users will be notified.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={handleCancel}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold disabled:opacity-50"
                    >
                      {cancelling ? 'Cancelling…' : 'Yes, cancel event'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(false)}
                      className="px-3 py-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] text-xs"
                    >
                      Keep event
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'edit' && (
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-[10px] text-[#8b8ca8] mb-1 block">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className="text-[10px] text-[#8b8ca8] mb-1 block">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#8b8ca8] mb-1 block">Type</label>
                  <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputClass}>
                    {EVENT_TYPES.filter((t) => t.id !== 'all').map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#8b8ca8] mb-1 block">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                    {EVENT_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#8b8ca8] mb-1 block">Start</label>
                  <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] text-[#8b8ca8] mb-1 block">End</label>
                  <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#8b8ca8] mb-1 block">Meeting link</label>
                <input value={locationOrLink} onChange={(e) => setLocationOrLink(e.target.value)} className={inputClass} placeholder="https://meet.google.com/…" />
              </div>
              <div>
                <label className="text-[10px] text-[#8b8ca8] mb-1 block">Thumbnail URL</label>
                <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#8b8ca8] mb-1 block">Max attendees</label>
                  <input type="number" min={1} value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] text-[#8b8ca8] mb-1 block">Price (INR)</label>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="accent-violet-500" />
                    <input type="number" min={1} disabled={!paid} value={priceInr} onChange={(e) => setPriceInr(Number(e.target.value))} className={inputClass} />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl dc-gradient-btn text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                Save changes
              </button>
            </form>
          )}

          {tab === 'participants' && (
            <div>
              {loadingRegs ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-violet-400" />
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-12 text-[#8b8ca8] text-sm">
                  <Video size={32} className="mx-auto mb-2 opacity-40" />
                  No registrations yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[#8b8ca8] border-b border-[#2d2e3e]">
                        <th className="text-left py-2 pr-3 font-medium">User</th>
                        <th className="text-left py-2 pr-3 font-medium">Email</th>
                        <th className="text-left py-2 pr-3 font-medium">Registered</th>
                        <th className="text-left py-2 font-medium">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((reg) => (
                        <tr key={reg.userId} className="border-b border-[#2d2e3e]/50">
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2">
                              <img src={avatarUrl(reg.displayName, 28)} alt="" className="w-7 h-7 rounded-full" />
                              <span className="text-white font-medium">{reg.displayName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 text-[#8b8ca8]">{reg.username}</td>
                          <td className="py-2.5 pr-3 text-[#8b8ca8]">
                            {formatEventDateTime(reg.registeredAt)}
                          </td>
                          <td className="py-2.5">
                            <span className={`capitalize ${
                              reg.paymentStatus === 'completed' ? 'text-emerald-400' : 'text-[#8b8ca8]'
                            }`}>
                              {reg.paymentStatus === 'free' ? 'FREE' : reg.paymentStatus}
                              {reg.amountPaidInr > 0 ? ` · ${formatInr(reg.amountPaidInr)}` : ''}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
