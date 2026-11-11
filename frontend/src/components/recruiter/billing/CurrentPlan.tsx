import { Crown } from 'lucide-react'
import type { RecruiterUsageMetric } from '../../../types/recruiterSubscription'
import { UsageStats } from './UsageStats'

type Props = {
  planName: string
  status: string
  renewal: string
  usageMetrics: RecruiterUsageMetric[]
  onUpgrade?: () => void
}

export function CurrentPlan({ planName, status, renewal, usageMetrics, onUpgrade }: Props) {
  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">{planName}</h3>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              {status}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#8b8ca8]">{renewal}</p>
        </div>
        <button
          type="button"
          onClick={onUpgrade}
          className="shrink-0 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          Upgrade Plan
        </button>
      </div>

      <p className="mb-3 text-xs font-medium text-[#8b8ca8]">Plan Usage</p>
      <UsageStats metrics={usageMetrics} />
    </div>
  )
}
