import {
  LayoutDashboard, Users, Briefcase, FileText, Calendar, MessageSquare,
  Database, BarChart3, Building2, CreditCard, Settings, Crown,
} from 'lucide-react'
import { RECRUITER_PROFILE } from '../../data/recruiterData'

export type RecruiterTab =
  | 'dashboard'
  | 'candidates'
  | 'jobs'
  | 'applications'
  | 'interviews'
  | 'messages'
  | 'talent-pool'
  | 'analytics'
  | 'company-profile'
  | 'billing'
  | 'settings'

const NAV_ITEMS: { id: RecruiterTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'applications', label: 'Applications', icon: FileText },
  { id: 'interviews', label: 'Interviews', icon: Calendar },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'talent-pool', label: 'Talent Pool', icon: Database },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'company-profile', label: 'Company Profile', icon: Building2 },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
]

type Props = {
  activeTab: RecruiterTab
  onTabChange: (tab: RecruiterTab) => void
}

export function RecruiterSidebar({ activeTab, onTabChange }: Props) {
  return (
    <aside className="flex h-screen w-[250px] shrink-0 flex-col border-r border-[#2d2e3e]/80 bg-[#0b0c14]/95 backdrop-blur-xl">
      <div className="border-b border-[#2d2e3e]/60 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-sm font-bold text-white shadow-lg shadow-violet-500/20">
            DC
          </div>
          <div>
            <p className="text-sm font-bold text-white">DevConnect</p>
            <p className="text-[11px] text-[#8b8ca8]">Recruiter Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-[#6366f1]/25 to-[#a855f7]/20 text-white shadow-inner'
                  : 'text-[#8b8ca8] hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={17} className={active ? 'text-violet-300' : 'text-[#5c5d72]'} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="space-y-3 border-t border-[#2d2e3e]/60 p-4">
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-amber-400" />
            <span className="text-xs font-semibold text-white">{RECRUITER_PROFILE.plan}</span>
          </div>
          <p className="mt-1 text-[10px] text-[#8b8ca8]">Valid until {RECRUITER_PROFILE.planValidUntil}</p>
          <button
            type="button"
            className="mt-2 w-full rounded-lg bg-gradient-to-r from-[#6366f1] to-[#a855f7] py-1.5 text-[11px] font-semibold text-white hover:opacity-90"
          >
            Upgrade Plan
          </button>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-[#2d2e3e]/60 bg-white/[0.03] p-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white">
            {RECRUITER_PROFILE.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{RECRUITER_PROFILE.name}</p>
            <p className="truncate text-[10px] text-[#8b8ca8]">{RECRUITER_PROFILE.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
