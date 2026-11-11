import { Sparkles } from 'lucide-react'
import type { JobListing } from '../../data/jobsData'
import { avatarUrl } from '../../lib/avatar'

interface RecommendedJobsProps {
  jobs: JobListing[]
  onSelect: (job: JobListing) => void
}

export function RecommendedJobs({ jobs, onSelect }: RecommendedJobsProps) {
  return (
    <div className="dc-glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-[#818cf8]" />
        <h3 className="text-sm font-bold text-white">Recommended for You</h3>
      </div>

      <p className="text-[10px] text-[#8b8ca8] mb-3 leading-relaxed">
        Based on your skills, DevScore, projects, and mock interview performance.
      </p>

      <div className="space-y-3">
        {jobs.length === 0 ? (
          <p className="text-xs text-[#8b8ca8]">Complete more challenges to get recommendations.</p>
        ) : (
          jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => onSelect(job)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#0b0c14]/50 border border-[#2d2e3e] hover:border-[#6366f1]/40 transition-colors text-left"
            >
              <img src={avatarUrl(job.company, 36)} alt="" className="w-9 h-9 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{job.title}</p>
                <p className="text-[10px] text-[#8b8ca8] truncate">{job.company}</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 shrink-0">{job.matchPercent}%</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
