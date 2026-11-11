import { Calendar, ClipboardList, FileText, Plus } from 'lucide-react'
import type { RecruiterInterview } from '../../../data/recruiterInterviewData'
import { InterviewCard } from './InterviewCard'

type BreakdownItem = { type: string; count: number; percent: number }

type Props = {
  interviews: RecruiterInterview[]
  todayUpcoming: RecruiterInterview[]
  typeBreakdown: BreakdownItem[]
  onSchedule: () => void
}

function DonutChart({ upcoming, completed, cancelled }: { upcoming: number; completed: number; cancelled: number }) {
  const total = upcoming + completed + cancelled || 1
  const segments = [
    { value: upcoming, color: '#10b981' },
    { value: completed, color: '#3b82f6' },
    { value: cancelled, color: '#ef4444' },
  ]
  let offset = 0
  const r = 40
  const c = 2 * Math.PI * r

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
        <span className="text-2xl font-bold text-white">{total}</span>
        <span className="text-[10px] text-[#8b8ca8]">Total</span>
      </div>
    </div>
  )
}

export function InterviewAnalyticsSidebar({
  interviews,
  todayUpcoming,
  typeBreakdown,
  onSchedule,
}: Props) {
  const upcoming = interviews.filter((i) => i.status === 'Upcoming').length
  const completed = interviews.filter((i) => i.status === 'Completed').length
  const cancelled = interviews.filter((i) => i.status === 'Cancelled').length

  const quickActions = [
    { icon: Plus, label: 'Schedule Interview', desc: 'Book a new interview slot', action: onSchedule },
    { icon: FileText, label: 'Interview Feedback', desc: 'Review completed interviews' },
    { icon: ClipboardList, label: 'Interview Templates', desc: 'Manage question sets' },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/70 p-4 backdrop-blur-md">
        <h3 className="mb-4 text-sm font-semibold text-white">Interview Overview</h3>
        <DonutChart upcoming={upcoming} completed={completed} cancelled={cancelled} />
        <div className="mt-4 space-y-2">
          {[
            { label: 'Upcoming', count: upcoming, color: 'bg-emerald-400' },
            { label: 'Completed', count: completed, color: 'bg-blue-400' },
            { label: 'Cancelled', count: cancelled, color: 'bg-red-400' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[#c4c5d6]">
                <span className={`h-2 w-2 rounded-full ${item.color}`} />
                {item.label}
              </span>
              <span className="font-semibold text-white">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/70 p-4 backdrop-blur-md">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Calendar size={15} className="text-violet-400" />
          Upcoming Today
        </h3>
        {todayUpcoming.length === 0 ? (
          <p className="text-xs text-[#8b8ca8]">No interviews scheduled for today.</p>
        ) : (
          <div className="space-y-2">
            {todayUpcoming.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/70 p-4 backdrop-blur-md">
        <h3 className="mb-3 text-sm font-semibold text-white">Interview Types</h3>
        <div className="space-y-3">
          {typeBreakdown.map((item) => (
            <div key={item.type}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-[#c4c5d6]">{item.type}</span>
                <span className="text-[#8b8ca8]">
                  {item.count} ({item.percent}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#2d2e3e]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7]"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/70 p-4 backdrop-blur-md">
        <h3 className="mb-3 text-sm font-semibold text-white">Quick Actions</h3>
        <div className="space-y-2">
          {quickActions.map(({ icon: Icon, label, desc, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className="flex w-full items-start gap-3 rounded-xl border border-[#2d2e3e]/60 bg-white/[0.02] p-3 text-left transition hover:border-violet-500/30 hover:bg-violet-500/5"
            >
              <div className="rounded-lg border border-violet-500/25 bg-violet-500/10 p-2">
                <Icon size={14} className="text-violet-300" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{label}</p>
                <p className="text-[10px] text-[#8b8ca8]">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
