import { useMemo, useState } from 'react'
import {
  CalendarDays,
  RefreshCw,
  Search,
  Loader2,
  Eye,
  RotateCcw,
  XCircle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  useListAdminBookingsQuery,
  useGetBookingAnalyticsQuery,
  useGetMentorAvailabilityQuery,
  useGetAdminBookingQuery,
  useConfirmAdminBookingMutation,
  useCompleteAdminBookingMutation,
  useCancelAdminBookingMutation,
  useRequestBookingRefundMutation,
  useApproveBookingRefundMutation,
  useRejectBookingRefundMutation,
  BOOKING_STATUS_COLORS,
  bookingStatusLabel,
  type MentorshipBooking,
  type BookingAnalytics,
} from '../../api/adminBookingsApi'
import { extractApiError } from '../../lib/extractApiError'

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
    gray: 'bg-[#2d2e3e] text-[#8b8ca8]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[color] ?? map.gray}`}>
      {children}
    </span>
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
      <p>{message}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-[#8b8ca8] hover:text-white shrink-0">
          ✕
        </button>
      )}
    </div>
  )
}

function BookingDetailModal({
  bookingId,
  onClose,
  onAction,
}: {
  bookingId: string
  onClose: () => void
  onAction: (type: 'success' | 'error', msg: string) => void
}) {
  const { data: booking, isLoading, refetch } = useGetAdminBookingQuery(bookingId)
  const [confirm, { isLoading: confirming }] = useConfirmAdminBookingMutation()
  const [complete, { isLoading: completing }] = useCompleteAdminBookingMutation()
  const [cancel, { isLoading: cancelling }] = useCancelAdminBookingMutation()
  const [requestRefund, { isLoading: requesting }] = useRequestBookingRefundMutation()
  const [approveRefund, { isLoading: approving }] = useApproveBookingRefundMutation()
  const [rejectRefund, { isLoading: rejecting }] = useRejectBookingRefundMutation()

  async function run(action: () => Promise<unknown>, successMsg: string) {
    try {
      await action()
      onAction('success', successMsg)
      refetch()
    } catch (err) {
      onAction('error', extractApiError(err))
    }
  }

  if (isLoading || !booking) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-400" size={32} />
      </div>
    )
  }

  const b = booking
  const busy = confirming || completing || cancelling || requesting || approving || rejecting

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#2d2e3e] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">{b.bookingCode}</h3>
            <p className="text-xs text-[#8b8ca8] mt-0.5">Booking details</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Av name={b.mentorDisplayName} size={40} />
            <div>
              <p className="text-sm font-semibold text-white">{b.mentorDisplayName}</p>
              <p className="text-[10px] text-[#5c5d72]">Mentor</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#12131c] border border-[#2d2e3e]">
              <p className="text-[#5c5d72] mb-1">Learner</p>
              <p className="text-white font-medium">{b.learnerDisplayName}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#12131c] border border-[#2d2e3e]">
              <p className="text-[#5c5d72] mb-1">Scheduled</p>
              <p className="text-white font-medium">{b.scheduledDateLabel}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#12131c] border border-[#2d2e3e]">
              <p className="text-[#5c5d72] mb-1">Duration</p>
              <p className="text-white font-medium">{b.durationLabel}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#12131c] border border-[#2d2e3e]">
              <p className="text-[#5c5d72] mb-1">Amount</p>
              <p className="text-violet-300 font-semibold">{b.amountLabel}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill color={BOOKING_STATUS_COLORS[b.status] ?? 'gray'}>{bookingStatusLabel(b.status)}</Pill>
            {b.refundStatus !== 'none' && (
              <Pill color="amber">Refund: {b.refundStatus}</Pill>
            )}
          </div>
          {b.notes && <p className="text-xs text-[#a5a6bb] bg-[#12131c] p-3 rounded-lg border border-[#2d2e3e]">{b.notes}</p>}
        </div>
        <div className="px-6 py-4 border-t border-[#2d2e3e] flex flex-wrap gap-2">
          {b.status === 'pending' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => confirm(b.id).unwrap(), 'Booking confirmed')}
              className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-semibold hover:bg-blue-500/30 disabled:opacity-50"
            >
              Confirm
            </button>
          )}
          {b.status === 'confirmed' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => complete(b.id).unwrap(), 'Marked completed')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold disabled:opacity-50"
            >
              Complete
            </button>
          )}
          {!['cancelled', 'refunded', 'completed'].includes(b.status) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => cancel(b.id).unwrap(), 'Booking cancelled')}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          {['cancelled', 'completed', 'confirmed'].includes(b.status) && b.refundStatus === 'none' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => requestRefund(b.id).unwrap(), 'Refund requested')}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold disabled:opacity-50 flex items-center gap-1"
            >
              <RotateCcw size={12} /> Request refund
            </button>
          )}
          {(b.status === 'refund_requested' || b.refundStatus === 'requested') && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => approveRefund(b.id).unwrap(), 'Refund approved')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold disabled:opacity-50"
              >
                Approve refund
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => rejectRefund(b.id).unwrap(), 'Refund rejected')}
                className="px-3 py-1.5 rounded-lg bg-[#2d2e3e] text-[#8b8ca8] text-xs font-semibold disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

