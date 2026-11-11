import { JOB_PERFORMANCE } from '../../../data/recruiterAnalyticsData'
import { AnalyticsCardShell } from './AnalyticsCard'

type Props = {
  onViewAll?: () => void
}

export function JobPerformance({ onViewAll }: Props) {
  return (
    <AnalyticsCardShell
      title="Job Performance"
      subtitle="Performance of your active job postings"
      className="lg:col-span-2"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#2d2e3e] text-[11px] uppercase tracking-wide text-[#8b8ca8]">
              <th className="pb-3 pr-4 font-medium">Job Title</th>
              <th className="pb-3 pr-4 font-medium">Views</th>
              <th className="pb-3 pr-4 font-medium">Applications</th>
              <th className="pb-3 pr-4 font-medium">Shortlisted</th>
              <th className="pb-3 pr-4 font-medium">Interviews</th>
              <th className="pb-3 pr-4 font-medium">Hired</th>
              <th className="pb-3 font-medium">Conversion</th>
            </tr>
          </thead>
          <tbody>
            {JOB_PERFORMANCE.map((job) => (
              <tr key={job.id} className="border-b border-[#2d2e3e]/50 hover:bg-white/[0.02]">
                <td className="py-3 pr-4 font-medium text-white">{job.title}</td>
                <td className="py-3 pr-4 text-[#c4c5d6]">{job.views}</td>
                <td className="py-3 pr-4 text-[#c4c5d6]">{job.applications}</td>
                <td className="py-3 pr-4 text-[#c4c5d6]">{job.shortlisted}</td>
                <td className="py-3 pr-4 text-[#c4c5d6]">{job.interviews}</td>
                <td className="py-3 pr-4 text-[#c4c5d6]">{job.hired}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#2d2e3e]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7]"
                        style={{ width: `${Math.min(job.conversionRate * 10, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-violet-300">{job.conversionRate}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={onViewAll}
        className="mt-4 text-xs font-medium text-violet-300 hover:text-violet-200"
      >
        View all jobs analytics →
      </button>
    </AnalyticsCardShell>
  )
}
