import { UserPlus } from 'lucide-react'
import type { CompanyProfileData } from '../../../data/recruiterCompanyProfileData'

type Props = {
  profile: CompanyProfileData
  onInvite?: () => void
}

export function CompanyTeam({ profile, onInvite }: Props) {
  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{profile.name} Hiring Team</h3>
          <p className="text-xs text-[#8b8ca8]">{profile.team.length} recruiters connected</p>
        </div>
        <button
          type="button"
          onClick={onInvite}
          className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-500/20"
        >
          <UserPlus size={14} />
          Invite Recruiter
        </button>
      </div>

      <div className="space-y-3">
        {profile.team.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
                {member.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{member.name}</p>
                <p className="text-xs text-[#8b8ca8]">{member.role}</p>
              </div>
            </div>
            {member.isAdmin && (
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-200">
                Admin
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
