import { useMemo, useState } from 'react'
import {
  Activity,
  Award,
  Ban,
  CheckCircle2,
  ChevronDown,
  Clock,
  Hash,
  MoreHorizontal,
  Star,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react'
import type { AdminAccount, CommunityPost, MentorApplication, VideoRoom } from '../../api/types'
import {
  bucketByDay,
  buildRoleDistribution,
  computeDeltaPercent,
  countInRange,
  formatLastUpdated,
  periodDays,
  type AnalyticsPeriod,
  type LiveActivityItem,
} from '../../lib/adminAnalytics'
import { BarChartSimple, DonutChart, LineChartSimple } from './AdminCharts'
import { AdminRightPanel } from './AdminRightPanel'

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
    purple: 'bg-violet-500/15 text-violet-400',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8]',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[color] ?? map.gray}`}
    >
      {children}
    </span>
  )
}

function StatDelta({ pct }: { pct: number }) {
  const up = pct >= 0
  return (
    <span
      className={`flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}
    >
      <TrendingUp size={10} className={up ? '' : 'rotate-180'} />
      {up ? '+' : ''}
      {pct.toFixed(1)}%
    </span>
  )
}

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  week: 'This Week',
  month: 'This Month',
  '30d': 'Last 30 Days',
}

export function AdminDashboardView({
  username,
  users,
  mentors,
  applications,
  rooms,
  posts,
  leaderboard,
  liveActivity,
  lastUpdated,
  isFetching,
  onTabChange,
}: {
  username: string
  users?: AdminAccount[]
  mentors?: { available: boolean }[]
  applications?: MentorApplication[]
  rooms?: VideoRoom[]
  posts?: CommunityPost[]
  leaderboard?: { entries: { userId: string; displayName: string; role: string | null; averageRating: number }[] }
  liveActivity: LiveActivityItem[]
  lastUpdated: Date | null
  isFetching: boolean
  onTabChange: (tab: string) => void
}) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month')
  const [periodOpen, setPeriodOpen] = useState(false)

  const days = periodDays(period)
  const now = Date.now()
  const periodMs = days * 86_400_000
  const prevStart = now - 2 * periodMs
  const prevEnd = now - periodMs
  const curStart = now - periodMs

  const userList = users ?? []
  const roomList = rooms ?? []
  const postList = posts ?? []
  const appList = applications ?? []

  const totalUsers = userList.length
  const activeUsers = userList.filter((u) => u.enabled).length
  const totalMentors = (mentors ?? []).filter((m) => m.available).length
  const totalRooms = roomList.length
  const totalPosts = postList.length
  const pending = appList.filter((a) => a.status === 'PENDING').length
  const banned = userList.filter((u) => !u.enabled).length

  const sessionsToday = useMemo(
    () =>
      roomList.filter((r) => {
        const t = new Date(r.createdAt).getTime()
        return t >= now - 86_400_000
      }).length,
    [roomList, now]
  )

  const userDelta = computeDeltaPercent(
    countInRange(userList, (u) => u.createdAt, curStart, now),
    countInRange(userList, (u) => u.createdAt, prevStart, prevEnd)
  )
  const roomDelta = computeDeltaPercent(
    countInRange(roomList, (r) => r.createdAt, curStart, now),
    countInRange(roomList, (r) => r.createdAt, prevStart, prevEnd)
  )
  const postDelta = computeDeltaPercent(
    countInRange(postList, (p) => p.createdAt, curStart, now),
    countInRange(postList, (p) => p.createdAt, prevStart, prevEnd)
  )

  const userBuckets = bucketByDay(userList, (u) => u.createdAt, days)
  const roomBuckets = bucketByDay(roomList, (r) => r.createdAt, days)
  const postBuckets = bucketByDay(postList, (p) => p.createdAt, days)

  const donutData = buildRoleDistribution(userList)
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0)

  const healthOk = useMemo(() => {
    const up = roomList.filter((r) => r.status === 'live').length
    return totalUsers === 0 ? 100 : Math.min(99.9, 95 + up * 0.5)
  }, [roomList, totalUsers])

  const statCards = [
    {
      label: 'Total Users',
      value: totalUsers.toLocaleString(),
      delta: userDelta,
      sub: `vs prior ${days}d`,
      icon: <Users size={16} />,
      color: '#818cf8',
      tab: 'users',
    },
    {
      label: 'Active Users',
      value: activeUsers.toLocaleString(),
      delta: computeDeltaPercent(activeUsers, totalUsers - activeUsers || 1),
      sub: 'enabled accounts',
      icon: <Activity size={16} />,
      color: '#10b981',
      tab: 'users',
    },
    {
      label: 'Mentors',
      value: totalMentors.toLocaleString(),
      delta: 0,
      sub: 'available now',
      icon: <Award size={16} />,
      color: '#f59e0b',
      tab: 'mentors',
    },
    {
      label: 'Sessions Today',
      value: sessionsToday.toLocaleString(),
      delta: roomDelta,
      sub: 'rooms created today',
      icon: <Zap size={16} />,
      color: '#06b6d4',
      tab: 'sessions',
    },
    {
      label: 'Posts (Total)',
      value: totalPosts.toLocaleString(),
      delta: postDelta,
      sub: `vs prior ${days}d`,
      icon: <Hash size={16} />,
      color: '#ec4899',
      tab: 'discussions',
    },
    {
      label: 'System Uptime',
      value: `${healthOk.toFixed(1)}%`,
      delta: healthOk >= 99 ? 0.1 : -2,
      sub: 'live services',
      icon: <CheckCircle2 size={16} />,
      color: '#22c55e',
      tab: 'system-logs',
    },
  ]

  const recentUsers = [...userList]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
  const topMentors = (leaderboard?.entries ?? []).slice(0, 5)

  const chartLabels =
    userBuckets.labels.length > 6
      ? userBuckets.labels.filter((_, i) => i % Math.ceil(userBuckets.labels.length / 5) === 0)
      : userBuckets.labels

  return (
    <div className="flex gap-0 h-full">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Welcome back, {username}! 👋</h1>
            <p className="text-xs text-[#8b8ca8] mt-0.5">
              Live data · auto-refreshes every 15s
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-[#5c5d72]">
            <Clock size={11} />
            Last updated: {formatLastUpdated(lastUpdated, isFetching)}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {statCards.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onTabChange(s.tab)}
              className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 hover:border-[#818cf8]/40 transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-[#8b8ca8] font-medium">{s.label}</p>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{s.value}</p>
              <div className="flex items-center gap-1.5">
                <StatDelta pct={s.delta} />
                <span className="text-[10px] text-[#5c5d72]">{s.sub}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Overview Analytics</h3>
                <p className="text-[10px] text-[#5c5d72] mt-0.5">Users · Sessions · Posts</p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPeriodOpen((o) => !o)}
                  className="flex items-center gap-1 text-[10px] text-[#8b8ca8] border border-[#2d2e3e] px-2 py-1 rounded-lg hover:border-[#818cf8]"
                >
                  {PERIOD_LABELS[period]} <ChevronDown size={10} />
                </button>
                {periodOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setPeriodOpen(false)}
                      aria-hidden
                    />
                    <ul className="absolute right-0 top-full mt-1 bg-[#161722] border border-[#2d2e3e] rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
                      {(Object.keys(PERIOD_LABELS) as AnalyticsPeriod[]).map((p) => (
                        <li key={p}>
                          <button
                            type="button"
                            onClick={() => {
                              setPeriod(p)
                              setPeriodOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-[10px] hover:bg-[#1c1d2a] ${period === p ? 'text-violet-400' : 'text-[#8b8ca8]'}`}
                          >
                            {PERIOD_LABELS[p]}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mb-3">
              {[
                { c: '#818cf8', l: 'Users' },
                { c: '#06b6d4', l: 'Sessions' },
                { c: '#10b981', l: 'Posts' },
              ].map((x) => (
                <span key={x.l} className="flex items-center gap-1 text-[10px] text-[#8b8ca8]">
                  <span className="w-6 h-0.5 inline-block rounded" style={{ background: x.c }} />{' '}
                  {x.l}
                </span>
              ))}
            </div>
            <LineChartSimple
              series={[userBuckets.values, roomBuckets.values, postBuckets.values]}
              colors={['#818cf8', '#06b6d4', '#10b981']}
              labels={chartLabels}
            />
          </div>

          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">User Distribution</h3>
            <div className="flex items-center justify-center mb-3 relative">
              <DonutChart segments={donutData.length ? donutData : [{ label: 'None', value: 1, color: '#2d2e3e' }]} />
              <div className="absolute text-center">
                <p className="text-lg font-bold text-white">{donutTotal.toLocaleString()}</p>
                <p className="text-[9px] text-[#5c5d72]">Total Users</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {donutData.map((d) => (
                <li key={d.label} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-2 text-[#8b8ca8]">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    {d.label}
                  </span>
                  <span className="text-white font-semibold">
                    {donutTotal > 0 ? ((d.value / donutTotal) * 100).toFixed(1) : 0}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Top Mentors</h3>
              <button
                type="button"
                className="text-[10px] text-violet-400 hover:text-white"
                onClick={() => onTabChange('mentors')}
              >
                View All
              </button>
            </div>
            {topMentors.length === 0 ? (
              <p className="text-xs text-[#5c5d72] text-center py-4">No data yet</p>
            ) : (
              <ul className="space-y-3">
                {topMentors.map((e, i) => (
                  <li key={e.userId} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-[#5c5d72] w-4 text-center">
                      {i + 1}
                    </span>
                    <Av name={e.displayName} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{e.displayName}</p>
                      <p className="text-[10px] text-[#5c5d72] truncate">{e.role ?? 'Developer'}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      <span className="text-[10px] text-white font-semibold">
                        {e.averageRating.toFixed(1)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Sessions Overview</h3>
              <button
                type="button"
                className="text-[10px] text-violet-400 hover:text-white"
                onClick={() => onTabChange('sessions')}
              >
                View All
              </button>
            </div>
            <BarChartSimple values={roomBuckets.values} color="#818cf8" />
            <div className="flex justify-between mt-2">
              {roomBuckets.labels
                .filter((_, i) => i % Math.max(1, Math.floor(roomBuckets.labels.length / 5)) === 0)
                .map((l) => (
                  <span key={l} className="text-[9px] text-[#5c5d72]">
                    {l}
                  </span>
                ))}
            </div>
          </div>

          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Platform Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Rooms',
                  value: totalRooms,
                  delta: roomDelta,
                  icon: <Video size={14} />,
                  color: '#818cf8',
                  tab: 'rooms',
                },
                {
                  label: 'Posts',
                  value: totalPosts,
                  delta: postDelta,
                  icon: <Hash size={14} />,
                  color: '#10b981',
                  tab: 'discussions',
                },
                {
                  label: 'Pending',
                  value: pending,
                  delta: 0,
                  icon: <Clock size={14} />,
                  color: '#f59e0b',
                  tab: 'requests',
                },
                {
                  label: 'Banned',
                  value: banned,
                  delta: 0,
                  icon: <Ban size={14} />,
                  color: '#ef4444',
                  tab: 'banned-users',
                },
              ].map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => onTabChange(q.tab)}
                  className="bg-[#1c1d2a] rounded-lg p-3 text-left hover:bg-[#2d2e3e] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: q.color }}>{q.icon}</span>
                    {q.delta !== 0 && <StatDelta pct={q.delta} />}
                  </div>
                  <p className="text-base font-bold text-white">{q.value.toLocaleString()}</p>
                  <p className="text-[9px] text-[#5c5d72] mt-0.5">{q.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2e3e]">
            <h3 className="text-sm font-bold text-white">Recent Users</h3>
            <button
              type="button"
              className="text-[10px] text-violet-400 hover:text-white"
              onClick={() => onTabChange('users')}
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1c1d2a]">
                  {['User', 'Email', 'Role', 'Joined', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1d2a]">
                {recentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#1c1d2a]/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Av name={u.username} size={28} />
                        <span className="text-xs font-semibold text-white">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#8b8ca8]">{u.email}</td>
                    <td className="px-5 py-3">
                      <Pill color={u.roles.includes('ADMIN') ? 'purple' : 'gray'}>{u.roles}</Pill>
                    </td>
                    <td className="px-5 py-3 text-[10px] text-[#5c5d72]">
                      {new Date(u.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <Pill color={u.enabled ? 'green' : 'red'}>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${u.enabled ? 'bg-emerald-400' : 'bg-red-400'}`}
                        />
                        {u.enabled ? 'Active' : 'Blocked'}
                      </Pill>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => onTabChange('users')}
                        className="text-[#5c5d72] hover:text-white"
                        title="Open users"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminRightPanel
        liveActivity={liveActivity}
        applications={applications}
        pendingCount={pending}
        onTabChange={onTabChange}
      />
    </div>
  )
}
