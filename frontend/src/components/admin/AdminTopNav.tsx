import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings,
  User,
  ClipboardList,
  Users,
} from 'lucide-react'
import { useListNotificationsQuery } from '../../api/notificationsApi'
import { searchAdminData, type AdminSearchResult } from '../../lib/adminAnalytics'
import type { AdminAccount } from '../../api/types'
import { useAppDispatch } from '../../hooks'
import { logout } from '../../store/authSlice'

function Av({ name, size = 32 }: { name: string; size?: number }) {
  const PALETTE = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#0891b2']
  const color = PALETTE[name.charCodeAt(0) % PALETTE.length]
  return (
    <div
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
    >
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export function AdminTopNav({
  username,
  pendingCount,
  isRefreshing,
  onRefresh,
  onTabChange,
  users,
  applications,
  rooms,
  posts,
}: {
  username: string
  pendingCount: number
  isRefreshing: boolean
  onRefresh: () => void
  onTabChange: (tab: string) => void
  users?: AdminAccount[]
  applications?: { id: string; username: string | null; headline: string | null; status: string }[]
  rooms?: { id: string; title: string; hostDisplayName: string }[]
  posts?: { id: string; authorDisplayName: string; content: string }[]
}) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const searchRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const { data: notifications = [] } = useListNotificationsQuery({ limit: 20 }, {
    pollingInterval: 20_000,
  })
  const unreadCount = notifications.filter((n) => !n.readAt).length

  const searchResults = searchAdminData(
    search,
    users ?? [],
    applications ?? [],
    rooms ?? [],
    posts ?? []
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setQuickOpen(false)
        setNotifOpen(false)
        setProfileOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function pickSearchResult(r: AdminSearchResult) {
    setSearch('')
    setSearchOpen(false)
    onTabChange(r.tab)
  }

  const quickActions = [
    {
      label: 'Review mentor requests',
      icon: <ClipboardList size={14} />,
      action: () => {
        setQuickOpen(false)
        onTabChange('requests')
      },
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      label: 'Manage users',
      icon: <Users size={14} />,
      action: () => {
        setQuickOpen(false)
        onTabChange('users')
      },
    },
    {
      label: 'Notifications center',
      icon: <Bell size={14} />,
      action: () => {
        setQuickOpen(false)
        onTabChange('notifications')
      },
    },
    {
      label: 'Refresh dashboard',
      icon: <RefreshCw size={14} />,
      action: () => {
        setQuickOpen(false)
        onRefresh()
      },
    },
  ]

  return (
    <header className="h-14 flex items-center gap-3 px-6 bg-[#0f1018] border-b border-[#1e1f2e] shrink-0 relative z-30">
      <div className="flex-1 relative">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setSearchOpen(true)
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search users, rooms, sessions, reports…"
          className="w-full max-w-sm bg-[#161722] border border-[#2d2e3e] rounded-lg pl-8 pr-16 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#818cf8]"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#5c5d72] font-mono bg-[#2d2e3e] px-1.5 py-0.5 rounded">
          Ctrl /
        </span>
        {searchOpen && search.trim().length >= 2 && (
          <div className="absolute top-full left-0 mt-1 w-full max-w-sm bg-[#161722] border border-[#2d2e3e] rounded-xl shadow-2xl overflow-hidden z-50">
            {searchResults.length === 0 ? (
              <p className="px-4 py-3 text-xs text-[#5c5d72]">No matches for “{search}”</p>
            ) : (
              <ul className="max-h-64 overflow-y-auto py-1">
                {searchResults.map((r) => (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      type="button"
                      onClick={() => pickSearchResult(r)}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#1c1d2a] transition-colors"
                    >
                      <p className="text-xs font-semibold text-white">{r.title}</p>
                      <p className="text-[10px] text-[#5c5d72] truncate">{r.subtitle}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setQuickOpen((o) => !o)
            setNotifOpen(false)
            setProfileOpen(false)
          }}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shrink-0"
        >
          <Plus size={13} /> Quick Action
        </button>
        {quickOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-[#161722] border border-[#2d2e3e] rounded-xl shadow-2xl py-1 z-50">
            {quickActions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={a.action}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#a5a6bb] hover:text-white hover:bg-[#1c1d2a] transition-colors"
              >
                {a.icon}
                <span className="flex-1 text-left">{a.label}</span>
                {a.badge != null && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                    {a.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setNotifOpen((o) => !o)
            setQuickOpen(false)
            setProfileOpen(false)
          }}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white transition-colors shrink-0"
          title="Notifications"
        >
          <Bell size={15} />
          {(unreadCount > 0 || pendingCount > 0) && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-black text-[8px] font-bold flex items-center justify-center">
              {Math.min(unreadCount + pendingCount, 9)}
              {unreadCount + pendingCount > 9 ? '+' : ''}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-1 w-72 bg-[#161722] border border-[#2d2e3e] rounded-xl shadow-2xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2e3e]">
              <p className="text-xs font-bold text-white">Notifications</p>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(false)
                  onTabChange('notifications')
                }}
                className="text-[10px] text-violet-400 hover:text-white"
              >
                View all
              </button>
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {notifications.length === 0 ? (
                <li className="px-4 py-4 text-[11px] text-[#5c5d72] text-center">No notifications yet</li>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-2.5 border-b border-[#1e1f2e] last:border-0 ${n.readAt ? '' : 'bg-violet-500/5'}`}
                  >
                    <p className="text-[11px] text-white font-medium">{n.title}</p>
                    <p className="text-[10px] text-[#5c5d72] line-clamp-2 mt-0.5">{n.body}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        title="Refresh live data"
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white transition-colors shrink-0 disabled:opacity-50"
      >
        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setProfileOpen((o) => !o)
            setQuickOpen(false)
            setNotifOpen(false)
          }}
          className="flex items-center gap-2 shrink-0 group"
        >
          <Av name={username} size={30} />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white leading-none">{username}</p>
            <p className="text-[10px] text-violet-400 leading-none mt-0.5">Super Admin</p>
          </div>
          <ChevronDown size={12} className="text-[#5c5d72]" />
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-[#161722] border border-[#2d2e3e] rounded-xl shadow-2xl py-1 z-50">
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false)
                onTabChange('users')
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#a5a6bb] hover:text-white hover:bg-[#1c1d2a]"
            >
              <User size={14} /> Account
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false)
                onTabChange('feature-management')
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#a5a6bb] hover:text-white hover:bg-[#1c1d2a]"
            >
              <Settings size={14} /> Settings
            </button>
            <button
              type="button"
              onClick={() => {
                dispatch(logout())
                navigate('/login', { replace: true })
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </div>

      {(searchOpen || quickOpen || notifOpen || profileOpen) && (
        <button
          type="button"
          className="fixed inset-0 z-20 cursor-default"
          aria-label="Close menus"
          onClick={() => {
            setSearchOpen(false)
            setQuickOpen(false)
            setNotifOpen(false)
            setProfileOpen(false)
          }}
        />
      )}
    </header>
  )
}
