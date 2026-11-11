import { Briefcase, FileText, Star, Calendar } from 'lucide-react'
import type { RecruiterAnalyticsStats } from '../../lib/recruiterPortalState'
import type { RecruiterTab } from './RecruiterSidebar'

type CardKey = 'activeJobs' | 'applications' | 'shortlisted' | 'interviews'

const CARDS: {
  key: CardKey
  label: string
  icon: typeof Briefcase
  color: string
  bg: string
  spark: string
  tab: RecruiterTab
}[] = [
  {
    key: 'activeJobs',
    label: 'Active Jobs',
    icon: Briefcase,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    spark: '#3b82f6',
    tab: 'jobs',
  },
  {
    key: 'applications',
    label: 'Applications',
    icon: FileText,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    spark: '#10b981',
    tab: 'applications',
  },
  {
    key: 'shortlisted',
    label: 'Shortlisted',
    icon: Star,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    spark: '#8b5cf6',
    tab: 'applications',
  },
  {
    key: 'interviews',
    label: 'Interviews',
    icon: Calendar,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    spark: '#f59e0b',
    tab: 'interviews',
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

type Props = {
  stats: RecruiterAnalyticsStats
  onNavigate: (tab: RecruiterTab, filter?: string) => void
}

export function RecruiterAnalytics({ stats, onNavigate }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, color, bg, spark, tab }) => {
        const stat = stats[key]
        return (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate(tab, key)}
            className={`rounded-2xl border p-4 text-left backdrop-blur-md transition hover:scale-[1.02] hover:brightness-110 ${bg} bg-[#161722]/60`}
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-xl border p-2 ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <MiniSparkline color={spark} />
            </div>
            <p className="mt-3 text-xs font-medium text-[#8b8ca8]">{label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
            <p className="mt-1 text-[11px] text-[#8b8ca8]">{stat.delta}</p>
          </button>
        )
      })}
    </div>
  )
}