type ViewTab = 'bookings' | 'availability' | 'analytics'
type StatusFilter = 'all' | 'scheduled' | 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'refunds'

export function AdminBookingsPanel() {
  const [viewTab, setViewTab] = useState<ViewTab>('bookings')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [expandedMentor, setExpandedMentor] = useState<string | null>(null)

  const queryParams = useMemo(() => {
    if (statusFilter === 'refunds') {
      return { filter: 'refunds', q: search }
    }
    if (statusFilter === 'scheduled') {
      return { filter: 'scheduled', q: search }
    }
    return {
      status: statusFilter === 'all' ? 'all' : statusFilter,
      q: search,
    }
  }, [statusFilter, search])

  const { data: bookings = [], isLoading, isFetching, refetch } = useListAdminBookingsQuery(queryParams, {
    pollingInterval: 15000,
  })
  const { data: analytics } = useGetBookingAnalyticsQuery(undefined, { pollingInterval: 20000 })
  const { data: availability = [] } = useGetMentorAvailabilityQuery(undefined, {
    skip: viewTab !== 'availability',
  })

  const [approveRefund] = useApproveBookingRefundMutation()

  async function quickApproveRefund(id: string) {
    try {
      await approveRefund(id).unwrap()
      setBanner({ type: 'success', message: 'Refund approved' })
      refetch()
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    }
  }

  const stats: BookingAnalytics = analytics ?? {
    totalBookings: bookings.length,
    confirmedCount: 0,
    pendingCount: 0,
    scheduledCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    refundRequestedCount: 0,
    refundedCount: 0,
    revenueCents: 0,
    revenueLabel: '$0.00',
    refundedCents: 0,
    refundedLabel: '$0.00',
    pendingRefundCents: 0,
    pendingRefundLabel: '$0.00',
    bookingsByStatus: {},
    revenueTrend: [],
  }

  const maxTrend = Math.max(...(stats.revenueTrend?.map((p) => p.amountCents) ?? [1]), 1)

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarDays size={20} className="text-violet-400" />
              Mentorship Bookings
            </h2>
            <p className="text-xs text-[#8b8ca8] mt-1">
              {stats.totalBookings} bookings · manage scheduling, refunds & revenue
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>

        {banner && (
          <div className="mb-4">
            <AlertBanner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-5">
          {[
            { l: 'Total', v: stats.totalBookings, icon: <CalendarDays size={14} /> },
            { l: 'Scheduled', v: stats.scheduledCount, icon: <Clock size={14} /> },
            { l: 'Confirmed', v: stats.confirmedCount, icon: <CheckCircle2 size={14} /> },
            { l: 'Completed', v: stats.completedCount, icon: <CheckCircle2 size={14} /> },
            { l: 'Cancelled', v: stats.cancelledCount, icon: <XCircle size={14} /> },
            { l: 'Revenue', v: stats.revenueLabel, icon: <DollarSign size={14} /> },
          ].map((c) => (
            <div key={c.l} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
              <div className="flex items-center gap-2 text-[#8b8ca8] mb-2">{c.icon}<span className="text-[10px] font-semibold uppercase tracking-wider">{c.l}</span></div>
              <p className="text-xl font-bold text-white">{c.v}</p>
            </div>
          ))}
        </div>

        {(stats.refundRequestedCount ?? 0) > 0 && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <RotateCcw size={16} className="text-amber-400 shrink-0" />
            <p className="text-xs text-amber-200">
              <span className="font-semibold">{stats.refundRequestedCount} refund request(s)</span>
              {' '}pending · {stats.pendingRefundLabel} at risk
            </p>
            <button
              type="button"
              onClick={() => setStatusFilter('refunds')}
              className="ml-auto text-[10px] font-semibold text-amber-300 hover:text-white shrink-0"
            >
              Review
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(['bookings', 'availability', 'analytics'] as ViewTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setViewTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize ${
                viewTab === t
                  ? 'bg-violet-600 text-white'
                  : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {viewTab === 'bookings' && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {(['all', 'scheduled', 'confirmed', 'pending', 'completed', 'cancelled', 'refunds'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                    statusFilter === s
                      ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200'
                      : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="relative mb-4 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search booking ID, mentor, learner…"
                className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-[#5c5d72] focus:border-[#818cf8] focus:outline-none"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-violet-400" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-12 text-center">
                <CalendarDays size={40} className="mx-auto text-[#2d2e3e] mb-3" />
                <p className="text-sm font-semibold text-white">No bookings yet</p>
                <p className="text-xs text-[#5c5d72] mt-2">Restart mentor-service with local profile to seed demo bookings.</p>
              </div>
            ) : (
              <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#2d2e3e] bg-[#12131c]">
                      {['Booking ID', 'Mentor', 'Learner', 'Duration', 'Rate', 'Date', 'Amount', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c1d2a]">
                    {bookings.map((b) => (
                      <BookingRow
                        key={b.id}
                        booking={b}
                        onView={() => setDetailId(b.id)}
                        onApproveRefund={() => quickApproveRefund(b.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {viewTab === 'availability' && (
          <div className="space-y-3">
            {availability.length === 0 ? (
              <p className="text-sm text-[#5c5d72]">No mentor availability configured.</p>
            ) : (
              availability.map((m) => (
                <div key={m.mentorId} className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedMentor(expandedMentor === m.mentorId ? null : m.mentorId)}
                    className="w-full px-5 py-4 flex items-center gap-3 hover:bg-[#1c1d2a]/50 text-left"
                  >
                    <Av name={m.mentorDisplayName} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{m.mentorDisplayName}</p>
                      <p className="text-[10px] text-[#5c5d72]">
                        {m.activeSlotCount} weekly slots · {m.mentorAvailable ? 'Accepting bookings' : 'Unavailable'}
                      </p>
                    </div>
                    <Pill color={m.mentorAvailable ? 'green' : 'gray'}>
                      {m.mentorAvailable ? 'Available' : 'Off'}
                    </Pill>
                    {expandedMentor === m.mentorId ? <ChevronUp size={16} className="text-[#5c5d72]" /> : <ChevronDown size={16} className="text-[#5c5d72]" />}
                  </button>
                  {expandedMentor === m.mentorId && (
                    <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {m.slots.map((slot) => (
                        <div key={slot.id} className="p-3 rounded-lg bg-[#12131c] border border-[#2d2e3e] text-xs">
                          <p className="font-semibold text-white">{slot.dayLabel}</p>
                          <p className="text-[#8b8ca8] mt-1">
                            {slot.startTime} – {slot.endTime}
                          </p>
                          <p className="text-[10px] text-[#5c5d72] mt-1">{slot.timezone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {viewTab === 'analytics' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
                <p className="text-[10px] text-[#8b8ca8] mb-2 flex items-center gap-1"><TrendingUp size={12} /> Gross revenue</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.revenueLabel}</p>
              </div>
              <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
                <p className="text-[10px] text-[#8b8ca8] mb-2">Refunded</p>
                <p className="text-2xl font-bold text-red-400">{stats.refundedLabel}</p>
              </div>
              <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
                <p className="text-[10px] text-[#8b8ca8] mb-2">Pending refunds</p>
                <p className="text-2xl font-bold text-amber-400">{stats.pendingRefundLabel}</p>
              </div>
              <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
                <p className="text-[10px] text-[#8b8ca8] mb-2 flex items-center gap-1"><Users size={12} /> Pending</p>
                <p className="text-2xl font-bold text-white">{stats.pendingCount}</p>
              </div>
            </div>
            <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Revenue trend (7 days)</h3>
              <div className="flex items-end gap-2 h-32">
                {(stats.revenueTrend ?? []).map((point) => (
                  <div key={point.label} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-violet-500/60 rounded-t min-h-[4px]"
                      style={{ height: `${Math.max(8, (point.amountCents / maxTrend) * 100)}%` }}
                      title={formatCents(point.amountCents)}
                    />
                    <span className="text-[9px] text-[#5c5d72]">{point.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {analytics?.bookingsByStatus && (
              <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">Bookings by status</h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(analytics.bookingsByStatus).map(([status, count]) => (
                    <div key={status} className="px-4 py-2 rounded-lg bg-[#12131c] border border-[#2d2e3e]">
                      <Pill color={BOOKING_STATUS_COLORS[status] ?? 'gray'}>{bookingStatusLabel(status)}</Pill>
                      <p className="text-lg font-bold text-white mt-2 text-center">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {detailId && (
        <BookingDetailModal
          bookingId={detailId}
          onClose={() => setDetailId(null)}
          onAction={(type, msg) => {
            setBanner({ type, message: msg })
            if (type === 'success') refetch()
          }}
        />
      )}
    </div>
  )
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function BookingRow({
  booking,
  onView,
  onApproveRefund,
}: {
  booking: MentorshipBooking
  onView: () => void
  onApproveRefund: () => void
}) {
  const showRefund =
    booking.status === 'refund_requested' || booking.refundStatus === 'requested'

  return (
    <tr className="hover:bg-[#1c1d2a]/50">
      <td className="px-4 py-3 text-[10px] text-[#5c5d72] font-mono">{booking.bookingCode}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Av name={booking.mentorDisplayName} size={24} />
          <span className="text-xs text-white max-w-[140px] truncate">{booking.mentorDisplayName}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-[#8b8ca8]">{booking.learnerDisplayName}</td>
      <td className="px-4 py-3 text-xs text-[#8b8ca8]">{booking.durationLabel}</td>
      <td className="px-4 py-3 text-xs text-[#818cf8] font-semibold">{booking.rateLabel}</td>
      <td className="px-4 py-3 text-[10px] text-[#5c5d72]">{booking.scheduledDateLabel}</td>
      <td className="px-4 py-3 text-xs text-white font-medium">{booking.amountLabel}</td>
      <td className="px-4 py-3">
        <Pill color={BOOKING_STATUS_COLORS[booking.status] ?? 'gray'}>
          {bookingStatusLabel(booking.status)}
        </Pill>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={onView} className="text-[#5c5d72] hover:text-white p-1" title="View">
            <Eye size={12} />
          </button>
          {showRefund && (
            <button
              type="button"
              onClick={onApproveRefund}
              className="text-[#5c5d72] hover:text-emerald-400 p-1"
              title="Approve refund"
            >
              <RotateCcw size={12} />
            </button>
          )}
          {booking.status === 'cancelled' && booking.refundStatus === 'none' && (
            <button
              type="button"
              onClick={onView}
              className="text-[#5c5d72] hover:text-amber-400 p-1"
              title="Process refund"
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
