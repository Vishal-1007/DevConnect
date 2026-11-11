import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Flame,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Bell,
  Search,
  Settings,
  User,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../hooks'
import { useGetMyProfileQuery } from '../../api/userApi'
import { useGetUserStatsQuery } from '../../api/userStatsApi'
import { useGetMentorAccessQuery } from '../../api/mentorApi'
import { hasMentorRole } from '../../lib/roles'
import { logout } from '../../store/authSlice'
import { avatarUrl } from '../../lib/avatar'
import { NotificationBell } from './NotificationBell'
import { WalletWidget } from '../marketplace/WalletWidget'

export function TopNav() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const account = useAppSelector((s) => s.auth.account)
  const { data: profile } = useGetMyProfileQuery()
  const { data: userStats } = useGetUserStatsQuery()
  const { data: mentorAccess } = useGetMentorAccessQuery(undefined, {
    skip: !hasMentorRole(account?.roles),
  })

  const displayName = profile?.displayName ?? account?.username ?? 'Developer'
  const role = profile?.role ?? 'Learner'
  const profilePath = mentorAccess?.canAccess ? '/mentor/profile' : '/profile'
  const profileLabel = mentorAccess?.canAccess ? 'Mentor profile' : 'Learner profile'

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  function handleLogout() {
    dispatch(logout())
    navigate('/')
  }

  return (
    <header className="h-[60px] shrink-0 flex items-center gap-4 px-5 bg-[#12131c] border-b border-[#2d2e3e]">
      <div className="flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c5d72]" />
        <input
          type="search"
          placeholder="Search developers, skills, topics..."
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-sm text-white placeholder:text-[#5c5d72] focus:outline-none focus:border-[#6366f1]/50"
        />
      </div>

      <Link
        to="/find-match"
        className="shrink-0 px-5 py-2 rounded-lg dc-gradient-btn text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Find Match
      </Link>

      <div className="flex items-center gap-4 shrink-0">
        <WalletWidget />

        {/* Streak counter */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161722] border border-[#2d2e3e]">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-white">{userStats?.streak ?? 0}</span>
        </div>

        <button type="button" className="p-2 rounded-lg text-[#8b8ca8] hover:text-white hover:bg-[#1c1d2a]">
          <MessageCircle size={20} />
        </button>

        <NotificationBell />

        {/* Profile dropdown */}
        <div className="relative pl-2 border-l border-[#2d2e3e]" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[#1c1d2a] transition-colors"
          >
            <img
              src={avatarUrl(displayName, 36)}
              alt=""
              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#6366f1]/30 shrink-0"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-white leading-tight">{displayName}</p>
              <p className="text-xs text-[#8b8ca8] capitalize">{role}</p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#5c5d72] hidden sm:block transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#161722] border border-[#2d2e3e] shadow-xl z-50 overflow-hidden">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-[#2d2e3e]">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <p className="text-xs text-[#8b8ca8] truncate">{account?.email ?? account?.username}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b4b5c8] hover:text-white hover:bg-[#1c1d2a] transition-colors"
                >
                  <LayoutDashboard size={16} className="text-[#818cf8]" />
                  Dashboard
                </Link>
                <Link
                  to={profilePath}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b4b5c8] hover:text-white hover:bg-[#1c1d2a] transition-colors"
                >
                  <User size={16} className="text-[#818cf8]" />
                  {profileLabel}
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b4b5c8] hover:text-white hover:bg-[#1c1d2a] transition-colors"
                >
                  <Bell size={16} className="text-[#818cf8]" />
                  Notifications
                </Link>
                <Link
                  to="/leaderboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b4b5c8] hover:text-white hover:bg-[#1c1d2a] transition-colors"
                >
                  <Flame size={16} className="text-orange-400" />
                  Leaderboard
                </Link>
                <Link
                  to={profilePath}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b4b5c8] hover:text-white hover:bg-[#1c1d2a] transition-colors"
                >
                  <Settings size={16} className="text-[#818cf8]" />
                  Settings
                </Link>
              </div>

              <div className="border-t border-[#2d2e3e] py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
