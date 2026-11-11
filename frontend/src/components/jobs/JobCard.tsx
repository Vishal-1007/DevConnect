import { Bookmark, Briefcase, CheckCircle2, Clock, MapPin, Star } from 'lucide-react'
import type { JobListing } from '../../data/jobsData'
import { avatarUrl } from '../../lib/avatar'

interface JobCardProps {
  job: JobListing
  saved: boolean
  onViewDetails: (job: JobListing) => void
  onApply: (job: JobListing) => void
  onToggleSave: (jobId: string) => void
}

function matchColor(percent: number): string {
  if (percent >= 90) return 'text-emerald-400'
  if (percent >= 80) return 'text-[#818cf8]'
  return 'text-amber-400'
}

function matchBg(percent: number): string {
  if (percent >= 90) return 'bg-emerald-500/15 border-emerald-500/30'
  if (percent >= 80) return 'bg-[#6366f1]/15 border-[#6366f1]/30'
  return 'bg-amber-500/15 border-amber-500/30'
}

export function JobCard({ job, saved, onViewDetails, onApply, onToggleSave }: JobCardProps) {
  return (
    <article className="dc-glass-card rounded-2xl p-5 hover:border-[#6366f1]/35 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex flex-col lg:flex-row gap-4">
        <img
          src={avatarUrl(job.company, 56)}
          alt=""
          className="w-14 h-14 rounded-xl shrink-0 ring-2 ring-[#2d2e3e]"
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white">{job.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-[#8b8ca8]">{job.company}</span>
                <span className="flex items-center gap-0.5 text-xs text-amber-400">
                  <Star size={12} className="fill-amber-400" />
                  {job.companyRating}
                </span>
              </div>
            </div>

            <div className={`shrink-0 px-3 py-1.5 rounded-xl border text-center ${matchBg(job.matchPercent)}`}>
              <p className={`text-lg font-bold leading-none ${matchColor(job.matchPercent)}`}>
                {job.matchPercent}%
              </p>
              <p className="text-[9px] uppercase tracking-wide text-[#8b8ca8] mt-0.5">AI Match</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-3 text-xs text-[#8b8ca8]">
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-[#6366f1]" />
              {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase size={12} className="text-[#6366f1]" />
              {job.experience}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#6366f1]/10 text-[#a5b4fc] border border-[#6366f1]/20">
              {job.jobType}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {job.postedAt}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {job.skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#161722]/80 text-[#a5b4fc] border border-[#2d2e3e]"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-3 p-3 rounded-xl bg-[#0b0c14]/60 border border-[#2d2e3e]/80">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8b8ca8] mb-2">
              Why matched?
            </p>
            <ul className="space-y-1">
              {job.matchReasons.map((reason) => (
                <li key={reason} className="flex items-center gap-2 text-xs text-[#b4b5c8]">
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#2d2e3e]/80">
        <button
          type="button"
          onClick={() => onViewDetails(job)}
          className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#6366f1]/40 text-[#a5b4fc] hover:bg-[#6366f1]/10 transition-colors"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={() => onApply(job)}
          className="px-4 py-2 rounded-xl text-xs font-semibold dc-gradient-btn text-white hover:opacity-90 transition-opacity"
        >
          Apply Now
        </button>
        <button
          type="button"
          onClick={() => onToggleSave(job.id)}
          className={`ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            saved
              ? 'border-[#6366f1]/50 text-[#a5b4fc] bg-[#6366f1]/10'
              : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:border-[#6366f1]/30'
          }`}
        >
          <Bookmark size={14} className={saved ? 'fill-[#a5b4fc]' : ''} />
          {saved ? 'Saved' : 'Save Job'}
        </button>
      </div>
    </article>
  )
}
