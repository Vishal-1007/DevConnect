import type { ReactNode } from 'react'
import { BadgeCheck, Globe, Link2, Share2, Video } from 'lucide-react'
import {
  COMPANY_TYPE_OPTIONS,
  SIZE_RANGE_OPTIONS,
  type CompanyProfileData,
  type CompanyType,
  type SizeRange,
} from '../../../data/recruiterCompanyProfileData'

type Props = {
  profile: CompanyProfileData
  onChange: (patch: Partial<CompanyProfileData>) => void
}

const inputClass =
  'w-full rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">{label}</label>
      {children}
    </div>
  )
}

export function CompanyInfo({ profile, onChange }: Props) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
        <h3 className="mb-4 text-sm font-semibold text-white">Basic Company Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company Name">
            <input
              className={inputClass}
              value={profile.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </Field>
          <Field label="Official Email Domain">
            <input
              className={inputClass}
              value={profile.emailDomain}
              onChange={(e) => onChange({ emailDomain: e.target.value })}
              placeholder="@infosys.com"
            />
          </Field>
          <Field label="Company Website">
            <input
              className={inputClass}
              value={profile.website}
              onChange={(e) => onChange({ website: e.target.value })}
            />
          </Field>
          <Field label="Founded Year">
            <input
              className={inputClass}
              value={profile.foundedYear}
              onChange={(e) => onChange({ foundedYear: e.target.value })}
            />
          </Field>
          <Field label="Headquarters">
            <input
              className={inputClass}
              value={profile.headquarters}
              onChange={(e) => onChange({ headquarters: e.target.value })}
            />
          </Field>
          <Field label="Industry">
            <input
              className={inputClass}
              value={profile.industry}
              onChange={(e) => onChange({ industry: e.target.value })}
            />
          </Field>
          <Field label="Company Type">
            <select
              className={inputClass}
              value={profile.companyType}
              onChange={(e) => onChange({ companyType: e.target.value as CompanyType })}
            >
              {COMPANY_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Company Size">
            <select
              className={inputClass}
              value={profile.sizeRange}
              onChange={(e) => onChange({ sizeRange: e.target.value as SizeRange })}
            >
              {SIZE_RANGE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s} Employees</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
        <h3 className="mb-4 text-sm font-semibold text-white">Social Links</h3>
        <div className="space-y-3">
          {[
            { key: 'linkedin' as const, icon: Link2, label: 'LinkedIn Company Page' },
            { key: 'twitter' as const, icon: Share2, label: 'Twitter / X' },
            { key: 'github' as const, icon: Globe, label: 'GitHub' },
            { key: 'youtube' as const, icon: Video, label: 'YouTube' },
            { key: 'blog' as const, icon: Globe, label: 'Company Blog' },
          ].map(({ key, icon: Icon, label }) => (
            <div key={key} className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2d2e3e] bg-white/5">
                <Icon size={16} className="text-violet-400" />
              </div>
              <input
                className={inputClass}
                value={profile.social[key]}
                onChange={(e) =>
                  onChange({ social: { ...profile.social, [key]: e.target.value } })
                }
                placeholder={label}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
        <h3 className="mb-4 text-sm font-semibold text-white">Recruiter Information</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
            {profile.recruiter.avatar}
          </div>
          <div>
            <p className="flex items-center gap-2 font-semibold text-white">
              {profile.recruiter.name}
              {profile.recruiter.verified && <BadgeCheck size={14} className="text-blue-400" />}
            </p>
            <p className="text-sm text-[#8b8ca8]">{profile.recruiter.role}</p>
            <p className="text-xs text-violet-300">{profile.recruiter.email}</p>
            {profile.recruiter.verified && (
              <span className="mt-1 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                Verified Recruiter
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
        <h3 className="mb-4 text-sm font-semibold text-white">Talent Quality Insights</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Avg. Applicant DevScore', value: profile.talentInsights.avgApplicantDevScore, color: 'text-violet-300' },
            { label: 'AI Verified Candidates', value: `${profile.talentInsights.aiVerifiedPercent}%`, color: 'text-emerald-400' },
            { label: 'Mentor Verified Developers', value: `${profile.talentInsights.mentorVerifiedPercent}%`, color: 'text-blue-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 p-4 text-center">
              <p className="text-[10px] text-[#8b8ca8]">{item.label}</p>
              <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
