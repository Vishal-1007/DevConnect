import type { UsageMetric } from '../../../data/recruiterBillingData'
import type { RecruiterUsageMetric } from '../../../types/recruiterSubscription'

type Props = {
  metrics: UsageMetric[] | RecruiterUsageMetric[]
}

export function UsageStats({ metrics }: Props) {
  return (
    <div className="space-y-3">
      {metrics.map((metric) => {
        const unlimited = metric.limit < 0 || metric.displayLimit === 'Unlimited'
        const pct = unlimited
          ? Math.min(100, metric.used > 0 ? 35 : 8)
          : Math.min(100, Math.round((metric.used / Math.max(metric.limit, 1)) * 100))
        const isHigh = !unlimited && pct >= 85
        return (
          <div key={metric.id}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[#8b8ca8]">{metric.label}</span>
              <span className="font-medium text-white">
                {metric.used} / {unlimited ? 'Unlimited' : metric.limit}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#0b0c14]">
              <div
                className={`h-full rounded-full transition-all ${
                  isHigh
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-[#6366f1] to-[#a855f7]'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
