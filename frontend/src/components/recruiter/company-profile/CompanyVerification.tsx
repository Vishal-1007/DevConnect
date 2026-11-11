import { Check, Shield, Upload } from 'lucide-react'
import type { CompanyProfileData } from '../../../data/recruiterCompanyProfileData'

type Props = {
  profile: CompanyProfileData
  onChange: (patch: Partial<CompanyProfileData>) => void
  onSubmitVerification?: () => void
}

function Toggle({
  label,
  enabled,
  onChange,
}: {
  label: string
  enabled: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#c4c5d6]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 rounded-full transition ${
          enabled ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7]' : 'bg-[#2d2e3e]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            enabled ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

export function CompanyVerification({ profile, onChange, onSubmitVerification }: Props) {
  const isVerified = profile.verificationStatus === 'verified'

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className={`rounded-xl border p-3 ${isVerified ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
            <Shield size={22} className={isVerified ? 'text-emerald-400' : 'text-amber-400'} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Company Verification</h3>
            <p className="mt-1 text-xs text-[#8b8ca8]">
              {isVerified
                ? 'Your company is fully verified on DevConnect. Candidates trust verified employers.'
                : 'Complete verification to build candidate trust and unlock premium hiring features.'}
            </p>
            {isVerified ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                <Check size={12} />
                Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={onSubmitVerification}
                className="mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-4 py-2 text-xs font-semibold text-white"
              >
                <Upload size={14} />
                Submit Verification Documents
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {profile.verificationChecks.map((check) => (
            <div key={check.id} className="flex items-center gap-2 text-sm">
              <Check
                size={14}
                className={check.verified ? 'text-emerald-400' : 'text-[#5c5d72]'}
              />
              <span className={check.verified ? 'text-[#c4c5d6]' : 'text-[#8b8ca8]'}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
        <h3 className="mb-3 text-sm font-semibold text-white">Company Settings</h3>
        <div className="divide-y divide-[#2d2e3e]/60">
          <Toggle
            label="Allow candidates to follow company"
            enabled={profile.settings.allowFollow}
            onChange={(v) => onChange({ settings: { ...profile.settings, allowFollow: v } })}
          />
          <Toggle
            label="Show hiring statistics publicly"
            enabled={profile.settings.showStatsPublicly}
            onChange={(v) => onChange({ settings: { ...profile.settings, showStatsPublicly: v } })}
          />
          <Toggle
            label="Allow direct messages from candidates"
            enabled={profile.settings.allowDirectMessages}
            onChange={(v) => onChange({ settings: { ...profile.settings, allowDirectMessages: v } })}
          />
        </div>
      </div>
    </div>
  )
}
