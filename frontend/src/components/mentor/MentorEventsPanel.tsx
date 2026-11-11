/**
 * MentorEventsPanel — host events, track earnings, and volunteer on platform events.
 */
import { useMemo, useState } from 'react'
import {
  Calendar, Crown, Loader2, Plus, RefreshCw, Search, TrendingUp, Users2, Wallet,
} from 'lucide-react'
import {
  useGetMentorEventDashboardQuery,
  useListHostedEventsQuery,
  useRequestEventWithdrawalMutation,
} from '../../api/mentorEventsApi'
import { MentorPanelShell, MENTOR_STAT_GRID } from './MentorPanelShell'
import { MentorCreateEventModal } from './MentorCreateEventModal'
import { MentorEventManageModal } from './MentorEventManageModal'
import type { CommunityEvent } from '../../api/types'
import {
  approvalStatusColors,
  defaultEventThumbnail,
  formatLabels,
  typeLabels,
} from '../../data/eventsData'
import { formatEventDateTime, formatInr } from '../../lib/formatTime'
import { extractApiError } from '../../lib/extractApiError'

type Tab = 'hosted' | 'volunteer'

export function MentorEventsPanel() {
  const [tab, setTab] = useState<Tab>('hosted')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [manageEvent, setManageEvent] = useState<CommunityEvent | null>(null)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  const { data: dashboard, refetch: refetchDashboard } = useGetMentorEventDashboardQuery()
  const { data: hostedEvents = [], isLoading, refetch, isFetching } = useListHostedEventsQuery(50)
  const [requestWithdraw, { isLoading: withdrawing }] = useRequestEventWithdrawalMutation()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return hostedEvents
    return hostedEvents.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    )
  }, [hostedEvents, search])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function handleWithdraw() {
    setError('')
    const amount = Number(withdrawAmount)
    if (!amount || amount <= 0) {
      setError('Enter a valid amount.')
      return
    }
    try {
      await requestWithdraw(amount).unwrap()
      setWithdrawAmount('')
      showToast('Withdrawal request submitted.')
      refetchDashboard()
    } catch (err) {
      setError(extractApiError(err))
    }
  }

  const stats = [
    { label: 'Total Events', value: dashboard?.totalEvents ?? 0, trend: '+20%' },
    { label: 'Upcoming', value: dashboard?.upcomingEvents ?? 0, trend: '+25%' },
    { label: 'Total Students', value: dashboard?.totalStudents ?? 0, trend: '+18%' },
    { label: 'Total Revenue', value: formatInr(dashboard?.totalRevenueInr ?? 0), trend: '+22%' },
  ]

  return (
    <MentorPanelShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">My Events</h2>
          <p className="text-xs text-[#8b8ca8] mt-0.5">Create paid or free events and track your earnings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl dc-gradient-btn text-white text-xs font-bold"
          >
            <Plus size={14} />
            Create Event
          </button>
          <button
            type="button"
            onClick={() => { refetch(); refetchDashboard() }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {toast && (
        <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-xl px-4 py-3 text-xs text-emerald-400 font-semibold">
          {toast}
        </div>
      )}

      <div className={`${MENTOR_STAT_GRID} lg:grid-cols-5`}>
        {stats.map((s) => (
          <div key={s.label} className="dc-glass-card rounded-2xl p-4">
            <p className="text-[10px] text-[#8b8ca8] mb-1">{s.label}</p>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-0.5">
              <TrendingUp size={10} />
              {s.trend}
            </p>
          </div>
        ))}
        <div className="dc-glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-[#8b8ca8] mb-1">Available Balance</p>
            <p className="text-xl font-bold text-violet-300">{formatInr(dashboard?.availableBalanceInr ?? 0)}</p>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              min={1}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 px-2 py-1.5 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-xs"
            />
            <button
              type="button"
              disabled={withdrawing}
              onClick={handleWithdraw}
              className="px-3 py-1.5 rounded-lg dc-gradient-btn text-white text-[10px] font-bold disabled:opacity-50 flex items-center gap-1"
            >
              {withdrawing ? <Loader2 size={11} className="animate-spin" /> : <Wallet size={11} />}
              Withdraw
            </button>
          </div>
          {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setTab('hosted')}
              className={`px-4 py-2 rounded-full text-xs font-semibold ${
                tab === 'hosted' ? 'dc-gradient-btn text-white' : 'dc-glass-card text-[#8b8ca8]'
              }`}
            >
              My Hosted Events
            </button>
          </div>

          <div className="relative mb-4">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your events…"
              className="w-full bg-[#161722]/80 border border-[#2d2e3e] rounded-xl pl-8 pr-3 py-2.5 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-violet-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 dc-glass-card rounded-2xl">
              <Calendar size={40} className="text-[#3d3e52] mx-auto mb-3" />
              <p className="text-sm text-white font-semibold mb-1">No hosted events yet</p>
              <p className="text-xs text-[#5c5d72] mb-4">Create your first webinar, workshop, or meetup</p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded-xl dc-gradient-btn text-white text-xs font-semibold"
              >
                + Create Event
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((event) => {
                const thumb = event.thumbnailUrl ?? defaultEventThumbnail(event.category, event.eventType)
                const isPast = new Date(event.endsAt).getTime() < Date.now()
                return (
                  <div
                    key={event.id}
                    className="dc-glass-card rounded-2xl p-4 hover:border-violet-500/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      <img src={thumb} alt="" className="w-full sm:w-36 h-24 sm:h-20 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">{event.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
                            {typeLabels[event.eventType] ?? event.eventType}
                          </span>
                          {event.approvalStatus && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${approvalStatusColors[event.approvalStatus] ?? ''}`}>
                              {event.approvalStatus === 'pending' ? 'Pending Approval' : event.approvalStatus}
                            </span>
                          )}
                          {event.paid && (
                            <span className="text-[10px] text-violet-300 font-semibold">{formatInr(event.priceInr ?? 0)}</span>
                          )}
                        </div>
                        <p className="text-xs text-[#8b8ca8] line-clamp-2 mb-2">{event.description}</p>
                        <div className="flex flex-wrap gap-3 text-[10px] text-[#5c5d72]">
                          <span>{formatEventDateTime(event.startsAt)}</span>
                          <span>{formatLabels[event.format] ?? event.format}</span>
                          <span className="flex items-center gap-1">
                            <Users2 size={11} />
                            {event.attendeeCount}/{event.maxAttendees}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-[#2d2e3e] max-w-xs overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${Math.min(100, (event.attendeeCount / event.maxAttendees) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 flex sm:flex-col items-end justify-between gap-2">
                        {!isPast && event.approvalStatus === 'approved' && (
                          <span className="text-[10px] text-emerald-400 font-semibold">Live soon</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setManageEvent(event)}
                          className="text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:border-violet-500/40"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="dc-glass-card rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-4">Earnings Overview</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8b8ca8]">Total sales</span>
                <span className="text-white font-semibold">{formatInr(dashboard?.totalRevenueInr ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b8ca8]">Your earnings (60%)</span>
                <span className="text-emerald-400 font-semibold">{formatInr(dashboard?.mentorEarningsInr ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b8ca8]">Platform fee (40%)</span>
                <span className="text-violet-300 font-semibold">{formatInr(dashboard?.platformFeeInr ?? 0)}</span>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-[#2d2e3e] overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: '60%' }} />
              <div className="h-full bg-violet-500" style={{ width: '40%' }} />
            </div>
          </div>

          <div className="dc-glass-card rounded-2xl p-4 text-center">
            <Crown className="w-8 h-8 text-violet-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white mb-1">Pro Mentor</p>
            <p className="text-[10px] text-[#8b8ca8] mb-3">Unlock featured listings and priority support</p>
            <button type="button" className="w-full py-2 rounded-xl dc-gradient-btn text-white text-xs font-semibold">
              Upgrade Now
            </button>
          </div>
        </aside>
      </div>

      {showCreate && (
        <MentorCreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            refetch()
            refetchDashboard()
            showToast('Event submitted for admin approval.')
          }}
        />
      )}

      {manageEvent && (
        <MentorEventManageModal
          event={manageEvent}
          onClose={() => setManageEvent(null)}
          onUpdated={() => {
            refetch()
            refetchDashboard()
            showToast('Event updated.')
          }}
        />
      )}
    </MentorPanelShell>
  )
}
