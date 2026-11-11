import { Link } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  Video,
  Code2,
  Star,
  Flame,
  Trophy,
  TrendingUp,
  Target,
  GitBranch,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  BarChart3,
  Activity,
} from 'lucide-react'
import { useGetMyProfileQuery } from '../api/userApi'
import { useGetUserStatsQuery } from '../api/userStatsApi'
import { useAppSelector } from '../hooks'
import { useListMatchRequestsQuery } from '../api/matchingApi'
import { avatarUrl } from '../lib/avatar'

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function profileCompletion(profile: {
  displayName: string | null
  bio: string | null
  role: string | null
  location: string | null
  experienceLevel: string | null
  skills: string[]
  githubUrl: string | null
  linkedinUrl: string | null
  avatarUrl: string | null
}): number {
  const fields = [
    profile.displayName,
    profile.bio,
    profile.role,
    profile.location,
    profile.experienceLevel,
    profile.skills?.length > 0 ? 'ok' : null,
    profile.githubUrl,
    profile.linkedinUrl,
    profile.avatarUrl,
  ]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}

// ─── GitHub-style contribution heatmap — driven by REAL activity dates ──────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/** Convert any ISO timestamp to a stable YYYY-MM-DD key in local time */
function toDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

/**
 * activityDates: flat list of ISO timestamp strings from all activity sources
 * (match requests, community posts, video rooms, etc.)
 */
