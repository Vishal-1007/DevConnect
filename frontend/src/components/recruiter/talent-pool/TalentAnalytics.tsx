import { TalentActions } from './TalentActions'
import type { SavedTalentCandidate } from '../../../data/recruiterTalentPoolData'

type Overview = {
  total: number
  high: number
  good: number
  average: number
}

type DistributionTier = {
  label: string
  sub: string
  count: number
  percent: number
}

type Props = {
  overview: Overview
  distribution: DistributionTier[]
  recentlyAdded: SavedTalentCandidate[]
  onImport: () => void
  onAdd: () => void
}

function DonutOverview({ overview }: { overview: Overview }) {
  const total = overview.total || 1
  const segments = [
    { value: overview.high, color: '#10b981' },
    { value: overview.good, color: '#3b82f6' },
    { value: overview.average, color: '#f59e0b' },
  ]
  const r = 40
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="relative mx-auto h-32 w-32">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#2d2e3e" strokeWidth="12" />
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * c
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          )
          offset += dash
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{overview.total}</span>
        <span className="text-[10px] text-[#8b8ca8]">Saved</span>
      </div>
    </div>
  )
}

export function TalentAnalytics({
  overview,
  distribution,
  recentlyAdded,
  onImport,
  onAdd,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/70 p-4 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Talent Pool Overview</h3>
          <select className="rounded-lg border border-[#2d2e3e] bg-[#0b0c14] px-2 py-1 text-[11px] text-[#8b8ca8]">
            <option>This Month</option>
            <option>Last 3 Months</option>
          </select>
        </div>
        <DonutOverview overview={overview} />
        <div className="mt-4 space-y-2">
          {[
            { label: 'High Match', sub: 'DevScore 800+', count: overview.high, color: 'bg-emerald-400' },
            { label: 'Good Match', sub: '600–799', count: overview.good, color: 'bg-blue-400' },
            { label: 'Average Match', sub: 'Below 600', count: overview.average, color: 'bg-amber-400' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[#c4c5d6]">
                <span className={`h-2 w-2 rounded-full ${item.color}`} />
                <span>
                  {item.label}
                  <span className="ml-1 text-[#5c5d72]">({item.sub})</span>
                </span>
              </span>
              <span className="font-semibold text-white">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/70 p-4 backdrop-blur-md">
        <h3 className="mb-3 text-sm font-semibold text-white">DevScore Distribution</h3>
        <div className="space-y-3">
          {distribution.map((tier) => (
            <div key={tier.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-[#c4c5d6]">
                  {tier.label}
                  {tier.sub && <span className="ml-1 text-[#5c5d72]">{tier.sub}</span>}
                </span>
                <span className="text-[#8b8ca8]">{tier.count} ({tier.percent}%)</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#2d2e3e]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7]"
                  style={{ width: `${tier.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="mt-3 text-xs font-medium text-violet-300 hover:text-violet-200">
          View Full Analytics →
        </button>
      </div>

      <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/70 p-4 backdrop-blur-md">
        <h3 className="mb-3 text-sm font-semibold text-white">Recently Added</h3>
        <div className="space-y-3">
          {recentlyAdded.map((c) => (
            <div key={c.poolId} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                {c.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{c.name}</p>
                <p className="truncate text-[11px] text-[#8b8ca8]">{c.role}</p>
                <p className="text-[10px] text-[#5c5d72]">{c.addedOnDisplay}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/70 p-4 backdrop-blur-md">
        <h3 className="mb-3 text-sm font-semibold text-white">Quick Actions</h3>
        <TalentActions variant="quick" onImport={onImport} onAdd={onAdd} />
      </div>
    </div>
  )
}
