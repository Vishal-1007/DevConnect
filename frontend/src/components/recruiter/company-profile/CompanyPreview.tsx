import { BadgeCheck, Briefcase, ExternalLink } from 'lucide-react'
import type { CompanyProfileData } from '../../../data/recruiterCompanyProfileData'

type Props = {
  profile: CompanyProfileData
  compact?: boolean
  onViewLive?: () => void
}

export function CompanyPreview({ profile, compact = false, onViewLive }: Props) {
  return (
    <div className={`rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 backdrop-blur-md ${compact ? 'p-4' : 'p-5'}`}>
      {!compact && (
        <p className="mb-3 text-xs text-[#8b8ca8]">This is how candidates see your company</p>
      )}

      <div className="overflow-hidden rounded-xl border border-[#2d2e3e] bg-[#0b0c14]">
        <div className="h-16 bg-gradient-to-r from-[#6366f1]/40 to-[#a855f7]/30" />
        <div className="px-4 pb-4">
          <div className="-mt-6 mb-3 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#161722] bg-white text-sm font-bold text-[#0b0c14]">
            {profile.logoInitials}
          </div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white">{profile.name}</h4>
            {profile.verified && <BadgeCheck size={14} className="text-blue-400" />}
          </div>
          <p className="mt-0.5 text-[11px] text-violet-300">{profile.tagline}</p>
          <p className="mt-2 line-clamp-3 text-xs text-[#8b8ca8]">{profile.about}</p>

          <div className="mt-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5c5d72]">Open Jobs</p>
            {profile.jobOverviews.slice(0, 2).map((job) => (
              <div key={job.id} className="flex items-center gap-2 text-xs text-[#c4c5d6]">
                <Briefcase size={12} className="text-violet-400" />
                {job.title}
              </div>
            ))}
          </div>

          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5c5d72]">Benefits</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {profile.benefits.slice(0, 3).map((b) => (
                <span key={b} className="rounded-full border border-[#2d2e3e] bg-white/5 px-2 py-0.5 text-[10px] text-[#8b8ca8]">
                  {b}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5c5d72]">Hiring Technologies</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {profile.technologies.slice(0, 4).map((t) => (
                <span key={t} className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-200">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewLive}
        className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-violet-300 hover:text-violet-200"
      >
        <ExternalLink size={12} />
        View Live Company Page
      </button>
    </div>
  )
}
