import { TIME_TO_HIRE_STAGES } from '../../../data/recruiterAnalyticsData'
import { AnalyticsCardShell } from './AnalyticsCard'

type Props = {
  onViewDetails?: () => void
}

export function TimeToHire({ onViewDetails }: Props) {
  return (
    <AnalyticsCardShell
      title="Time to Hire"
      subtitle="Average time taken in each stage"
    >
      <div className="space-y-3">
        {TIME_TO_HIRE_STAGES.map((item, i) => (
          <div
            key={item.stage}
            className={`flex items-center justify-between text-sm ${
              i === TIME_TO_HIRE_STAGES.length - 1 ? 'border-t border-[#2d2e3e]/60 pt-3 font-semibold' : ''
            }`}
          >
            <span className={i === TIME_TO_HIRE_STAGES.length - 1 ? 'text-white' : 'text-[#c4c5d6]'}>
              {item.stage}
            </span>
            <span className={item.days === '--' ? 'text-[#5c5d72]' : 'text-emerald-400'}>
              {item.days}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onViewDetails}
        className="mt-4 text-xs font-medium text-violet-300 hover:text-violet-200"
      >
        View details →
      </button>
    </AnalyticsCardShell>
  )
}
