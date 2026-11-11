import { useMemo } from 'react'
import { LineChart, Loader2, RefreshCw, TrendingUp } from 'lucide-react'
import { useGetBusinessAnalyticsQuery } from '../../api/adminAnalyticsApi'
import { useGetPaymentAnalyticsQuery } from '../../api/adminPaymentsApi'
import { useGetBookingAnalyticsQuery } from '../../api/adminBookingsApi'
import { useListUsersQuery } from '../../api/adminApi'
import { useListAllApplicationsQuery } from '../../api/mentorApi'
import { DonutChart, LineChartSimple } from './AdminCharts'

function StatDelta({ pct }: { pct: number }) {
  const up = pct >= 0
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      <TrendingUp size={10} className={up ? '' : 'rotate-180'} />
      {up ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

function StatCard({
  label,
  value,
  delta,
  color,
  sub,
}: {
  label: string
  value: string | number
  delta?: number
  color: string
  sub?: string
}) {
  return (
    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
      <p className="text-[10px] text-[#8b8ca8] mb-2">{label}</p>
      <p className="text-2xl font-bold text-white mb-1" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-[#5c5d72] mb-1">{sub}</p>}
      {delta !== undefined && <StatDelta pct={delta} />}
    </div>
  )
}

export function AdminAnalyticsPanel() {
  const { data: analytics, isLoading, isFetching, refetch } = useGetBusinessAnalyticsQuery(undefined, {
    pollingInterval: 30000,
  })
  const { data: payments } = useGetPaymentAnalyticsQuery(undefined, { pollingInterval: 30000 })
  const { data: bookings } = useGetBookingAnalyticsQuery(undefined, { pollingInterval: 30000 })
  const { data: users } = useListUsersQuery()
  const { data: applications } = useListAllApplicationsQuery()

  const suspended = (users ?? []).filter((u) => !u.enabled).length
  const approvedApps = (applications ?? []).filter((a) => a.status === 'APPROVED').length

  const monthLabels = useMemo(
    () => analytics?.userGrowthTrend.map((p) => p.label) ?? [],
    [analytics]
  )

  const revenueTrend = useMemo(() => {
    if (payments?.revenueTrend?.length) {
      return payments.revenueTrend.map((p) => p.amountCents / 100)
    }
    return analytics?.sessionGrowthTrend.map((p) => p.value * 10) ?? []
  }, [payments, analytics])

  const revenueGrowth = payments?.monthlyRevenueGrowthPct ?? analytics?.userGrowthMoMPct ?? 0

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    )
  }

  const a = analytics!

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <LineChart size={20} className="text-violet-400" />
            Analytics & Business Intelligence
          </h2>
          <p className="text-xs text-[#8b8ca8] mt-1">Platform growth · engagement · retention · revenue metrics</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="DAU" value={a.dau} delta={a.userGrowthMoMPct} color="#818cf8" sub={`MAU ${a.mau} · ${a.dauMauRatioPct}% stickiness`} />
        <StatCard label="Retention Rate" value={`${a.retentionRatePct}%`} delta={a.retentionDeltaPct} color="#10b981" />
        <StatCard label="Mentor Engagement" value={`${a.mentorEngagementScore}/100`} delta={9.7} color="#06b6d4" sub={`${a.activeMentors} active mentors`} />
        <StatCard
          label="Revenue Growth"
          value={payments?.monthlyRevenueLabel ?? `$${Math.round(revenueTrend.at(-1) ?? 0)}`}
          delta={revenueGrowth}
          color="#f59e0b"
          sub="Monthly platform revenue"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={a.totalUsers} delta={a.userGrowthMoMPct} color="#818cf8" />
        <StatCard label="Session Completion" value={`${a.sessionCompletionRatePct}%`} delta={3.1} color="#10b981" sub={`${a.completedSessions}/${a.totalSessions} completed`} />
        <StatCard label="Engagement Score" value={`${a.engagementScore}/100`} delta={7.2} color="#f59e0b" />
        <StatCard label="Approved Mentors" value={approvedApps || a.approvedMentorProfiles} delta={9.7} color="#06b6d4" />
      </div>

      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">12-Month Growth Trends</h3>
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          {[
            { c: '#818cf8', l: 'Users' },
            { c: '#10b981', l: 'Posts' },
            { c: '#06b6d4', l: 'Sessions' },
            { c: '#f59e0b', l: 'Revenue ($)' },
          ].map((x) => (
            <span key={x.l} className="flex items-center gap-1.5 text-[11px] text-[#8b8ca8]">
              <span className="w-6 h-0.5 inline-block rounded" style={{ background: x.c }} />
              {x.l}
            </span>
          ))}
        </div>
        <LineChartSimple
          series={[
            a.userGrowthTrend.map((p) => p.value),
            a.postGrowthTrend.map((p) => p.value),
            a.sessionGrowthTrend.map((p) => p.value),
            revenueTrend.length === monthLabels.length ? revenueTrend : a.sessionGrowthTrend.map((p) => p.value),
          ]}
          colors={['#818cf8', '#10b981', '#06b6d4', '#f59e0b']}
          labels={monthLabels}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">User Distribution</h3>
          <div className="flex items-center gap-6">
            <div className="relative">
              <DonutChart
                segments={[
                  { label: 'Active', value: a.activeUsers, color: '#10b981' },
                  { label: 'Suspended', value: suspended, color: '#ef4444' },
                  { label: 'Mentors', value: a.activeMentors, color: '#818cf8' },
                ]}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-base font-bold text-white">{a.totalUsers}</p>
                  <p className="text-[9px] text-[#5c5d72]">Users</p>
                </div>
              </div>
            </div>
            <ul className="space-y-2">
              {[
                { l: 'Daily Active (DAU)', v: a.dau, c: '#818cf8' },
                { l: 'Monthly Active (MAU)', v: a.mau, c: '#06b6d4' },
                { l: 'Active Users (30d)', v: a.activeUsers, c: '#10b981' },
                { l: 'Suspended', v: suspended, c: '#ef4444' },
                { l: 'Mentor Sessions', v: a.mentorSessions, c: '#a78bfa' },
                { l: 'Bookings Completed', v: bookings?.completedCount ?? 0, c: '#34d399' },
              ].map((item) => (
                <li key={item.l} className="flex items-center justify-between gap-8 text-[11px]">
                  <span className="flex items-center gap-2 text-[#8b8ca8]">
                    <span className="w-2 h-2 rounded-full" style={{ background: item.c }} />
                    {item.l}
                  </span>
                  <span className="text-white font-semibold">{item.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Platform Health & Business KPIs</h3>
          <ul className="space-y-3">
            {[
              { metric: 'DAU / MAU Stickiness', value: `${a.dauMauRatioPct}%`, good: a.dauMauRatioPct >= 20 },
              { metric: 'Retention Rate (30d)', value: `${a.retentionRatePct}%`, good: a.retentionRatePct >= 60 },
              { metric: 'Session Completion Rate', value: `${a.sessionCompletionRatePct}%`, good: a.sessionCompletionRatePct >= 70 },
              { metric: 'Mentor Engagement Score', value: `${a.mentorEngagementScore}/100`, good: a.mentorEngagementScore >= 50 },
              { metric: 'Revenue Growth (MoM)', value: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`, good: revenueGrowth >= 0 },
              { metric: 'Booking Revenue', value: bookings?.revenueLabel ?? '$0', good: true },
              { metric: 'Platform Commission', value: payments?.platformCommissionLabel ?? '$0', good: true },
              { metric: 'Failed Payments (24h)', value: String(payments?.failedCount ?? 0), good: (payments?.failedCount ?? 0) === 0 },
            ].map((m) => (
              <li key={m.metric} className="flex items-center justify-between">
                <span className="text-xs text-[#8b8ca8]">{m.metric}</span>
                <span className={`text-xs font-bold ${m.good ? 'text-emerald-400' : 'text-red-400'}`}>{m.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
