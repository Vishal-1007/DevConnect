import { FileText, Star, Calendar, Briefcase } from 'lucide-react'
import type { RecruiterActivity } from '../../data/recruiterData'

const ICONS = {
  application: { icon: FileText, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  shortlisted: { icon: Star, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  interview: { icon: Calendar, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  job: { icon: Briefcase, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
}

type Props = {
  activities: RecruiterActivity[]
}

export function RecentActivity({ activities }: Props) {
  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/70 p-4 backdrop-blur-md">
      <h3 className="mb-3 text-sm font-semibold text-white">Recent Activity</h3>
      <div className="space-y-3">
        {activities.slice(0, 4).map((item) => {
          const meta = ICONS[item.type]
          const Icon = meta.icon
          return (
            <div key={item.id} className="flex gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.color}`}>
                <Icon size={14} />
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
    </div>
  )
}
