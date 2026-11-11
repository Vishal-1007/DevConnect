import { Link2, Shield, Sliders, User, Users } from 'lucide-react'
import type { SettingsTabId } from '../../../data/recruiterSettingsData'

const TABS: { id: SettingsTabId; label: string; icon: typeof User }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'team', label: 'Team Access', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
  { id: 'preferences', label: 'Preferences', icon: Sliders },
]

type Props = {
  activeTab: SettingsTabId
  onTabChange: (tab: SettingsTabId) => void
}

export function SettingsTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-[#2d2e3e]/60 pb-px">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition sm:text-sm ${
              isActive
                ? 'border-violet-500 text-white'
                : 'border-transparent text-[#8b8ca8] hover:text-white'
            }`}
          >
            <Icon size={15} className={isActive ? 'text-violet-400' : 'text-[#5c5d72]'} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
