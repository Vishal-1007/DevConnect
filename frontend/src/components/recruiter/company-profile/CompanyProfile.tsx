import { Briefcase, Eye, FileText, Save, Star, Users } from 'lucide-react'
import { useState } from 'react'
import { CompanyHeader } from './CompanyHeader'
import { CompanyInfo } from './CompanyInfo'
import { CompanyBranding } from './CompanyBranding'
import { CompanyTeam } from './CompanyTeam'
import { CompanyHiringPreferences } from './CompanyHiringPreferences'
import { CompanyVerification } from './CompanyVerification'
import { CompanyPreview } from './CompanyPreview'
import type { CompanyProfileData } from '../../../data/recruiterCompanyProfileData'
import {
  loadCompanyProfile,
  updateCompanyProfile,
} from '../../../lib/recruiterCompanyProfileStore'

type Tab = 'info' | 'branding' | 'hiring' | 'team' | 'verification'

const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Company Information' },
  { id: 'branding', label: 'Branding' },
  { id: 'hiring', label: 'Hiring Preferences' },
  { id: 'team', label: 'Team Members' },
  { id: 'verification', label: 'Verification & Settings' },
]

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  delta: string
  icon: typeof Briefcase
  color: string
}) {
  return (
    <div className="rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 p-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className={color} />
        <span className="text-[10px] text-[#8b8ca8]">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
      <p className="text-[10px] text-[#5c5d72]">{delta}</p>
    </div>
  )
}

export function CompanyProfile() {
  const [profile, setProfile] = useState<CompanyProfileData>(() => loadCompanyProfile())
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function patch(p: Partial<CompanyProfileData>) {
    setProfile((prev) => updateCompanyProfile(prev, p))
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleSave() {
    updateCompanyProfile(profile, {})
    showToast('Company profile saved successfully')
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'branding':
        return <CompanyBranding profile={profile} onChange={patch} />
      case 'hiring':
        return <CompanyHiringPreferences profile={profile} onChange={patch} />
      case 'team':
        return <CompanyTeam profile={profile} onInvite={() => showToast('Invite sent to recruiter')} />
      case 'verification':
        return (
          <CompanyVerification
            profile={profile}
            onChange={patch}
            onSubmitVerification={() => showToast('Verification documents submitted')}
          />
        )
      case 'info':
      default:
        return <CompanyInfo profile={profile} onChange={patch} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Company Profile</h1>
          <p className="mt-1 text-sm text-[#8b8ca8]">
            Manage your company branding and hiring preferences
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-2 rounded-xl border border-[#2d2e3e] bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:border-violet-500/40"
          >
            <Eye size={16} />
            Preview Company Page
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>

      <CompanyHeader profile={profile} onLogoUpload={() => showToast('Logo upload coming soon')} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="flex gap-1 overflow-x-auto border-b border-[#2d2e3e]/60 pb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 border-b-2 px-4 py-2.5 text-xs font-medium transition sm:text-sm ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-white'
                    : 'border-transparent text-[#8b8ca8] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {renderTabContent()}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-4 backdrop-blur-md">
            <h3 className="mb-3 text-sm font-semibold text-white">Company Stats</h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label="Active Jobs"
                value={profile.stats.activeJobs}
                delta={profile.stats.activeJobsDelta}
                icon={Briefcase}
                color="text-blue-400"
              />
              <StatCard
                label="Applications"
                value={profile.stats.totalApplications}
                delta={profile.stats.applicationsDelta}
                icon={FileText}
                color="text-emerald-400"
              />
              <StatCard
                label="Candidates Hired"
                value={profile.stats.candidatesHired}
                delta={profile.stats.hiredDelta}
                icon={Users}
                color="text-violet-400"
              />
              <StatCard
                label="Hiring Rating"
                value={`${profile.stats.avgHiringRating} ⭐`}
                delta="Candidate feedback"
                icon={Star}
                color="text-amber-400"
              />
            </div>
          </div>

          <CompanyVerification
            profile={profile}
            onChange={patch}
            onSubmitVerification={() => showToast('Verification documents submitted')}
          />

          <CompanyPreview
            profile={profile}
            compact
            onViewLive={() => setShowPreviewModal(true)}
          />
        </div>
      </div>

      {showPreviewModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowPreviewModal(false)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CompanyPreview profile={profile} onViewLive={() => setShowPreviewModal(false)} />
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-xl border border-violet-500/30 bg-[#161722] px-4 py-2.5 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
