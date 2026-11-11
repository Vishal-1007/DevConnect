import { Image, Upload } from 'lucide-react'
import type { CompanyProfileData } from '../../../data/recruiterCompanyProfileData'

type Props = {
  profile: CompanyProfileData
  onChange: (patch: Partial<CompanyProfileData>) => void
}

const inputClass =
  'w-full rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none'

export function CompanyBranding({ profile, onChange }: Props) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
        <h3 className="mb-4 text-sm font-semibold text-white">Visual Branding</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#2d2e3e] bg-[#0b0c14]/50 py-8 transition hover:border-violet-500/40"
          >
            <Upload size={20} className="text-violet-400" />
            <span className="text-xs text-[#8b8ca8]">Upload Company Logo</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#2d2e3e] bg-[#0b0c14]/50 py-8 transition hover:border-violet-500/40"
          >
            <Image size={20} className="text-violet-400" />
            <span className="text-xs text-[#8b8ca8]">Upload Cover Banner</span>
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
        <h3 className="mb-4 text-sm font-semibold text-white">Company Story</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">Company Tagline</label>
            <input
              className={inputClass}
              value={profile.tagline}
              onChange={(e) => onChange({ tagline: e.target.value })}
              placeholder="Powering digital transformation worldwide"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">About Company</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={4}
              value={profile.about}
              onChange={(e) => onChange({ about: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">Company Mission</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={profile.mission}
              onChange={(e) => onChange({ mission: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">Company Culture</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={profile.culture}
              onChange={(e) => onChange({ culture: e.target.value })}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
