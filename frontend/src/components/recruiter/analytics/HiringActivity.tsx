import { Briefcase, Calendar, FileText, Star, Users } from 'lucide-react'
import type { AnalyticsPeriod } from '../../../data/recruiterAnalyticsData'
import { HIRING_ACTIVITIES } from '../../../data/recruiterAnalyticsData'
import { AnalyticsCardShell } from './AnalyticsCard'

const ICONS = {
  application: { icon: FileText, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  interview: { icon: Calendar, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  'talent-pool': { icon: Users, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  shortlisted: { icon: Star, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
}

type Props = {
  period: AnalyticsPeriod
  onPeriodChange: (p: AnalyticsPeriod) => void
  onViewAll?: () => void
}

export function HiringActivity({ period, onPeriodChange, onViewAll }: Props) {
  return (
    <AnalyticsCardShell
      title="Recent Activity"
      period={period}
      onPeriodChange={onPeriodChange}
    >
      <div className="space-y-3">
        {HIRING_ACTIVITIES.map((item) => {
          const meta = ICONS[item.type]
          const Icon = meta.icon
          return (
            <div key={item.id} className="flex gap-3 rounded-xl border border-[#2d2e3e]/40 bg-[#0b0c14]/30 p-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${meta.color}`}>
                <Icon size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white">{item.title}</p>
                <p className="text-[11px] text-[#8b8ca8]">{item.description}</p>
                <p className="mt-0.5 text-[10px] text-[#5c5d72]">{item.timeAgo}</p>
              </div>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        onClick={onViewAll}
        className="mt-4 text-xs font-medium text-violet-300 hover:text-violet-200"
      >
        View all activity →
      </button>
    </AnalyticsCardShell>
  )
}
