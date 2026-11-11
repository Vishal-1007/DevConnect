/**
 * AdminPage — full standalone admin panel with 20 operational sections.
 * No shared app sidebar/topnav; completely self-contained layout.
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Award, Video, Zap, CalendarDays, CreditCard,
  BarChart3, MessageSquare, Hash, Calendar, Radio, ShieldAlert, Flag,
  Ban, AlertTriangle, ScrollText, LineChart, ToggleLeft, Bell,
  Search, Plus, RefreshCw, TrendingUp, Activity, CheckCircle2, XCircle,
  Clock, Star, ChevronDown, Loader2, UserCheck, LogOut,
  MoreHorizontal, Sparkles, ClipboardList, BookOpen,
  Eye, Trash2, Pin, CheckCheck, Send, RotateCcw,
  Server, AlertCircle, Info, Users2,
  MessageCircle, ThumbsUp, Code2,
} from 'lucide-react'
import { useAppSelector } from '../hooks'
import { buildLiveActivity } from '../lib/adminAnalytics'
import { AdminTopNav } from '../components/admin/AdminTopNav'
import { AdminDashboardView } from '../components/admin/AdminDashboardView'
import { AdminVideoRoomsPanel } from '../components/admin/AdminVideoRoomsPanel'
import { AdminSessionsPanel } from '../components/admin/AdminSessionsPanel'
import { AdminBookingsPanel } from '../components/admin/AdminBookingsPanel'
import { AdminPaymentsPanel } from '../components/admin/AdminPaymentsPanel'
import { AdminMarketplacePanel } from '../components/admin/AdminMarketplacePanel'
import { AdminReportsPanel } from '../components/admin/AdminReportsPanel'
import { AdminCommunityRoomsPanel } from '../components/admin/AdminCommunityRoomsPanel'
import { AdminDiscussionsPanel } from '../components/admin/AdminDiscussionsPanel'
import { AdminEventsPanel } from '../components/admin/AdminEventsPanel'
import { AdminWebinarsPanel } from '../components/admin/AdminWebinarsPanel'
import { AdminContentModerationPanel } from '../components/admin/AdminContentModerationPanel'
import { AdminBannedUsersPanel } from '../components/admin/AdminBannedUsersPanel'
import { AdminWarningsPanel } from '../components/admin/AdminWarningsPanel'
import { AdminSystemLogsPanel } from '../components/admin/AdminSystemLogsPanel'
import { AdminAnalyticsPanel } from '../components/admin/AdminAnalyticsPanel'
import { AdminFeatureManagementPanel } from '../components/admin/AdminFeatureManagementPanel'
import { AdminNotificationsPanel } from '../components/admin/AdminNotificationsPanel'
import { AdminCodingChallengesPanel } from '../components/admin/AdminCodingChallengesPanel'
import { TutorialBuilderPanel } from '../components/tutorials/TutorialBuilderPanel'
import { VideoCourseBuilderPanel } from '../components/mentor/VideoCourseBuilderPanel'
import { AdminProAdminModal } from '../components/admin/AdminProAdminModal'
import { AdminMentorRequestsView } from '../components/admin/mentor-applications/AdminMentorRequestsView'
import { AdminMentorsView } from '../components/admin/mentors/AdminMentorsView'
import { useGetPlatformHealthQuery } from '../api/adminPlatformHealthApi'
import { useListUsersQuery, useUpdateUserRoleMutation, useToggleUserEnabledMutation } from '../api/adminApi'
import {
  useListAllApplicationsQuery,
  useListAllMentorsQuery, useBlockMentorMutation, useUnblockMentorMutation,
} from '../api/mentorApi'
import { useListMatchRequestsQuery } from '../api/matchingApi'
import { useListVideoRoomsQuery } from '../api/videoRoomsApi'
import { useGetContentModerationAnalyticsQuery } from '../api/adminContentModerationApi'
import { useGetReportAnalyticsQuery } from '../api/adminReportsApi'
import { useGetWarningAnalyticsQuery } from '../api/adminWarningsApi'
import { useGetSystemLogAnalyticsQuery } from '../api/adminSystemLogsApi'
import { useListFeedQuery } from '../api/communityApi'
import { useGetLeaderboardQuery } from '../api/leaderboardApi'

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab =
  | 'dashboard' | 'users' | 'mentors' | 'requests' | 'rooms' | 'sessions'
  | 'bookings' | 'payments' | 'marketplace' | 'reports'
  | 'community-rooms' | 'discussions' | 'events' | 'webinars'
  | 'learning-resources' | 'learning-streams' | 'coding-challenges'
  | 'content-moderation' | 'reported-items' | 'banned-users' | 'warnings'
  | 'system-logs' | 'analytics' | 'feature-management' | 'notifications'

// ─── Micro helpers ────────────────────────────────────────────────────────────

const PALETTE = ['#7c3aed','#2563eb','#059669','#dc2626','#d97706','#0891b2','#be185d','#0d9488']
const avatarColor = (s: string) => PALETTE[s.charCodeAt(0) % PALETTE.length]

function Av({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.38 }}
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none">
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    green:  'bg-emerald-500/15 text-emerald-400',  red:    'bg-red-500/15 text-red-400',
    amber:  'bg-amber-500/15 text-amber-400',       blue:   'bg-blue-500/15 text-blue-400',
    purple: 'bg-violet-500/15 text-violet-400',     cyan:   'bg-cyan-500/15 text-cyan-400',
    gray:   'bg-[#2d2e3e] text-[#8b8ca8]',
  }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[color] ?? map.gray}`}>{children}</span>
}

function StatDelta({ pct }: { pct: number }) {
  const up = pct >= 0
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      <TrendingUp size={10} className={up ? '' : 'rotate-180'} />
      {up ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

function Loading() {
  return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#818cf8]" /></div>
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl flex flex-col items-center py-20 gap-3">
      <div className="text-[#2d2e3e]">{icon}</div>
      <p className="text-sm text-[#5c5d72]">{text}</p>
    </div>
  )
}

function SectionHeader({ title, sub, count, onRefresh }: {
  title: string; sub?: string; count?: number; onRefresh?: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {sub && <p className="text-xs text-[#5c5d72] mt-0.5">{sub}</p>}
      </div>
      {onRefresh && (
        <button onClick={onRefresh} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white transition-colors">
          <RefreshCw size={13} />
        </button>
      )}
      {count !== undefined && !onRefresh && (
        <span className="text-xs text-[#5c5d72] bg-[#161722] border border-[#2d2e3e] px-3 py-1 rounded-lg">{count} total</span>
      )}
    </div>
  )
}

// ─── Charts ───────────────────────────────────────────────────────────────────


function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  let offset = 0
  const R = 52, cx = 60, cy = 60, strokeW = 14
  const circumference = 2 * Math.PI * R
  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      {segments.map((seg) => {
        const dash = (seg.value / total) * circumference
        const el = (
          <circle key={seg.label} cx={cx} cy={cy} r={R}
            fill="none" stroke={seg.color} strokeWidth={strokeW}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset * circumference + circumference * 0.25}
          />
        )
        offset += seg.value / total
        return el
      })}
      <circle cx={cx} cy={cy} r={R - strokeW / 2 - 2} fill="#161722" />
    </svg>
  )
}

function BarChartSimple({ values, color = '#818cf8', height = 80 }: { values: number[]; color?: string; height?: number }) {
  const max = Math.max(...values, 1)
  const w = 100, h = height, gap = 4, barW = (w - gap * (values.length - 1)) / values.length
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {values.map((v, i) => {
        const bh = Math.max(4, (v / max) * (h - 8))
        return <rect key={i} x={i * (barW + gap)} y={h - bh} width={barW} height={bh} rx={2} fill={color} opacity={0.85} />
      })}
    </svg>
  )
}

function LineChartSimple({ series, colors, labels }: { series: number[][]; colors: string[]; labels?: string[] }) {
  const max = Math.max(...series.flat(), 1)
  const w = 400, h = 100
  const len = series[0]?.length ?? 1
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        {colors.map((c, ci) => (
          <linearGradient key={ci} id={`g${ci}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.2" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {series.map((vals, si) => {
        const pts = vals.map((v, i) => `${(i / (len - 1)) * w},${h - 8 - (v / max) * (h - 16)}`)
        const area = [...pts, `${w},${h}`, `0,${h}`].join(' ')
        return (
          <g key={si}>
            <polygon points={area} fill={`url(#g${si})`} />
            <polyline points={pts.join(' ')} stroke={colors[si]} strokeWidth="2"
              fill="none" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        )
      })}
      {labels?.map((l, i) => (
        <text key={i} x={(i / (labels.length - 1)) * w} y={h - 1} fill="#5c5d72" fontSize="8" textAnchor="middle">{l}</text>
      ))}
    </svg>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SIDEBAR_NAV = [
  {
    section: 'MAIN',
    items: [
      { id: 'dashboard'  as Tab, label: 'Dashboard',   icon: <LayoutDashboard size={15} /> },
      { id: 'users'      as Tab, label: 'Users',        icon: <Users size={15} /> },
      { id: 'mentors'    as Tab, label: 'Mentors',           icon: <Award size={15} /> },
      { id: 'requests'   as Tab, label: 'Mentor Requests',  icon: <ClipboardList size={15} />, badge: 0 as number | null },
      { id: 'rooms'      as Tab, label: 'Rooms',            icon: <Video size={15} /> },
      { id: 'sessions'   as Tab, label: 'Sessions',     icon: <Zap size={15} /> },
      { id: 'bookings'   as Tab, label: 'Bookings',     icon: <CalendarDays size={15} /> },
      { id: 'payments'   as Tab, label: 'Payments',     icon: <CreditCard size={15} /> },
      { id: 'marketplace' as Tab, label: 'Marketplace', icon: <Award size={15} /> },
      { id: 'reports'    as Tab, label: 'Reports',      icon: <BarChart3 size={15} /> },
    ],
  },
  {
    section: 'COMMUNITY',
    items: [
      { id: 'community-rooms' as Tab, label: 'Community Rooms', icon: <Video size={15} /> },
      { id: 'discussions'     as Tab, label: 'Discussions',     icon: <MessageSquare size={15} /> },
      { id: 'events'          as Tab, label: 'Events',          icon: <Calendar size={15} /> },
      { id: 'webinars'        as Tab, label: 'Webinars',        icon: <Radio size={15} /> },
    ],
  },
  {
    section: 'RESOURCES',
    items: [
      { id: 'learning-resources' as Tab, label: 'Learning Resources', icon: <BookOpen size={15} /> },
      { id: 'learning-streams'    as Tab, label: 'Learning Streams',    icon: <Radio size={15} /> },
      { id: 'coding-challenges'   as Tab, label: 'Coding Challenges',   icon: <Code2 size={15} /> },
    ],
  },
  {
    section: 'MODERATION',
    items: [
      { id: 'content-moderation' as Tab, label: 'Content Moderation', icon: <ShieldAlert size={15} />, badge: 0 as number | null },
      { id: 'reported-items'     as Tab, label: 'Reported Items',     icon: <Flag size={15} />,        badge: 0 as number | null },
      { id: 'banned-users'       as Tab, label: 'Banned Users',       icon: <Ban size={15} />,         badge: 0 as number | null },
      { id: 'warnings'           as Tab, label: 'Warnings',           icon: <AlertTriangle size={15} /> },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { id: 'system-logs'        as Tab, label: 'System Logs',          icon: <ScrollText size={15} /> },
      { id: 'analytics'          as Tab, label: 'Analytics',            icon: <LineChart size={15} /> },
      { id: 'feature-management' as Tab, label: 'Feature Management',   icon: <ToggleLeft size={15} /> },
      { id: 'notifications'      as Tab, label: 'Email & Notifications', icon: <Bell size={15} /> },
    ],
  },
]

function AdminSidebar({ active, onChange, badges }: {
  active: Tab; onChange: (t: Tab) => void
  badges: Partial<Record<Tab, number>>
}) {
  const navigate = useNavigate()
  const [proOpen, setProOpen] = useState(false)
  const { data: health } = useGetPlatformHealthQuery(undefined, { pollingInterval: 30000 })

  const statusColor =
    health?.overallStatus === 'operational'
      ? 'bg-emerald-400'
      : health?.overallStatus === 'degraded'
        ? 'bg-amber-400'
        : 'bg-red-400'
  const statusLabel = health?.overallLabel ?? 'Checking status…'

  return (
    <>
      <AdminProAdminModal open={proOpen} onClose={() => setProOpen(false)} />
      <aside className="w-[220px] shrink-0 flex flex-col h-screen bg-[#0f1018] border-r border-[#1e1f2e] overflow-y-auto">
      <div className="px-4 py-4 border-b border-[#1e1f2e] flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
          <Sparkles size={13} className="text-white" />
        </div>
        <span className="font-bold text-sm text-white tracking-tight">DevConnect</span>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-600/30 text-violet-300 border border-violet-500/30">Admin</span>
      </div>
      <div className="px-3 py-3 border-b border-[#1e1f2e] shrink-0">
        <div className="flex items-center gap-2 bg-[#161722] border border-[#2d2e3e] rounded-lg px-2.5 py-2">
          <Search size={11} className="text-[#5c5d72] shrink-0" />
          <span className="text-[11px] text-[#5c5d72] flex-1">Search…</span>
          <span className="text-[9px] bg-[#2d2e3e] text-[#5c5d72] px-1.5 py-0.5 rounded font-mono">⌘/</span>
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-5 overflow-y-auto">
        {SIDEBAR_NAV.map((group) => (
          <div key={group.section}>
            <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-[#3d3e52]">{group.section}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = active === item.id
                const badge = badges[item.id] ?? ('badge' in item && item.badge != null && item.badge > 0 ? item.badge : null)
                return (
                  <li key={item.id}>
                    <button onClick={() => onChange(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-[12px] font-medium transition-all ${
                        isActive ? 'bg-violet-600/20 text-white border-l-2 border-violet-500' : 'text-[#8b8ca8] hover:text-white hover:bg-[#161722]'
                      }`}>
                      <span className={isActive ? 'text-violet-400' : ''}>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {badge != null && badge > 0 && (
                        <span className="bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{badge}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-violet-600/25 to-indigo-600/15 border border-violet-500/20 p-3 shrink-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles size={12} className="text-violet-400" />
          <span className="text-xs font-bold text-white">Pro Admin</span>
        </div>
        <p className="text-[10px] text-[#8b8ca8] mb-2 leading-snug">Unlock advanced analytics, AI moderation and priority support.</p>
        <button
          type="button"
          onClick={() => setProOpen(true)}
          className="w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold transition-colors"
        >
          Upgrade Now
        </button>
      </div>
      <div className="px-4 py-3 border-t border-[#1e1f2e] shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-white">System Status</p>
            <p className={`text-[9px] truncate ${
              health?.overallStatus === 'operational' ? 'text-emerald-400' : health?.overallStatus === 'degraded' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {statusLabel}
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')} title="Back to app" className="text-[#5c5d72] hover:text-white transition-colors shrink-0">
            <LogOut size={13} />
          </button>
        </div>
        {health && health.services.length > 0 && (
          <ul className="space-y-1 mt-2 max-h-24 overflow-y-auto">
            {health.services.slice(0, 4).map((svc) => (
              <li key={svc.name} className="flex items-center justify-between text-[9px]">
                <span className="text-[#5c5d72] truncate">{svc.name}</span>
                <span className={svc.healthy ? 'text-emerald-400' : 'text-red-400'}>
                  {svc.healthy ? '✓' : '✗'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
    </>
  )
}

// ─── Users View ───────────────────────────────────────────────────────────────

function UsersView() {
  const { data: users, isLoading, refetch } = useListUsersQuery()
  const [updateRole]    = useUpdateUserRoleMutation()
  const [toggleEnabled] = useToggleUserEnabledMutation()
  const [search, setSearch]   = useState('')
  const [editRole, setEditRole] = useState<string | null>(null)
  const [confirm, setConfirm]  = useState<{ id: string; name: string; on: boolean } | null>(null)
  const currentId = useAppSelector((s) => s.auth.account?.id)

  const filtered = (users ?? []).filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      {confirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-2xl p-6 w-80">
            <h3 className="font-bold text-white mb-2">{confirm.on ? `Block @${confirm.name}?` : `Unblock @${confirm.name}?`}</h3>
            <p className="text-xs text-[#8b8ca8] mb-5">{confirm.on ? 'This will prevent the user from logging in.' : 'This will restore platform access.'}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg bg-[#1c1d2a] text-[#8b8ca8] hover:text-white text-sm">Cancel</button>
              <button onClick={() => { toggleEnabled(confirm.id); setConfirm(null) }}
                className={`px-4 py-2 rounded-lg text-white text-sm font-semibold ${confirm.on ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-lg font-bold text-white">Platform Users</h2><p className="text-xs text-[#5c5d72] mt-0.5">{users?.length ?? 0} total · {(users ?? []).filter(u => !u.enabled).length} suspended</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white transition-colors"><RefreshCw size={13} /></button>
          <div className="relative"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="bg-[#161722] border border-[#2d2e3e] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#818cf8] w-52" /></div>
        </div>
      </div>
      {isLoading ? <Loading /> : (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead><tr className="border-b border-[#2d2e3e] bg-[#12131c]">{['User','Email','Role','Status','Joined','Actions'].map((h) => <th key={h} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#1c1d2a]">
              {filtered.map((u) => {
                const isSelf = u.id === currentId
                return (
                  <tr key={u.id} className="hover:bg-[#1c1d2a]/50 transition-colors">
                    <td className="px-5 py-3"><div className="flex items-center gap-2.5"><Av name={u.username} size={30} /><div><p className="text-xs font-semibold text-white">{u.username}</p>{isSelf && <p className="text-[9px] text-violet-400">You</p>}</div></div></td>
                    <td className="px-5 py-3 text-xs text-[#8b8ca8]">{u.email}</td>
                    <td className="px-5 py-3">
                      {editRole === u.id ? (
                        <div className="flex items-center gap-1">
                          <select defaultValue={u.roles} autoFocus onChange={async (e) => { await updateRole({ id: u.id, roles: e.target.value }); setEditRole(null) }}
                            className="appearance-none bg-[#0b0c14] border border-[#818cf8] rounded px-2 py-1 text-xs text-white focus:outline-none">
                            {['USER','ADMIN','MODERATOR'].map((r) => <option key={r}>{r}</option>)}
                          </select>
                          <button onClick={() => setEditRole(null)} className="text-[#5c5d72] hover:text-white text-xs p-1">✕</button>
                        </div>
                      ) : (
                        <button disabled={isSelf} onClick={() => !isSelf && setEditRole(u.id)} className={!isSelf ? 'cursor-pointer hover:brightness-125' : 'cursor-default'}>
                          <Pill color={u.roles === 'ADMIN' ? 'purple' : u.roles === 'MODERATOR' ? 'blue' : 'gray'}>{u.roles}</Pill>
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3"><Pill color={u.enabled ? 'green' : 'red'}><span className={`w-1.5 h-1.5 rounded-full ${u.enabled ? 'bg-emerald-400' : 'bg-red-400'}`} />{u.enabled ? 'Active' : 'Suspended'}</Pill></td>
                    <td className="px-5 py-3 text-[10px] text-[#5c5d72]">{new Date(u.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td className="px-5 py-3">
                      {!isSelf && (
                        <button onClick={() => setConfirm({ id: u.id, name: u.username, on: u.enabled })}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${u.enabled ? 'border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                          {u.enabled ? <><Ban size={10} /> Block</> : <><UserCheck size={10} /> Unblock</>}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-[#2d2e3e] bg-[#12131c] text-[10px] text-[#5c5d72]">
            Showing <span className="text-white font-medium">{filtered.length}</span> of <span className="text-white font-medium">{users?.length ?? 0}</span> users
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reported Items View (localStorage-backed) ────────────────────────────────

type ReportStatus = 'Pending' | 'Under Review' | 'Resolved' | 'Escalated'

interface ReportItem {
  id: string; type: 'User' | 'Post' | 'Room' | 'Message'
  target: string; reason: string; reporter: string
  status: ReportStatus; date: string
}

function ReportedItemsView() {
  const { data: users } = useListUsersQuery()
  const { data: posts } = useListFeedQuery({ limit: 50 })
  const STATUS_COLOR: Record<ReportStatus, string> = { Pending: 'amber', 'Under Review': 'blue', Resolved: 'green', Escalated: 'red' }

  const seedReports = useCallback((): ReportItem[] => {
    const us = users ?? []; const ps = posts ?? []
    const reasons = ['Harassment','Spam','Fake profile','Abusive language','Scam attempt','NSFW content']
    const result: ReportItem[] = []
    for (let i = 0; i < Math.min(8, us.length); i++) {
      const reporter = us[(i + 2) % us.length]
      const base = new Date(); base.setDate(base.getDate() - i * 3)
      result.push({ id: `RPT${String(i+1).padStart(4,'0')}`, type: 'User', target: us[i].username, reason: reasons[i % reasons.length], reporter: reporter?.username ?? 'anon', status: ['Pending','Pending','Under Review','Resolved','Escalated'][i % 5] as ReportStatus, date: base.toLocaleDateString() })
    }
    for (let i = 0; i < Math.min(6, ps.length); i++) {
      const reporter = us[i % us.length]
      const base = new Date(); base.setDate(base.getDate() - i * 2)
      result.push({ id: `RPT${String(i+9).padStart(4,'0')}`, type: 'Post', target: ps[i].content.slice(0,40)+'…', reason: reasons[(i+3) % reasons.length], reporter: reporter?.username ?? 'anon', status: ['Pending','Under Review','Resolved'][i % 3] as ReportStatus, date: base.toLocaleDateString() })
    }
    return result
  }, [users, posts])

  const [reports, setReports] = useState<ReportItem[]>([])
  const [inited, setInited]   = useState(false)

  if (!inited && (users?.length || posts?.length)) {
    setReports(seedReports()); setInited(true)
  }

  function changeStatus(id: string, status: ReportStatus) {
    setReports(r => r.map(x => x.id === id ? { ...x, status } : x))
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <SectionHeader title="Reported Items" sub={`${reports.filter(r => r.status === 'Pending').length} pending · ${reports.length} total reports`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {(['Pending','Under Review','Resolved','Escalated'] as ReportStatus[]).map((s) => (
          <div key={s} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{reports.filter(r => r.status === s).length}</p>
            <Pill color={STATUS_COLOR[s]}>{s}</Pill>
          </div>
        ))}
      </div>
      {reports.length === 0 ? <Empty icon={<Flag size={40} />} text="No reports yet" /> : (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead><tr className="border-b border-[#2d2e3e] bg-[#12131c]">{['Report ID','Type','Target','Reason','Reporter','Status','Date','Actions'].map((h) => <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#1c1d2a]">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-[#1c1d2a]/50">
                  <td className="px-4 py-3 text-[10px] text-[#5c5d72] font-mono">{r.id}</td>
                  <td className="px-4 py-3"><Pill color={r.type === 'User' ? 'blue' : r.type === 'Post' ? 'purple' : 'gray'}>{r.type}</Pill></td>
                  <td className="px-4 py-3 text-xs text-white max-w-[120px] truncate">{r.target}</td>
                  <td className="px-4 py-3 text-xs text-[#8b8ca8]">{r.reason}</td>
                  <td className="px-4 py-3 text-xs text-[#5c5d72]">{r.reporter}</td>
                  <td className="px-4 py-3"><Pill color={STATUS_COLOR[r.status]}>{r.status}</Pill></td>
                  <td className="px-4 py-3 text-[10px] text-[#5c5d72]">{r.date}</td>
                  <td className="px-4 py-3">
                    <select value={r.status} onChange={(e) => changeStatus(r.id, e.target.value as ReportStatus)}
                      className="bg-[#0b0c14] border border-[#2d2e3e] rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[#818cf8]">
                      {(['Pending','Under Review','Resolved','Escalated'] as ReportStatus[]).map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


// ─── Reports View (main section) ──────────────────────────────────────────────

function ReportsView({ onTabChange }: { onTabChange: (t: Tab) => void }) {
  const { data: users   } = useListUsersQuery()
  const { data: apps    } = useListAllApplicationsQuery()
  const { data: posts   } = useListFeedQuery({ limit: 50 })
  const { data: rooms   } = useListVideoRoomsQuery({ status: 'live', limit: 50 })

  const total = (users?.length ?? 0) + (apps?.length ?? 0) + (posts?.length ?? 0) + (rooms?.length ?? 0)

  const stats = [
    { l: 'Total Users',   v: users?.length ?? 0,  delta: 12.5, color: '#818cf8', tab: 'users'    as Tab },
    { l: 'Mentor Apps',   v: apps?.length ?? 0,   delta: 9.7,  color: '#10b981', tab: 'requests' as Tab },
    { l: 'Community Posts', v: posts?.length ?? 0, delta: 18.6, color: '#f59e0b', tab: 'discussions' as Tab },
    { l: 'Active Rooms',  v: rooms?.length ?? 0,  delta: 15.2, color: '#06b6d4', tab: 'rooms'    as Tab },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      <SectionHeader title="Reports & Summary" sub={`${total} total platform records`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <button key={s.l} onClick={() => onTabChange(s.tab)} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 text-left hover:border-[#818cf8]/40 transition-colors">
            <p className="text-2xl font-bold text-white mb-1">{s.v}</p>
            <p className="text-[10px] text-[#8b8ca8] mb-2">{s.l}</p>
            <StatDelta pct={s.delta} />
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Mentor Application Status</h3>
          {['PENDING','APPROVED','REJECTED'].map((status) => {
            const count = (apps ?? []).filter(a => a.status === status).length
            const total_count = apps?.length || 1
            const cfg: Record<string, { color: string; bg: string }> = { PENDING: { color: '#f59e0b', bg: 'bg-amber-500' }, APPROVED: { color: '#10b981', bg: 'bg-emerald-500' }, REJECTED: { color: '#ef4444', bg: 'bg-red-500' } }
            return (
              <div key={status} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#8b8ca8]">{status}</span>
                  <span className="text-xs font-semibold text-white">{count}</span>
                </div>
                <div className="w-full bg-[#1c1d2a] rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${cfg[status].bg}`} style={{ width: `${(count / total_count) * 100}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">User Activity Summary</h3>
          <ul className="space-y-3">
            {[
              { l: 'Total Registered', v: users?.length ?? 0 },
              { l: 'Active Accounts',  v: (users ?? []).filter(u => u.enabled).length },
              { l: 'Suspended',        v: (users ?? []).filter(u => !u.enabled).length },
              { l: 'Admin Accounts',   v: (users ?? []).filter(u => u.roles === 'ADMIN').length },
              { l: 'Moderators',       v: (users ?? []).filter(u => u.roles === 'MODERATOR').length },
            ].map((item) => (
              <li key={item.l} className="flex items-center justify-between">
                <span className="text-xs text-[#8b8ca8]">{item.l}</span>
                <span className="text-xs font-bold text-white">{item.v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// ─── Root AdminPage ───────────────────────────────────────────────────────────

const ADMIN_POLL_MS = 15_000

export function AdminPage() {
  const account = useAppSelector((s) => s.auth.account)
  const [tab, setTab] = useState<Tab>('dashboard')
  const lastRefreshRef = useRef<Date | null>(null)

  const poll = { pollingInterval: ADMIN_POLL_MS }

  const { data: users, refetch: r1, isFetching: f1 } = useListUsersQuery(undefined, poll)
  const { data: mentors, refetch: r2, isFetching: f2 } = useListAllMentorsQuery(undefined, poll)
  const { data: applications, refetch: r3, isFetching: f3 } = useListAllApplicationsQuery(undefined, poll)
  const { data: liveRooms, refetch: r4 } = useListVideoRoomsQuery({ status: 'live', limit: 100 }, poll)
  const { data: schedRooms, refetch: r5 } = useListVideoRoomsQuery({ status: 'scheduled', limit: 100 }, poll)
  const { data: endedRooms, refetch: r6 } = useListVideoRoomsQuery({ status: 'ended', limit: 100 }, poll)
  const { data: posts, refetch: r7, isFetching: f7 } = useListFeedQuery({ limit: 100 }, poll)
  const { data: leaderboard, refetch: r8 } = useGetLeaderboardQuery(undefined, poll)
  const { data: moderationAnalytics } = useGetContentModerationAnalyticsQuery(undefined, poll)
  const { data: reportAnalytics } = useGetReportAnalyticsQuery(undefined, poll)
  const { data: warningAnalytics } = useGetWarningAnalyticsQuery(undefined, poll)
  const { data: systemLogAnalytics } = useGetSystemLogAnalyticsQuery(undefined, poll)
  useListMatchRequestsQuery(undefined, poll)

  const allRooms = useMemo(() => {
    const map = new Map<string, NonNullable<typeof liveRooms>[number]>()
    for (const r of [...(liveRooms ?? []), ...(schedRooms ?? []), ...(endedRooms ?? [])]) {
      map.set(r.id, r)
    }
    return [...map.values()]
  }, [liveRooms, schedRooms, endedRooms])

  const liveActivity = useMemo(
    () =>
      buildLiveActivity(
        users ?? [],
        applications ?? [],
        posts ?? [],
        allRooms
      ),
    [users, applications, posts, allRooms]
  )

  const isRefreshing = f1 || f2 || f3 || f7
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (!isRefreshing) {
      setLastUpdated(new Date())
    }
  }, [isRefreshing, users, applications, posts, allRooms])

  const pendingCount = (applications ?? []).filter((a) => a.status === 'PENDING').length
  const bannedCount  = (users ?? []).filter((u) => !u.enabled).length
  const username     = account?.username ?? 'Admin'

  function refetchAll() {
    const now = new Date()
    lastRefreshRef.current = now
    setLastUpdated(now)
    void Promise.all([r1(), r2(), r3(), r4(), r5(), r6(), r7(), r8()])
  }

  const mentorPendingCount = pendingCount

  const badges: Partial<Record<Tab, number>> = {
    'requests':           mentorPendingCount,
    'reported-items':     (reportAnalytics?.pendingCount ?? 0) + (reportAnalytics?.escalatedCount ?? 0),
    'banned-users':       bannedCount,
    'warnings':           warningAnalytics?.unacknowledgedWarnings ?? 0,
    'system-logs':        systemLogAnalytics?.errorCount ?? 0,
    'content-moderation': moderationAnalytics?.flaggedPosts ?? 0,
  }

  const handleTabChange = (t: string) => setTab(t as Tab)

  return (
    <div className="flex h-screen bg-[#0b0c14] text-white overflow-hidden">
      <AdminSidebar active={tab} onChange={setTab} badges={badges} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopNav
          username={username}
          pendingCount={pendingCount}
          isRefreshing={isRefreshing}
          onRefresh={refetchAll}
          onTabChange={handleTabChange}
          users={users}
          applications={applications}
          rooms={allRooms}
          posts={posts}
        />
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {tab === 'dashboard' && (
            <AdminDashboardView
              username={username}
              users={users}
              mentors={mentors}
              applications={applications}
              rooms={allRooms}
              posts={posts}
              leaderboard={leaderboard}
              liveActivity={liveActivity}
              lastUpdated={lastUpdated}
              isFetching={isRefreshing}
              onTabChange={handleTabChange}
            />
          )}
          {tab === 'users'              && <UsersView />}
          {tab === 'mentors'            && <AdminMentorsView />}
          {tab === 'requests'           && <AdminMentorRequestsView />}
          {tab === 'rooms'              && <AdminVideoRoomsPanel />}
          {tab === 'sessions'           && <AdminSessionsPanel />}
          {tab === 'bookings'           && <AdminBookingsPanel />}
          {tab === 'payments'           && <AdminPaymentsPanel />}
          {tab === 'marketplace'        && <AdminMarketplacePanel />}
          {tab === 'reports'            && <AdminReportsPanel />}
          {tab === 'community-rooms'    && <AdminCommunityRoomsPanel />}
          {tab === 'discussions'        && <AdminDiscussionsPanel />}
          {tab === 'events'             && <AdminEventsPanel />}
          {tab === 'webinars'           && <AdminWebinarsPanel />}
          {tab === 'learning-resources' && <TutorialBuilderPanel mode="admin" />}
          {tab === 'learning-streams'   && <VideoCourseBuilderPanel mode="admin" />}
          {tab === 'coding-challenges'  && <AdminCodingChallengesPanel />}
          {tab === 'content-moderation' && <AdminContentModerationPanel />}
          {tab === 'reported-items'     && <AdminReportsPanel variant="reported-items" />}
          {tab === 'banned-users'       && <AdminBannedUsersPanel />}
          {tab === 'warnings'           && <AdminWarningsPanel />}
          {tab === 'system-logs'        && <AdminSystemLogsPanel />}
          {tab === 'analytics'          && <AdminAnalyticsPanel />}
          {tab === 'feature-management' && <AdminFeatureManagementPanel />}
          {tab === 'notifications'      && <AdminNotificationsPanel />}
        </main>
      </div>
    </div>
  )
}

export default AdminPage
