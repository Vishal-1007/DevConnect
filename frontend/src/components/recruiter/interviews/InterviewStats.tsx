import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'
import { computeInterviewStats } from '../../../lib/recruiterInterviewStore'

type Stats = ReturnType<typeof computeInterviewStats>

type Props = {
  stats: Stats
}

const CARDS = [
  {
    key: 'total',
    label: 'Total Interviews',
    icon: Calendar,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    spark: '#8b5cf6',
    deltaKey: 'totalGrowth' as const,
    valueKey: 'total' as const,
  },
  {
    key: 'upcoming',
    label: 'Upcoming',
    icon: Clock,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    spark: '#3b82f6',
    deltaKey: 'nextUpLabel' as const,
    valueKey: 'upcoming' as const,
    deltaPrefix: 'Next: ',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    spark: '#10b981',
    deltaKey: 'completedLabel' as const,
    valueKey: 'completed' as const,
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    spark: '#ef4444',
    deltaKey: 'cancelledLabel' as const,
    valueKey: 'cancelled' as const,
  },
]

function MiniSparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 24" className="h-6 w-20 opacity-70" aria-hidden>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="0,18 12,14 24,16 36,8 48,10 60,4 72,6 80,2"
      />
    </svg>
  )
}

export function InterviewStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map(({ label, icon: Icon, color, bg, spark, deltaKey, valueKey, deltaPrefix }) => (
        <div
          key={label}
          className={`rounded-2xl border p-4 backdrop-blur-md ${bg} bg-[#161722]/60`}
        >
          <div className="flex items-start justify-between">
            <div className={`rounded-xl border p-2 ${bg}`}>
              <Icon size={18} className={color} />
            </div>
            <MiniSparkline color={spark} />
          </div>
          <p className="mt-3 text-xs font-medium text-[#8b8ca8]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{stats[valueKey]}</p>
          <p className="mt-1 text-[11px] text-[#8b8ca8]">
            {deltaPrefix ?? ''}{stats[deltaKey]}
          </p>
        </div>
      ))}
    </div>
  )
}
