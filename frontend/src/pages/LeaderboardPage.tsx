import { useMemo, useState } from 'react'
import { Loader2, Search, Trophy } from 'lucide-react'
import { useGetLeaderboardQuery } from '../api/leaderboardApi'
import { useGetMyProfileQuery } from '../api/userApi'
import { LeaderboardPodium, LeaderboardTable } from '../components/leaderboard/LeaderboardViews'
import { extractApiError } from '../lib/extractApiError'

const periods = [
  { id: 'all', label: 'All time' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'weekly', label: 'Weekly' },
]

const categories = [
  { id: 'overall', label: 'Overall' },
  { id: 'contributors', label: 'Contributors' },
  { id: 'mentors', label: 'Mentors' },
  { id: 'streak', label: 'Streak' },
]

export function LeaderboardPage() {
  const { data: profile } = useGetMyProfileQuery()
  const [period, setPeriod] = useState('all')
  const [category, setCategory] = useState('overall')
  const [search, setSearch] = useState('')

  const { data, isLoading, isFetching, error } = useGetLeaderboardQuery({ period, category })

  const pointLabel = category === 'streak' ? 'Day streak' : 'Points'

  const summary = useMemo(() => {
    if (!data) return null
    return {
      topScore: data.entries[0]?.points ?? 0,
      yourRank: data.currentUser.rank,
      yourScore: data.currentUser.points,
    }
  }, [data])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#6366f1]/20 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5 text-[#818cf8]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-sm text-[#8b8ca8] mt-1 max-w-xl">
            Rankings based on community contributions, mentorship ratings, and learning streaks.
          </p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-3 text-center">
            <p className="text-lg font-bold text-[#818cf8]">{summary.topScore.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wide text-[#8b8ca8]">Top score</p>
          </div>
          <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-3 text-center">
            <p className="text-lg font-bold text-white">#{summary.yourRank}</p>
            <p className="text-[10px] uppercase tracking-wide text-[#8b8ca8]">Your rank</p>
          </div>
          <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-3 text-center">
            <p className="text-lg font-bold text-amber-400">{summary.yourScore.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wide text-[#8b8ca8]">{pointLabel}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {periods.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              period === p.id
                ? 'bg-[#6366f1]/20 text-white border border-[#6366f1]'
                : 'bg-[#161722] text-[#8b8ca8] border border-[#2d2e3e] hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === c.id
                ? 'bg-[#6366f1]/20 text-white border border-[#6366f1]'
                : 'bg-[#161722] text-[#8b8ca8] border border-[#2d2e3e] hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
        {isFetching && !isLoading && (
          <Loader2 size={14} className="animate-spin text-[#8b8ca8] ml-1" />
        )}
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search developers…"
          className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-sm text-white focus:outline-none focus:border-[#6366f1]"
        />
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-300">{extractApiError(error)}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-[#8b8ca8]">
          <Loader2 size={20} className="animate-spin" />
          Loading leaderboard…
        </div>
      )}

      {data && data.entries.length > 0 && (
        <>
          <LeaderboardPodium entries={data.entries} />
          <LeaderboardTable
            entries={data.entries}
            currentUserId={profile?.id}
            search={search}
          />
        </>
      )}

      {data && data.entries.length === 0 && !isLoading && (
        <div className="text-center py-16 rounded-xl bg-[#161722] border border-[#2d2e3e]">
          <Trophy className="w-10 h-10 text-[#6366f1] mx-auto mb-3 opacity-60" />
          <p className="text-white font-medium">No rankings yet</p>
          <p className="text-sm text-[#8b8ca8] mt-1">
            Post in Community Feed or join Discussions to climb the board.
          </p>
        </div>
      )}

      {data?.currentUser && data.entries.length > 0 && (
        <div className="mt-5 rounded-xl border border-[#6366f1]/30 bg-[#6366f1]/10 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#a5b4fc] uppercase tracking-wide">Your standing</p>
            <p className="text-white font-semibold mt-0.5">
              Rank #{data.currentUser.rank} · {data.currentUser.points.toLocaleString()} {pointLabel.toLowerCase()}
            </p>
          </div>
          <p className="text-xs text-[#8b8ca8]">
            {data.currentUser.contributions} contributions · {data.currentUser.replies} replies
          </p>
        </div>
      )}
    </div>
  )
}
