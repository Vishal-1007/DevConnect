import { Sparkles, TrendingUp } from 'lucide-react'
import type { RecruiterBillingData } from '../../../data/recruiterBillingData'

type Props = {
  impact: RecruiterBillingData['premiumImpact']
}

export function PremiumImpact({ impact }: Props) {
  const metrics = [
    {
      label: 'Candidates Found',
      value: impact.candidatesFound,
      delta: impact.candidatesFoundDelta,
    },
    {
      label: 'Time Saved',
      value: `${impact.timeSavedHours} hrs`,
      delta: impact.timeSavedDelta,
    },
    {
      label: 'Successful Hires',
      value: impact.successfulHires,
      delta: impact.hiresDelta,
    },
    {
      label: 'Avg. Candidate DevScore',
      value: impact.avgDevScore,
      delta: impact.avgRatingDelta,
    },
  ]

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#161722]/80 to-violet-950/20 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Your Impact with DevConnect</h3>
        </div>
        <TrendingUp size={18} className="text-violet-400/60" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 p-3"
          >
            <p className="text-[10px] text-[#8b8ca8]">{metric.label}</p>
            <p className="mt-1 text-lg font-bold text-white">{metric.value}</p>
            <p className="text-[10px] text-emerald-400">{metric.delta}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-[#8b8ca8]">
        Hire verified developers faster using AI-powered DevScore ranking
      </p>
    </div>
  )
}
