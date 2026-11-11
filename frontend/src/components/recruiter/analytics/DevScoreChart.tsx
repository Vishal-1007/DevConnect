import type { AnalyticsPeriod } from '../../../data/recruiterAnalyticsData'
import { DEVSCORE_DISTRIBUTION, DEVSCORE_TOTAL } from '../../../data/recruiterAnalyticsData'
import { AnalyticsCardShell } from './AnalyticsCard'

type Props = {
  period: AnalyticsPeriod
  onPeriodChange: (p: AnalyticsPeriod) => void
  onViewCandidates?: () => void
}

export function DevScoreChart({ period, onPeriodChange, onViewCandidates }: Props) {
  const total = DEVSCORE_TOTAL || 1
  const r = 52
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <AnalyticsCardShell
      title="DevScore Distribution"
      subtitle="Verified candidate quality breakdown"
      period={period}
      onPeriodChange={onPeriodChange}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#2d2e3e" strokeWidth="14" />
            {DEVSCORE_DISTRIBUTION.filter((t) => t.count > 0).map((tier) => {
              const dash = (tier.count / total) * c
              const el = (
                <circle
                  key={tier.label}
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  stroke={tier.color}
                  strokeWidth="14"
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
            <span className="text-3xl font-bold text-white">{DEVSCORE_TOTAL}</span>
            <span className="text-[11px] text-[#8b8ca8]">Total</span>
          </div>
        </div>

        <div className="w-full flex-1 space-y-2.5">
          {DEVSCORE_DISTRIBUTION.map((tier) => (
            <div key={tier.label} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[#c4c5d6]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                <span>
                  {tier.label}
                  {tier.sub && <span className="ml-1 text-[#5c5d72]">({tier.sub})</span>}
                </span>
              </span>
              <span className="text-[#8b8ca8]">
                {tier.count} ({tier.percent}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onViewCandidates}
        className="mt-4 text-xs font-medium text-violet-300 hover:text-violet-200"
      >
        View all candidates →
      </button>
    </AnalyticsCardShell>
  )
}
