import { BadgeCheck, Building2, Globe, MapPin, Users } from 'lucide-react'
import type { CompanyProfileData } from '../../../data/recruiterCompanyProfileData'

type Props = {
  profile: CompanyProfileData
  onLogoUpload?: () => void
}

export function CompanyHeader({ profile, onLogoUpload }: Props) {
  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={onLogoUpload}
          className="group relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#2d2e3e] bg-white text-2xl font-bold text-[#0b0c14] transition hover:border-violet-500/40"
        >
          {profile.logoInitials}
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
            Upload
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-white sm:text-2xl">{profile.name}</h2>
            {profile.verified && (
              <span className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-300">
                <BadgeCheck size={12} />
                Verified Company
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#8b8ca8]">
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-violet-400" />
              {profile.industry}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-violet-400" />
              {profile.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-violet-400" />
              {profile.displaySize}
            </span>
            <a
              href={`https://${profile.website}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-violet-300 hover:underline"
            >
              <Globe size={14} />
              {profile.website}
            </a>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-[#8b8ca8]">Profile Completion</span>
              <span className="font-semibold text-violet-300">{profile.profileCompletion}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#2d2e3e]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7]"
                style={{ width: `${profile.profileCompletion}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