function ContributionGraph({ activityDates }: { activityDates: string[] }) {
  const WEEKS = 28

  // Build date → count map from REAL data only
  const countMap: Record<string, number> = {}
  for (const iso of activityDates) {
    const key = toDateKey(iso)
    countMap[key] = (countMap[key] ?? 0) + 1
  }

  // Find max count to normalise intensity
  const maxCount = Math.max(1, ...Object.values(countMap))

  const today = new Date()
  // Start from the Sunday of the week that was (WEEKS*7 - 1) days ago
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (WEEKS * 7 - 1))
  // Rewind to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay())

  type Cell = { date: Date; count: number; level: 0 | 1 | 2 | 3 | 4; key: string }
  const grid: Cell[][] = []

  for (let w = 0; w < WEEKS; w++) {
    const col: Cell[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + w * 7 + d)
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      const count = countMap[key] ?? 0
      // Only future days stay empty; past days with 0 activity also stay empty
      let level: 0 | 1 | 2 | 3 | 4 = 0
      if (count > 0 && date <= today) {
        const ratio = count / maxCount
        if (ratio < 0.25) level = 1
        else if (ratio < 0.5) level = 2
        else if (ratio < 0.75) level = 3
        else level = 4
      }
      col.push({ date, count, level, key })
    }
    grid.push(col)
  }

  // Month labels: show name when month changes
  const monthLabels: { label: string; col: number }[] = []
  for (let w = 0; w < WEEKS; w++) {
    const cell = grid[w][0]
    if (cell && (w === 0 || grid[w][0].date.getMonth() !== grid[w-1][0].date.getMonth())) {
      monthLabels.push({ label: MONTH_NAMES[cell.date.getMonth()], col: w })
    }
  }

  const levelColors: Record<number, string> = {
    0: '#1c1d2a',   // inactive
    1: '#2d2b6b',   // 1 activity — very dim purple
    2: '#4338ca',   // 2–3
    3: '#6366f1',   // 4–5
    4: '#a5b4fc',   // 6+
  }
  const levelLabel = (count: number) =>
    count === 0 ? 'No activity' : `${count} ${count === 1 ? 'activity' : 'activities'}`

  const totalActiveDays = grid.flat().filter((c) => c.level > 0).length
  const totalActivities = activityDates.length

  return (
    <div className="w-full overflow-x-auto">
      {/* Month labels */}
      <div className="flex mb-1 pl-8">
        {grid.map((_col, w) => {
          const ml = monthLabels.find((m) => m.col === w)
          return (
            <div key={w} style={{ minWidth: 13 }} className="flex-1">
              {ml && <span className="text-[9px] text-[#5c5d72] whitespace-nowrap">{ml.label}</span>}
            </div>
          )
        })}
      </div>

      {/* Grid */}
      <div className="flex gap-[3px]">
        {/* Day labels (Mon / Wed / Fri) */}
        <div className="flex flex-col gap-[3px] pr-1 shrink-0 w-7">
          {['','M','','W','','F',''].map((label, i) => (
            <div key={i} style={{ height: 11 }} className="text-[8px] text-[#5c5d72] flex items-center justify-end pr-0.5">
              {label}
            </div>
          ))}
        </div>

        {/* Cells */}
        {grid.map((col, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {col.map((cell, d) => (
              <div
                key={d}
                title={`${cell.date.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'})} — ${levelLabel(cell.count)}`}
                className="rounded-sm cursor-default transition-transform hover:scale-125"
                style={{
                  width: 11,
                  height: 11,
                  backgroundColor: levelColors[cell.level],
                  boxShadow: cell.level > 0 ? `0 0 0 1px ${levelColors[cell.level]}66` : undefined,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2d2e3e] flex-wrap gap-2">
        <span className="text-[10px] text-[#5c5d72]">
          <span className="text-white font-medium">{totalActivities}</span> total activities on{' '}
          <span className="text-white font-medium">{totalActiveDays}</span> days in the last {WEEKS} weeks
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-[#5c5d72]">Less</span>
          {[0,1,2,3,4].map((l) => (
            <div key={l} className="rounded-sm" style={{ width: 11, height: 11, backgroundColor: levelColors[l] }} />
          ))}
          <span className="text-[9px] text-[#5c5d72]">More</span>
        </div>
      </div>
    </div>
  )
}

// ─── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = '#6366f1',
  trend,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#8b8ca8] uppercase tracking-wider">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}22` }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        {sub && (
          <p className={`text-xs mt-1 ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-[#8b8ca8]'}`}>
            {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}{sub}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Skill bar (grows with real coding activity) ─────────────────────────────

function SkillBar({ skill, codingSolved }: { skill: string; codingSolved: number }) {
  const pct = Math.min(95, 25 + Math.min(codingSolved * 8, 70) + ((skill.charCodeAt(0) * 3) % 10))
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-[#b4b5c8] capitalize">{skill}</span>
        <span className="text-xs text-[#6366f1] font-semibold">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#2d2e3e] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366f1,#818cf8)' }}
        />
      </div>
    </div>
  )
}

// ─── Profile completion ring ─────────────────────────────────────────────────

function CompletionRing({ pct }: { pct: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <svg width={88} height={88} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={44} cy={44} r={r} stroke="#1c1d2a" strokeWidth={7} fill="none" />
      <circle
        cx={44} cy={44} r={r}
        stroke="url(#ring-grad)"
        strokeWidth={7}
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a5b4fc" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export function DashboardPage() {
  const account = useAppSelector((s) => s.auth.account)
  const { data: profile } = useGetMyProfileQuery()
  const { data: stats } = useGetUserStatsQuery()
  const { data: matchRequests } = useListMatchRequestsQuery()

  const displayName = profile?.displayName ?? account?.username ?? 'Developer'
  const points = stats?.points ?? 0
  const streak = stats?.streak ?? 0
  const rank = stats?.rank ?? 0
  const posts = stats?.posts ?? 0
  const replies = stats?.replies ?? 0
  const matchCount = matchRequests?.length ?? 0
  const codingSolved = stats?.codingSolved ?? 0
  const completion = profile ? profileCompletion(profile) : 0

  const activityDates: string[] = [
    ...(stats?.activityTimestamps ?? []),
    ...(matchRequests ?? []).map((m) => m.createdAt),
  ]

  const avgSessionLabel = (stats?.avgSessionMinutes ?? 0) > 0
    ? `${stats?.avgSessionMinutes} min`
    : '—'

  const quickActions = [
    { to: '/find-match', label: 'Find Match', desc: 'Connect with developers live', icon: Users, color: '#6366f1' },
    { to: '/mentors', label: 'Mentorship', desc: 'Browse & book expert mentors', icon: GraduationCap, color: '#8b5cf6' },
    { to: '/video-rooms', label: 'Video Rooms', desc: 'Join live coding sessions', icon: Video, color: '#06b6d4' },
    { to: '/pair-programming', label: 'Pair Programming', desc: 'Code together in real-time', icon: Code2, color: '#10b981' },
  ]

  const recentMatches = (matchRequests ?? []).slice(0, 5)

  return (
    <div className="p-5 space-y-5 max-w-[1400px] mx-auto">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#161722] border border-[#2d2e3e] overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#6366f1,#7c3aed,#06b6d4)' }} />
        <div className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={avatarUrl(displayName, 80)}
              alt=""
              className="w-20 h-20 rounded-2xl ring-2 ring-[#6366f1]/40 object-cover"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#161722]" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">Welcome back, {displayName}!</h1>
              {profile?.experienceLevel && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30 uppercase tracking-wider">
                  {profile.experienceLevel}
                </span>
              )}
            </div>
            <p className="text-sm text-[#8b8ca8] mb-2 line-clamp-1">{profile?.bio ?? 'No bio yet — add one in your profile!'}</p>
            <div className="flex flex-wrap gap-3 text-xs text-[#5c5d72]">
              {profile?.role && (
                <span className="flex items-center gap-1"><Target size={12} className="text-[#6366f1]" />{profile.role}</span>
              )}
              {profile?.location && (
                <span className="flex items-center gap-1"><MapPin size={12} />{profile.location}</span>
              )}
              {profile?.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  GitHub <ExternalLink size={10} />
                </a>
              )}
              {profile?.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  LinkedIn <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>

          {/* Rating badge */}
          <div className="shrink-0 flex flex-col items-center gap-1 px-5 py-3 rounded-xl bg-[#0b0c14] border border-[#2d2e3e]">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={12} className={s <= Math.round(profile?.averageRating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-[#2d2e3e]'} />
              ))}
            </div>
            <p className="text-lg font-bold text-white">{(profile?.averageRating ?? 0).toFixed(1)}</p>
            <p className="text-[10px] text-[#5c5d72]">{profile?.ratingCount ?? 0} ratings</p>
          </div>
        </div>
      </div>

      {/* ── KPI Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Points" value={points.toLocaleString()} sub="Leaderboard score" icon={Zap} accent="#6366f1" trend="up" />
        <StatCard label="Day Streak" value={streak} sub={streak > 0 ? 'Keep it going!' : 'Start your streak today'} icon={Flame} accent="#f97316" trend={streak > 0 ? 'up' : 'neutral'} />
        <StatCard label="Global Rank" value={rank === 0 ? '–' : `#${rank}`} sub="Leaderboard" icon={Trophy} accent="#eab308" />
        <StatCard label="Matches" value={matchCount} sub="Total sessions" icon={Users} accent="#06b6d4" />
        <StatCard label="Posts" value={posts} sub="Community posts" icon={GitBranch} accent="#10b981" />
        <StatCard label="Replies" value={replies} sub="Answers given" icon={Activity} accent="#8b5cf6" />
      </div>

      {/* ── Middle row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Activity heatmap */}
        <div className="lg:col-span-2 rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2">
                <BarChart3 size={16} className="text-[#6366f1]" />
                Activity Heatmap
              </h2>
              <p className="text-xs text-[#5c5d72] mt-0.5">Daily sessions, matches & contributions</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg bg-[#6366f1]/15 text-[#818cf8]">Last 28 weeks</span>
          </div>
          <ContributionGraph activityDates={activityDates} />

          {/* Mini stats row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Avg. Session', value: avgSessionLabel, icon: Clock },
              { label: 'Contributions', value: String(stats?.contributions ?? 0), icon: TrendingUp },
              { label: 'Problems Solved', value: String(codingSolved), icon: Code2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center p-2 rounded-lg bg-[#0b0c14]">
                <Icon size={14} className="text-[#6366f1] mx-auto mb-1" />
                <p className="text-sm font-bold text-white">{value}</p>
                <p className="text-[10px] text-[#5c5d72]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profile completion + leaderboard */}
        <div className="flex flex-col gap-4">
          {/* Profile completion */}
          <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
            <h2 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Profile Strength
            </h2>

            {/* Ring centered at top */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative">
                <CompletionRing pct={completion} />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                  {completion}%
                </span>
              </div>
              <p className="text-xs text-[#8b8ca8] mt-2">
                {completion < 40 ? 'Just getting started' : completion < 70 ? 'Looking good!' : completion < 100 ? 'Almost complete' : 'Complete!'}
              </p>
            </div>

            {/* Checklist below */}
            <div className="space-y-2">
              {[
                { label: 'Display name', done: !!profile?.displayName },
                { label: 'Bio', done: !!profile?.bio },
                { label: 'Skills added', done: (profile?.skills?.length ?? 0) > 0 },
                { label: 'Experience level', done: !!profile?.experienceLevel },
                { label: 'Location', done: !!profile?.location },
                { label: 'GitHub URL', done: !!profile?.githubUrl },
                { label: 'LinkedIn URL', done: !!profile?.linkedinUrl },
                { label: 'Portfolio URL', done: !!profile?.portfolioUrl },
                { label: 'Learning goals', done: !!profile?.learningGoals },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    done ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-[#0b0c14] border-[#2d2e3e]'
                  }`}>
                    {done && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                  <span className={`flex-1 ${done ? 'text-[#b4b5c8]' : 'text-[#5c5d72]'}`}>{label}</span>
                  {done
                    ? <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                    : <span className="text-[10px] text-[#5c5d72] shrink-0">Missing</span>}
                </div>
              ))}
            </div>

            {completion < 100 && (
              <Link
                to="/profile"
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#6366f1]/15 border border-[#6366f1]/30 text-sm text-[#818cf8] hover:bg-[#6366f1]/25 transition-colors"
              >
                Complete profile <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {/* Leaderboard position */}
          <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
            <h2 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-amber-400" />
              Your Rank
            </h2>
            <div className="text-center py-2">
              <div className="text-4xl font-black text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg,#6366f1,#818cf8)' }}>
                {rank === 0 ? '–' : `#${rank}`}
              </div>
              <p className="text-xs text-[#5c5d72] mt-1">out of all developers</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-[#0b0c14] p-2">
                  <p className="text-sm font-bold text-[#6366f1]">{points.toLocaleString()}</p>
                  <p className="text-[10px] text-[#5c5d72]">Points</p>
                </div>
                <div className="rounded-lg bg-[#0b0c14] p-2">
                  <p className="text-sm font-bold text-orange-400">{streak}</p>
                  <p className="text-[10px] text-[#5c5d72]">Day streak</p>
                </div>
              </div>
            </div>
            <Link to="/leaderboard" className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#0b0c14] text-xs text-[#8b8ca8] hover:text-white transition-colors">
              View leaderboard <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Skills + Match History ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Skills */}
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Zap size={16} className="text-[#6366f1]" />
              Skill Proficiency
            </h2>
            <Link to="/profile" className="text-xs text-[#6366f1] hover:text-[#818cf8]">Edit →</Link>
          </div>
          {profile?.skills && profile.skills.length > 0 ? (
            <div className="space-y-3">
              {profile.skills.slice(0, 7).map((s) => <SkillBar key={s} skill={s} codingSolved={codingSolved} />)}
            </div>
          ) : (
            <div className="text-center py-8">
              <Zap size={28} className="text-[#2d2e3e] mx-auto mb-2" />
              <p className="text-sm text-[#5c5d72]">No skills added yet.</p>
              <Link to="/profile" className="mt-2 inline-block text-xs text-[#6366f1] hover:text-[#818cf8]">Add skills →</Link>
            </div>
          )}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-[#2d2e3e]">
              {profile.skills.map((s) => (
                <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/20">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Match History */}
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Users size={16} className="text-[#06b6d4]" />
              Match History
            </h2>
            <Link to="/find-match" className="text-xs text-[#6366f1] hover:text-[#818cf8]">New match →</Link>
          </div>
          {recentMatches.length > 0 ? (
            <div className="space-y-2">
              {recentMatches.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0b0c14] hover:bg-[#1c1d2a] transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${m.status === 'MATCHED' ? 'bg-emerald-400' : 'bg-[#6366f1]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{m.criteria}</p>
                    <p className="text-xs text-[#5c5d72]">{timeAgo(m.createdAt)}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    m.status === 'MATCHED'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-[#6366f1]/15 text-[#818cf8]'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users size={28} className="text-[#2d2e3e] mx-auto mb-2" />
              <p className="text-sm text-[#5c5d72]">No matches yet.</p>
              <Link to="/find-match" className="mt-2 inline-block text-xs text-[#6366f1] hover:text-[#818cf8]">Find your first match →</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <div>
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Target size={16} className="text-[#6366f1]" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(({ to, label, desc, icon: Icon, color }) => (
            <Link
              key={to}
              to={to}
              className="group p-4 rounded-xl bg-[#161722] border border-[#2d2e3e] hover:border-[#6366f1]/40 transition-all hover:translate-y-[-2px]"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors"
                style={{ backgroundColor: `${color}22` }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color }} />
              </div>
              <p className="font-semibold text-sm text-white group-hover:text-[#818cf8] transition-colors">{label}</p>
              <p className="text-xs text-[#5c5d72] mt-0.5 leading-relaxed">{desc}</p>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-[#6366f1] opacity-0 group-hover:opacity-100 transition-opacity">
                Go <ArrowRight size={10} />
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
