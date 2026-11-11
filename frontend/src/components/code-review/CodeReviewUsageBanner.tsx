import type { AiReviewUsage } from '../../api/aiReviewApi'

interface CodeReviewUsageBannerProps {
  usage: AiReviewUsage | undefined
  isLoading?: boolean
}

export function CodeReviewUsageBanner({ usage, isLoading }: CodeReviewUsageBannerProps) {
  if (isLoading || !usage) {
    return (
      <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4 animate-pulse h-24" />
    )
  }

  const limit = usage.freeLimit
  const used = usage.used
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  const hasQuota = usage.remaining > 0 || usage.paidReviews > 0

  return (
    <div className="rounded-xl bg-gradient-to-br from-[#161722] to-[#12131c] border border-[#2d2e3e] p-4 sm:p-5 shadow-lg shadow-black/20 dc-score-bar-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-[#818cf8] font-bold mb-2">
            AI Reviews Today
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#8b8ca8] text-xs mb-0.5">Free</p>
              <p className="text-white font-semibold tabular-nums">
                {usage.remaining}/{limit}{' '}
                <span className="text-[#8b8ca8] font-normal text-xs">remaining</span>
              </p>
            </div>
            <div>
              <p className="text-[#8b8ca8] text-xs mb-0.5">Extra reviews</p>
              <p className="text-white font-semibold tabular-nums">{usage.paidReviews}</p>
            </div>
          </div>
        </div>
        <div className="w-full sm:w-48">
          <div className="flex justify-between text-[10px] text-[#8b8ca8] mb-1">
            <span>AI Usage</span>
            <span className="text-white font-medium">
              {used} of {limit} used
            </span>
          </div>
          <div className="h-3 rounded-full bg-[#0b0c14] border border-[#2d2e3e]/80 overflow-hidden flex">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 mx-px first:ml-0 last:mr-0 rounded-sm transition-all duration-500 ${
                  i < used
                    ? 'bg-gradient-to-r from-[#6366f1] to-[#818cf8]'
                    : 'bg-[#2d2e3e]/60'
                }`}
              />
            ))}
          </div>
          {!hasQuota && (
            <p className="text-[10px] text-amber-400 mt-1.5 font-medium">Upgrade required</p>
          )}
        </div>
      </div>
      <div
        className="sr-only"
        aria-hidden
      >
        {pct}% free quota used
      </div>
    </div>
  )
}
