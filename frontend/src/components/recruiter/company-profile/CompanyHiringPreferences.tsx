import {
  EXPERIENCE_OPTIONS,
  HIRING_ROLE_OPTIONS,
  PREFERRED_SKILL_OPTIONS,
  type CompanyProfileData,
} from '../../../data/recruiterCompanyProfileData'
import { CompanyJobs } from './CompanyJobs'

type Props = {
  profile: CompanyProfileData
  onChange: (patch: Partial<CompanyProfileData>) => void
}

function toggleList(list: string[], item: string) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export function CompanyHiringPreferences({ profile, onChange }: Props) {
  function updateHiring(patch: Partial<CompanyProfileData['hiring']>) {
    onChange({ hiring: { ...profile.hiring, ...patch } })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
        <h3 className="mb-4 text-sm font-semibold text-white">Hiring Preferences</h3>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-medium text-[#8b8ca8]">Usually Hiring</p>
            <div className="flex flex-wrap gap-2">
              {HIRING_ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => updateHiring({ roles: toggleList(profile.hiring.roles, role) })}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    profile.hiring.roles.includes(role)
                      ? 'border-violet-500/50 bg-violet-500/20 text-violet-200'
                      : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-medium text-[#8b8ca8]">Preferred Skills</p>
            <div className="flex flex-wrap gap-2">
              {PREFERRED_SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => updateHiring({ skills: toggleList(profile.hiring.skills, skill) })}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    profile.hiring.skills.includes(skill)
                      ? 'border-violet-500/50 bg-violet-500/20 text-violet-200'
                      : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-medium text-[#8b8ca8]">Preferred Experience</p>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_OPTIONS.map((exp) => (
                <button
                  key={exp}
                  type="button"
                  onClick={() => updateHiring({ experience: toggleList(profile.hiring.experience, exp) })}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    profile.hiring.experience.includes(exp)
                      ? 'border-violet-500/50 bg-violet-500/20 text-violet-200'
                      : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between">
              <p className="text-[11px] font-medium text-[#8b8ca8]">Minimum DevScore Preference</p>
              <span className="text-xs font-semibold text-violet-300">{profile.hiring.minDevScore}+</span>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={50}
              value={profile.hiring.minDevScore}
              onChange={(e) => updateHiring({ minDevScore: Number(e.target.value) })}
              className="w-full accent-violet-500"
            />
          </div>
        </div>
      </section>
      <CompanyJobs profile={profile} />
    </div>
  )
}
