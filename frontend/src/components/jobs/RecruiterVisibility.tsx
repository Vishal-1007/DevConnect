import { Eye, Search, UserCheck } from 'lucide-react'
import { RECRUITER_VISIBILITY } from '../../data/jobsData'

export function RecruiterVisibility() {
  const stats = [
    {
      label: 'Profile Views',
      value: RECRUITER_VISIBILITY.profileViews,
      icon: Eye,
      color: 'text-[#818cf8]',
    },
    {
      label: 'Recruiter Searches',
      value: RECRUITER_VISIBILITY.recruiterSearches,
      icon: Search,
      color: 'text-emerald-400',
    },
    {
      label: 'Interview Invites',
      value: RECRUITER_VISIBILITY.interviewInvites,
      icon: UserCheck,
      color: 'text-amber-400',
    },
  ]

  return (
    <div className="dc-glass-card rounded-2xl p-4">
      <h3 className="text-sm font-bold text-white mb-1">Recruiter Visibility</h3>
      <p className="text-[10px] text-[#8b8ca8] mb-4">
        How recruiters discover you through DevScore rankings
      </p>

      <div className="space-y-3">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#6366f1]/15 flex items-center justify-center shrink-0">
              <s.icon size={16} className={s.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#8b8ca8]">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
