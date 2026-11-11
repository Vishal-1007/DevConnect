import { useEffect, useRef } from 'react'
import { Bell, Building2, ChevronDown, CreditCard, LogOut, Plus, Settings } from 'lucide-react'
import { RECRUITER_PROFILE } from '../../data/recruiterData'
import type { RecruiterActivity } from '../../data/recruiterData'
import type { RecruiterTab } from './RecruiterSidebar'

type Props = {
  activities: RecruiterActivity[]
  unreadCount: number
  showNotifications: boolean
  showProfileMenu: boolean
  onToggleNotifications: () => void
  onToggleProfile: () => void
  onCloseMenus: () => void
  onMarkAllRead: () => void
  onNavigate: (tab: RecruiterTab) => void
  onPostJob: () => void
  readIds: Set<string>
}

export function RecruiterHeaderActions({
  activities,
  unreadCount,
  showNotifications,
  showProfileMenu,
  onToggleNotifications,
  onToggleProfile,
  onCloseMenus,
  onMarkAllRead,
  onNavigate,
  onPostJob,
  readIds,
}: Props) {
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        notifRef.current?.contains(target) ||
        profileRef.current?.contains(target)
      ) {
        return
      }
      onCloseMenus()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onCloseMenus])

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onPostJob}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        <Plus size={16} />
        Post a Job
      </button>

      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={onToggleNotifications}
          className="relative rounded-xl border border-[#2d2e3e] bg-white/5 p-2.5 text-[#8b8ca8] hover:text-white"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[#2d2e3e] bg-[#161722] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2d2e3e] px-4 py-3">
              <p className="text-sm font-semibold text-white">Notifications</p>
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-[11px] text-violet-300 hover:text-violet-200"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {activities.map((item) => (
                <div
                  key={item.id}
                  className={`border-b border-[#2d2e3e]/50 px-4 py-3 last:border-0 ${
                    !readIds.has(item.id) ? 'bg-violet-500/5' : ''
                  }`}
                >
                  <p className="text-xs font-semibold text-white">{item.title}</p>
                  <p className="text-[11px] text-[#8b8ca8]">{item.description}</p>
                  <p className="mt-0.5 text-[10px] text-[#5c5d72]">{item.timeAgo}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={onToggleProfile}
          className="flex items-center gap-2 rounded-xl border border-[#2d2e3e] bg-white/5 px-2 py-1.5 hover:bg-white/10"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold">
            {RECRUITER_PROFILE.initials}
          </div>
          <ChevronDown size={14} className="text-[#8b8ca8]" />
        </button>

        {showProfileMenu && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#2d2e3e] bg-[#161722] shadow-2xl">
            <div className="border-b border-[#2d2e3e] px-4 py-3">
              <p className="text-sm font-semibold text-white">{RECRUITER_PROFILE.name}</p>
              <p className="text-[11px] text-[#8b8ca8]">{RECRUITER_PROFILE.email}</p>
            </div>
            {[
              { tab: 'company-profile' as RecruiterTab, label: 'Company Profile', icon: Building2 },
              { tab: 'billing' as RecruiterTab, label: 'Billing & Plans', icon: CreditCard },
              { tab: 'settings' as RecruiterTab, label: 'Settings', icon: Settings },
            ].map(({ tab, label, icon: Icon }) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  onNavigate(tab)
                  onCloseMenus()
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#c4c5d6] hover:bg-white/5 hover:text-white"
              >
                <Icon size={15} className="text-violet-400" />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={onCloseMenus}
              className="flex w-full items-center gap-2 border-t border-[#2d2e3e] px-4 py-2.5 text-left text-sm text-[#8b8ca8] hover:text-white"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
