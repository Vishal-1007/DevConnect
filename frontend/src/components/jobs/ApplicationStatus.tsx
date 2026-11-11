import { APPLICATION_STATS } from '../../data/jobsData'

const STATUS_ITEMS = [
  { key: 'inReview', label: 'In Review', color: '#818cf8' },
  { key: 'shortlisted', label: 'Shortlisted', color: '#34d399' },
  { key: 'interviewScheduled', label: 'Interview Scheduled', color: '#60a5fa' },
  { key: 'rejected', label: 'Rejected', color: '#f87171' },
] as const

export function ApplicationStatus() {
  const total = APPLICATION_STATS.total
  const segments = STATUS_ITEMS.map((s) => ({
    ...s,
    value: APPLICATION_STATS[s.key],
  }))

  let offset = 0
  const circumference = 2 * Math.PI * 40

  return (
    <div className="dc-glass-card rounded-2xl p-4">
      <h3 className="text-sm font-bold text-white mb-4">Application Tracker</h3>

      <div className="flex flex-col items-center mb-4">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#2d2e3e" strokeWidth="12" />
            {segments.map((seg) => {
              const dash = total > 0 ? (seg.value / total) * circumference : 0
              const el = (
                <circle
                  key={seg.key}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="12"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              )
              offset += dash
              return el
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-[9px] text-[#8b8ca8] uppercase">Applied</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0b0c14]/50 border border-[#2d2e3e]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[10px] text-[#8b8ca8] truncate">{seg.label}</span>
            </div>
            <span className="text-xs font-bold text-white">{seg.value}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="w-full mt-3 py-2 rounded-xl text-xs font-semibold text-[#818cf8] border border-[#6366f1]/30 hover:bg-[#6366f1]/10 transition-colors"
      >
        View All Applications
      </button>
    </div>
  )
}
