import { Crown, Flame, Medal, Trophy } from 'lucide-react'
import type { LeaderboardEntry } from '../../api/types'
import { avatarUrl } from '../../lib/avatar'

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[]
}

export function LeaderboardPodium({ entries }: LeaderboardPodiumProps) {
  const top3 = entries.slice(0, 3)
  if (top3.length === 0) return null

  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)

  return (
    <div className="grid grid-cols-3 gap-3 mb-6 items-end">
      {podiumOrder.map((entry) => {
        const isFirst = entry.rank === 1
        const medalColors = [
          'from-slate-400 to-slate-600',
          'from-amber-400 to-amber-600',
          'from-orange-400 to-orange-700',
        ]
        const medalIndex = entry.rank === 1 ? 1 : entry.rank === 2 ? 0 : 2

        return (
          <div
            key={entry.userId}
            className={`text-center rounded-xl border border-[#2d2e3e] bg-[#161722] p-4 ${
              isFirst ? 'pb-6 ring-1 ring-[#6366f1]/40' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center bg-gradient-to-br ${medalColors[medalIndex]}`}
            >
              {entry.rank === 1 ? (
                <Crown size={16} className="text-white" />
              ) : (
                <Medal size={16} className="text-white" />
              )}
            </div>
            <img
              src={avatarUrl(entry.displayName, isFirst ? 56 : 48)}
              alt=""
              className={`rounded-full mx-auto mb-2 border-2 ${
                isFirst ? 'w-14 h-14 border-[#6366f1]' : 'w-12 h-12 border-[#2d2e3e]'
              }`}
            />
            <p className="text-sm font-semibold text-white truncate">{entry.displayName}</p>
            <p className="text-[10px] text-[#8b8ca8] truncate mt-0.5">{entry.role ?? 'Developer'}</p>
            <p className="text-lg font-bold text-[#818cf8] mt-2">{entry.points.toLocaleString()}</p>
            <p className="text-[10px] text-[#5c5d72] uppercase tracking-wide">points</p>
            <div className="flex items-center justify-center gap-1 mt-1 text-xs text-amber-400">
              <Flame size={12} />
              {entry.streak}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  search: string
}

export function LeaderboardTable({ entries, currentUserId, search }: LeaderboardTableProps) {
  const filtered = entries.filter((e) =>
    e.displayName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="rounded-xl border border-[#2d2e3e] overflow-hidden">
      <div className="grid grid-cols-[48px_1fr_80px_80px_80px] gap-2 px-4 py-2 bg-[#12131c] text-[10px] uppercase tracking-wide text-[#5c5d72] font-semibold">
        <span>Rank</span>
        <span>Developer</span>
        <span className="text-right">Points</span>
        <span className="text-right">Streak</span>
        <span className="text-right">Posts</span>
      </div>
      <div className="divide-y divide-[#2d2e3e]">
        {filtered.map((entry) => {
          const isYou = entry.userId === currentUserId
          return (
            <div
              key={entry.userId}
              className={`grid grid-cols-[48px_1fr_80px_80px_80px] gap-2 px-4 py-3 items-center ${
                isYou ? 'bg-[#6366f1]/10' : 'bg-[#161722]'
              }`}
            >
              <span className="text-sm font-bold text-[#818cf8]">#{entry.rank}</span>
              <div className="flex items-center gap-2 min-w-0">
                <img src={avatarUrl(entry.displayName, 32)} alt="" className="w-8 h-8 rounded-full shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                    {entry.displayName}
                    {isYou && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#6366f1]/25 text-[#a5b4fc]">
                        You
                      </span>
                    )}
                    {entry.rank <= 3 && <Trophy size={12} className="text-amber-400 shrink-0" />}
                  </p>
                  <p className="text-[10px] text-[#8b8ca8] truncate">{entry.role ?? 'Developer'}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-white text-right">
                {entry.points.toLocaleString()}
              </span>
              <span className="text-sm text-amber-400 text-right flex items-center justify-end gap-1">
                <Flame size={12} />
                {entry.streak}
              </span>
              <span className="text-sm text-[#8b8ca8] text-right">{entry.posts}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
