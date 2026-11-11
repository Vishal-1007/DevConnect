/**
 * MentorLeaderboardPanel — mentor gamification rankings and reputation metrics.
 */
import { useState } from 'react'
import {
  Trophy, Star, Loader2, RefreshCw, AlertTriangle, TrendingUp,
  Eye, Shield, CalendarCheck, Flame, Medal,
} from 'lucide-react'
import { useGetMentorLeaderboardQuery } from '../../api/mentorWorkspaceApi'
import { MentorPanelShell } from './MentorPanelShell'

const PERIODS = [
  { id: 'all', label: 'All Time' },
  { id: 'monthly', label: 'This Month' },
  { id: 'weekly', label: 'This Week' },
] as const

function Av({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35, background: `hsl(${hue}, 55%, 45%)` }}
    >
      {initials}
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg" title="Gold">🥇</span>
  if (rank === 2) return <span className="text-lg" title="Silver">🥈</span>
  if (rank === 3) return <span className="text-lg" title="Bronze">🥉</span>
  return <span className="text-sm font-black text-[#5c5d72]">#{rank}</span>
}

export function MentorLeaderboardPanel() {
  const [period, setPeriod] = useState<'all' | 'monthly' | 'weekly'>('all')
  const { data, isLoading, isError, refetch, isFetching } = useGetMentorLeaderboardQuery({ period, limit: 50 })

  if (isLoading && !data) {
    return (
      <MentorPanelShell>
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      </MentorPanelShell>
    )
  }

  if (isError || !data) {
    return (
      <MentorPanelShell>
        <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
        <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
        <p className="text-sm text-white font-semibold mb-1">Could not load leaderboard</p>
        <button type="button" onClick={() => refetch()} className="text-xs text-violet-400 hover:text-violet-300 mt-2">
          Try again
        </button>
      </div>
      </MentorPanelShell>
    )
  }

  const me = data.currentUser

  return (
    <MentorPanelShell>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Leaderboard Rank</h2>
          <p className="text-xs text-[#8b8ca8] mt-0.5">
            Platform rankings based on sessions, ratings, retention, and activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#12131c] border border-[#2d2e3e] rounded-lg p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-colors ${
                  period === p.id ? 'bg-violet-600 text-white' : 'text-[#8b8ca8] hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-600/20 to-yellow-600/10 border border-amber-500/30 rounded-xl p-5 flex items-center gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
          <Trophy size={22} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-bold text-white">Your Current Rank: #{me.rank}</p>
          <p className="text-xs text-[#8b8ca8] mt-0.5">
            {me.points.toLocaleString()} points · {me.averageRating.toFixed(1)}★ rating ·{' '}
            {me.sessionsCompleted} sessions · {me.retentionPct.toFixed(0)}% retention
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black text-amber-400">#{me.rank}</p>
          <p className="text-[10px] text-[#5c5d72]">of {data.totalMentors} mentors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
        {[
          {
            icon: <Eye size={16} className="text-violet-400" />,
            title: 'More Visibility',
            body: 'Top-ranked mentors appear first in search and discovery feeds.',
          },
          {
            icon: <Shield size={16} className="text-emerald-400" />,
            title: 'Build Trust',
            body: 'Higher ranks signal proven mentorship quality to new learners.',
          },
          {
            icon: <CalendarCheck size={16} className="text-amber-400" />,
            title: 'More Bookings',
            body: 'Students prefer mentors with strong ratings, streaks, and activity.',
          },
        ].map((b) => (
          <div key={b.title} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">{b.icon}<span className="text-xs font-bold text-white">{b.title}</span></div>
            <p className="text-[11px] text-[#8b8ca8] leading-relaxed">{b.body}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#2d2e3e] bg-[#12131c] flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Medal size={14} className="text-amber-400" /> Top Mentors
          </h3>
          <span className="text-[10px] text-[#5c5d72] flex items-center gap-1">
            <TrendingUp size={10} className="text-emerald-400" />
            Ranked by ratings, sessions, retention & activity
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="border-b border-[#2d2e3e] bg-[#12131c]/50">
                {['Rank', 'Mentor', 'Rating', 'Sessions', 'Points', 'Streak'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72] ${
                      i === 0 ? 'w-16' : i >= 2 ? 'text-center' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1d2a]">
              {data.entries.map((e) => (
                <tr
                  key={e.mentorId}
                  className={`hover:bg-[#1c1d2a]/50 transition-colors ${
                    e.currentUser ? 'bg-violet-600/10 border-l-2 border-violet-500' : ''
                  }`}
                >
                  <td className="px-5 py-3 text-center">
                    <RankBadge rank={e.rank} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Av name={e.displayName} size={30} />
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {e.displayName}
                          {e.currentUser && (
                            <span className="text-violet-400 text-[9px] ml-1">(You)</span>
                          )}
                        </p>
                        <p className="text-[9px] text-[#5c5d72] truncate max-w-[180px]" title={e.headline}>
                          {e.headline}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-white">{e.averageRating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-white font-medium text-center">{e.sessionsCompleted}</td>
                  <td className="px-5 py-3 text-xs font-bold text-violet-400 text-center">{e.points.toLocaleString()}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/25">
                      <Flame size={10} /> {e.streakDays}d
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.entries.length === 0 && (
          <p className="text-center text-xs text-[#8b8ca8] py-10">No mentor rankings yet for this period.</p>
        )}
      </div>
    </MentorPanelShell>
  )
}
