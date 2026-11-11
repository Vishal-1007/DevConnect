import { TOP_SKILLS_DEMAND } from '../../../data/recruiterAnalyticsData'
import { AnalyticsCardShell } from './AnalyticsCard'

type Props = {
  onViewReport?: () => void
}

export function SkillsDemand({ onViewReport }: Props) {
  return (
    <AnalyticsCardShell
      title="Top Skills In Demand"
      subtitle="Based on your job postings"
    >
      <div className="space-y-3">
        {TOP_SKILLS_DEMAND.map((item) => (
          <div key={item.skill}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-[#c4c5d6]">{item.skill}</span>
              <span className="text-[#8b8ca8]">{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#2d2e3e]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7]"
                style={{ width: `${(item.count / item.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onViewReport}
        className="mt-4 text-xs font-medium text-violet-300 hover:text-violet-200"
      >
        View full report →
      </button>
    </AnalyticsCardShell>
  )
}
