import { Briefcase, CheckCircle2, MapPin, Sparkles, Star, X } from 'lucide-react'
import type { JobListing } from '../../data/jobsData'
import { USER_DEV_SCORE } from '../../data/jobsData'
import { avatarUrl } from '../../lib/avatar'

interface JobDetailsProps {
  job: JobListing
  onClose: () => void
  onApply: (job: JobListing) => void
}

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#8b8ca8]">{label}</span>
        <span className="text-white font-semibold">
          {max === 5 ? `${value}/5` : `${value}%`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#0b0c14] overflow-hidden">
        <div
          className="h-full rounded-full dc-gradient-btn transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function JobDetails({ job, onClose, onApply }: JobDetailsProps) {
  const { matchBreakdown } = job

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto dc-glass-card rounded-t-2xl sm:rounded-2xl border border-[#6366f1]/20 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[#2d2e3e] bg-[#161722]/95 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <img src={avatarUrl(job.company, 44)} alt="" className="w-11 h-11 rounded-xl shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{job.title}</h2>
              <p className="text-sm text-[#8b8ca8] truncate">{job.company}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#8b8ca8] hover:text-white hover:bg-[#1c1d2a] transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex flex-wrap gap-3 text-sm text-[#8b8ca8]">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-[#6366f1]" />
              {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase size={14} className="text-[#6366f1]" />
              {job.experience}
            </span>
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {job.companyRating} rating
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#a5b4fc] text-xs border border-[#6366f1]/25">
              {job.jobType}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="dc-glass-card rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase text-[#8b8ca8]">Salary</p>
              <p className="text-sm font-semibold text-white mt-1">{job.salaryRange}</p>
            </div>
            <div className="dc-glass-card rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase text-[#8b8ca8]">Min DevScore</p>
              <p className="text-sm font-semibold text-[#818cf8] mt-1">{job.minDevScore}</p>
            </div>
            <div className="dc-glass-card rounded-xl p-3 text-center col-span-2 sm:col-span-1">
              <p className="text-[10px] uppercase text-[#8b8ca8]">Your DevScore</p>
              <p className="text-sm font-semibold text-emerald-400 mt-1">{USER_DEV_SCORE}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-2">About the role</h3>
            <p className="text-sm text-[#b4b5c8] leading-relaxed">{job.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Responsibilities</h3>
            <ul className="space-y-2">
              {job.responsibilities.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#b4b5c8]">
                  <CheckCircle2 size={14} className="text-[#6366f1] mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Required skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-medium px-3 py-1 rounded-full bg-[#6366f1]/15 text-[#a5b4fc] border border-[#6366f1]/25"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#6366f1]/30 bg-gradient-to-br from-[#6366f1]/10 to-[#7c3aed]/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-[#818cf8]" />
              <h3 className="text-base font-bold text-white">Your DevConnect Match Report</h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 mb-5">
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#2d2e3e" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="url(#matchGrad)"
                    strokeWidth="3"
                    strokeDasharray={`${job.matchPercent} 100`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="matchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{job.matchPercent}%</span>
                  <span className="text-[9px] text-[#8b8ca8] uppercase">Overall</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-3">
                <ScoreBar label="Technical Skills" value={matchBreakdown.technicalSkills} />
                <ScoreBar label="Projects" value={matchBreakdown.projects} />
                <ScoreBar label="AI Interviews" value={matchBreakdown.aiInterviews} />
                <ScoreBar label="Mentor Reviews" value={matchBreakdown.mentorReviews} max={5} />
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-sm text-emerald-300">
                Your profile strongly matches this job. Your DevScore of {USER_DEV_SCORE} exceeds
                the minimum requirement of {job.minDevScore}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => onApply(job)}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl dc-gradient-btn text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Apply Now
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-[#2d2e3e] text-[#8b8ca8] hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
