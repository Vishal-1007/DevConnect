/**
 * MentorBookingsPanel — session calendar, reminders, rescheduling, and recurring plans.
 */
import { useMemo, useState } from 'react'
import {
  CalendarDays, RefreshCw, Check, Play, XCircle, Loader2, Clock, Bell,
  Download, Calendar, Repeat, ChevronRight, Globe, AlertTriangle,
} from 'lucide-react'
import type { MentorshipBooking } from '../../api/adminBookingsApi'
import {
  useGetMentorBookingsQuery,
  useGetMentorBookingsOverviewQuery,
  useConfirmMentorBookingMutation,
  useCompleteMentorBookingMutation,
  useCancelMentorBookingMutation,
  useRescheduleMentorBookingMutation,
} from '../../api/mentorWorkspaceApi'
import { downloadBookingsCalendar, requestBrowserReminder } from '../../lib/mentorCalendar'

type BookingFilter = 'all' | 'upcoming' | 'pending' | 'confirmed' | 'completed' | 'cancelled'

const FILTERS: { id: BookingFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  const m: Record<string, string> = {
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    red: 'bg-red-500/15 text-red-400 border-red-500/25',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    violet: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8] border-[#3d3e52]',
  }
  return <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${m[color] ?? m.gray}`}>{children}</span>
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    pending: 'amber', confirmed: 'blue', completed: 'green', cancelled: 'red',
  }
  return map[status] ?? 'gray'
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function RescheduleModal({ booking, onClose }: { booking: MentorshipBooking; onClose: () => void }) {
  const [reschedule, { isLoading }] = useRescheduleMentorBookingMutation()
  const [datetime, setDatetime] = useState(() => {
    const d = new Date(booking.scheduledAt)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  })
  const [confirmNow, setConfirmNow] = useState(booking.status === 'pending')

  const save = async () => {
    await reschedule({
      bookingId: booking.id,
      scheduledAt: new Date(datetime).toISOString(),
      confirmImmediately: confirmNow,
    }).unwrap()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-[#2d2e3e]">
          <h3 className="text-sm font-bold text-white">Reschedule Session</h3>
          <p className="text-xs text-[#5c5d72] mt-1">with {booking.learnerDisplayName}</p>
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
          {booking.timezone && (
            <p className="text-[10px] text-[#5c5d72] flex items-center gap-1"><Globe size={10} /> Timezone: {booking.timezone}</p>
          )}
          <label className="flex items-center gap-2 text-xs text-[#8b8ca8] cursor-pointer">
            <input type="checkbox" checked={confirmNow} onChange={(e) => setConfirmNow(e.target.checked)} className="rounded accent-violet-500" />
            Confirm booking immediately
          </label>
          <button
            type="button"
            onClick={save}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-lg"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CalendarDays size={14} />}
            Save New Time
          </button>
        </div>
      </div>
    </div>
  )
}

export function MentorBookingsPanel() {
  const [filter, setFilter] = useState<BookingFilter>('all')
  const [rescheduleBooking, setRescheduleBooking] = useState<MentorshipBooking | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const { data: overview, refetch: refetchOverview } = useGetMentorBookingsOverviewQuery()
  const { data: bookings = [], isLoading, refetch, isFetching } = useGetMentorBookingsQuery({
    status: filter === 'all' ? 'all' : filter,
    limit: 100,
  })
  const [confirmBooking] = useConfirmMentorBookingMutation()
  const [completeBooking] = useCompleteMentorBookingMutation()
  const [cancelBooking] = useCancelMentorBookingMutation()

  const counts = overview ?? {
    confirmedCount: 0, pendingCount: 0, completedCount: 0, cancelledCount: 0, upcomingCount: 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, reminders: [], recurringPlans: [],
  }

  const sorted = useMemo(() =>
    [...bookings].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
  [bookings])

  const runAction = async (id: string, fn: () => Promise<unknown>) => {
    setActionId(id)
    try { await fn() } finally { setActionId(null) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Confirmed', count: counts.confirmedCount, color: 'blue' },
          { label: 'Pending', count: counts.pendingCount, color: 'amber' },
          { label: 'Completed', count: counts.completedCount, color: 'green' },
          { label: 'Cancelled', count: counts.cancelledCount, color: 'red' },
        ].map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setFilter(s.label.toLowerCase() as BookingFilter)}
            className={`bg-[#161722] border rounded-xl p-4 text-left transition-colors ${
              filter === s.label.toLowerCase() ? 'border-violet-500/40' : 'border-[#2d2e3e] hover:border-[#3d3e52]'
            }`}
          >
            <p className="text-2xl font-bold text-white">{s.count}</p>
            <Pill color={s.color}>{s.label}</Pill>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              filter === f.id
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                : 'bg-[#161722] border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-[#5c5d72] flex items-center gap-1"><Globe size={10} /> {counts.timezone}</span>
          <button
            type="button"
            onClick={() => downloadBookingsCalendar(bookings, counts.timezone)}
            className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white"
          >
            <Download size={11} /> Export ICS
          </button>
          <button type="button" onClick={() => { refetch(); refetchOverview() }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white">
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {counts.reminders.length > 0 && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-violet-400" />
            <h3 className="text-xs font-bold text-white">Upcoming Reminders (24h)</h3>
          </div>
          <div className="space-y-2">
            {counts.reminders.map((r) => (
              <div key={r.bookingId} className="flex items-center gap-3 bg-[#161722]/60 rounded-lg px-3 py-2">
                <Clock size={12} className="text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{r.title}</p>
                  <p className="text-[10px] text-[#5c5d72]">{r.learnerName} · {r.scheduledLabel}</p>
                </div>
                <Pill color="amber">{r.reminderLabel}</Pill>
                <button
                  type="button"
                  onClick={() => requestBrowserReminder(r.title, r.scheduledAt)}
                  className="text-[9px] font-semibold px-2 py-1 rounded bg-violet-600/20 text-violet-300 hover:bg-violet-600 hover:text-white"
                >
                  Remind me
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {counts.recurringPlans.length > 0 && (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Repeat size={14} className="text-cyan-400" />
            <h3 className="text-xs font-bold text-white">Recurring Mentorship Plans</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {counts.recurringPlans.map((p) => (
              <div key={p.id} className="bg-[#12131a] border border-[#2d2e3e] rounded-lg p-3">
                <p className="text-xs font-semibold text-white">{p.title}</p>
                <p className="text-[10px] text-[#5c5d72] mt-0.5">with {p.learnerName}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Pill color="cyan">{p.frequencyLabel}</Pill>
                  <Pill color="violet">{p.dayLabel} · {p.startTime}</Pill>
                  <Pill color={p.status === 'active' ? 'green' : 'gray'}>{p.status}</Pill>
                </div>
                <p className="text-[9px] text-emerald-400 mt-2">Next: {p.nextSessionLabel}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
          <CalendarDays size={40} className="mx-auto text-[#3d3e52] mb-3" />
          <p className="text-sm font-semibold text-white">No bookings in this view</p>
          <p className="text-xs text-[#5c5d72] mt-1">Sessions appear here when learners schedule with you.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((b) => {
            const dateParts = (b.scheduledDateLabel ?? '').split(',')
            const dayName = dateParts[0]?.trim().toUpperCase() ?? '—'
            const dayNum = dateParts[1]?.trim().split(' ')[1] ?? '—'
            const title = b.requestMessage?.trim() || b.notes?.trim() || `Session with ${b.learnerDisplayName}`
            const timeLabel = b.scheduledTimeLabel ?? new Date(b.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            const busy = actionId === b.id

            return (
              <div key={b.id} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 flex items-center gap-4 hover:border-[#3d3e52] transition-colors">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex flex-col items-center justify-center shrink-0 border border-violet-500/20">
                  <p className="text-[10px] font-bold text-violet-400">{dayName}</p>
                  <p className="text-sm font-bold text-white">{dayNum}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{title}</p>
                  <p className="text-xs text-[#5c5d72]">
                    with {b.learnerDisplayName} · {timeLabel} · {b.durationLabel} · {b.amountLabel}
                  </p>
                  {b.requestTypeLabel && (
                    <p className="text-[10px] text-violet-400 mt-0.5">{b.requestTypeLabel}</p>
                  )}
                </div>
                <Pill color={statusColor(b.status)}>{statusLabel(b.status)}</Pill>
                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                  {(b.status === 'pending' || b.status === 'confirmed') && (
                    <button
                      type="button"
                      onClick={() => setRescheduleBooking(b)}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600 hover:text-white"
                    >
                      <Calendar size={11} /> Reschedule
                    </button>
                  )}
                  {b.status === 'pending' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => runAction(b.id, () => confirmBooking(b.id).unwrap())}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                    >
                      {busy ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Confirm
                    </button>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => runAction(b.id, () => completeBooking(b.id).unwrap())}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                    >
                      {busy ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />} Complete
                    </button>
                  )}
                  {(b.status === 'pending' || b.status === 'confirmed') && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => runAction(b.id, () => cancelBooking(b.id).unwrap())}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-50"
                    >
                      <XCircle size={11} /> Cancel
                    </button>
                  )}
                  {b.upcoming && (
                    <button
                      type="button"
                      onClick={() => requestBrowserReminder(title, b.scheduledAt)}
                      title="Set browser reminder"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-violet-400 hover:bg-[#2d2e3e]"
                    >
                      <Bell size={12} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {rescheduleBooking && (
        <RescheduleModal booking={rescheduleBooking} onClose={() => setRescheduleBooking(null)} />
      )}
    </div>
  )
}
