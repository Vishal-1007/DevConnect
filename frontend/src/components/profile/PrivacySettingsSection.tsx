import { Shield } from 'lucide-react'
import { ProfileSectionHeader } from './profileUi'
import type { PrivacySettings } from '../../data/candidateProfileData'

type Props = {
  privacy: PrivacySettings
  onChange: (privacy: PrivacySettings) => void
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/50 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-[11px] text-[#8b8ca8]">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#6366f1]' : 'bg-[#2d2e3e]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

export function PrivacySettingsSection({ privacy, onChange }: Props) {
  return (
    <div className="rounded-xl border border-[#2d2e3e] bg-[#161722]/80 p-5 backdrop-blur-sm space-y-4">
      <ProfileSectionHeader
        icon={Shield}
        title="Privacy Settings"
        desc="Control what recruiters can see on your profile"
      />
      <div className="space-y-2">
        <Toggle
          label="Allow recruiters to find me"
          desc="Appear in recruiter talent search results"
          checked={privacy.allowRecruiterDiscovery}
          onChange={(v) => onChange({ ...privacy, allowRecruiterDiscovery: v })}
        />
        <Toggle
          label="Show salary"
          desc="Display expected and current salary to recruiters"
          checked={privacy.showSalary}
          onChange={(v) => onChange({ ...privacy, showSalary: v })}
        />
        <Toggle
          label="Show phone number"
          desc="Let recruiters contact you directly"
          checked={privacy.showPhone}
          onChange={(v) => onChange({ ...privacy, showPhone: v })}
        />
      </div>
    </div>
  )
}
