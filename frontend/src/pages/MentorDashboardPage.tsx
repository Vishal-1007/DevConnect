/**
 * MentorDashboardPage — complete standalone mentor workspace.
 * Own layout (no shared app sidebar). Accessible via /mentor.
 * Only approved mentors can view this page.
 */
import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Video, Inbox, Users, Code2, BookOpen, CalendarDays,
  Clock, Package, Star, MessageSquare, Radio, Hash, Calendar,
  DollarSign, BarChart3, Sparkles, Trophy, FileText, HelpCircle,
  GraduationCap, TrendingUp, Loader2, Search, Bell, ChevronDown,
  Play, Mic, Camera, Monitor, Edit3, RefreshCw,
  StopCircle, CheckCircle2, XCircle, Pin, Trash2, Send,
  Plus, LogOut, Check, AlertTriangle, ChevronRight, Eye,
  Activity, MessageCircle, Bookmark,
  Users2, Timer, Target, PhoneOff, UserPlus, User, Settings,
} from 'lucide-react'
import { useAppSelector, useAppDispatch } from '../hooks'
import { logout } from '../store/authSlice'
import {
  useGetMentorQuery, useGetMyApplicationQuery,
} from '../api/mentorApi'
import { useListMatchRequestsQuery } from '../api/matchingApi'
import {
  useListVideoRoomsQuery, useCreateVideoRoomMutation, useEndVideoRoomMutation,
} from '../api/videoRoomsApi'
import { NotificationBell } from '../components/layout/NotificationBell'
import { LiveSessionWorkspace } from '../components/live-sessions/LiveSessionWorkspace'
import { SessionRequestsPanel } from '../components/mentor/SessionRequestsPanel'
import { MockInterviewRequestsPanel } from '../components/mentor/MockInterviewRequestsPanel'
import { MentorshipRequestsPanel } from '../components/mentor/MentorshipRequestsPanel'
import { useGetMentorMentorshipRequestCountQuery } from '../api/mentorshipApi'
import { MentorVideoRoomsPanel } from '../components/mentor/MentorVideoRoomsPanel'
import { MentorCreateChallengePanel } from '../components/mentor/MentorCreateChallengePanel'
import { IncomingPairRequests } from '../components/pair-programming/IncomingPairRequests'
import { MentorStudentsPanel } from '../components/mentor/MentorStudentsPanel'
import { MentorBookingsPanel } from '../components/mentor/MentorBookingsPanel'
import { MentorAvailabilityPanel } from '../components/mentor/MentorAvailabilityPanel'
import { MentorMentorshipPlansPanel } from '../components/mentor/MentorMentorshipPlansPanel'
import { MentorFeedbackPanel } from '../components/mentor/MentorFeedbackPanel'
import { MentorCommunityRoomsPanel } from '../components/mentor/MentorCommunityRoomsPanel'
import { MentorDiscussionsPanel } from '../components/mentor/MentorDiscussionsPanel'
import { MentorEventsPanel } from '../components/mentor/MentorEventsPanel'
import { MentorEarningsPanel } from '../components/mentor/MentorEarningsPanel'
import { MentorSessionAnalyticsPanel } from '../components/mentor/MentorSessionAnalyticsPanel'
import { MentorPerformanceInsightsPanel } from '../components/mentor/MentorPerformanceInsightsPanel'
import { MentorLeaderboardPanel } from '../components/mentor/MentorLeaderboardPanel'
import { MentorSharedNotesPanel } from '../components/mentor/MentorSharedNotesPanel'
import { MentorInterviewQuestionBankPanel } from '../components/mentor/MentorInterviewQuestionBankPanel'
import { MentorInterviewPacksPanel } from '../components/mentor/MentorInterviewPacksPanel'
import { MentorPricingPanel } from '../components/marketplace/MentorPricingPanel'
import { TutorialBuilderPanel } from '../components/tutorials/TutorialBuilderPanel'
import { VideoCourseBuilderPanel } from '../components/mentor/VideoCourseBuilderPanel'
import { IncomingCallDialog } from '../components/find-match/IncomingCallDialog'
import { IncomingMatchRequestDialog } from '../components/find-match/IncomingMatchRequestDialog'
import { useMatchFlow } from '../hooks/useMatchFlow'
import { useLiveMatchEvents } from '../hooks/useLiveMatchEvents'
import { WebRTCProvider, useWebRTCContext } from '../contexts/WebRTCContext'
import { useGetMyProfileQuery } from '../api/userApi'
import {
  useGetMentorSessionRequestsQuery,
  useGetMentorDashboardQuery,
  useGetMentorStudentsQuery,
  useGetMentorBookingsQuery,
  useConfirmMentorBookingMutation,
  useCompleteMentorBookingMutation,
  useCancelMentorBookingMutation,
  useGetMentorAvailabilityQuery,
  useSaveMentorAvailabilityMutation,
  useGetMentorReviewsSummaryQuery,
  type AvailabilitySlot,
} from '../api/mentorWorkspaceApi'
import { useCreateEventMutation } from '../api/eventsApi'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab =
  | 'dashboard' | 'live-sessions' | 'session-requests' | 'mentorship-requests' | 'video-rooms' | 'pair-programming'
  | 'my-students' | 'bookings' | 'availability' | 'plans' | 'feedback'
  | 'community-rooms' | 'host-webinar' | 'discussions' | 'events'
  | 'earnings' | 'marketplace-pricing' | 'session-analytics' | 'insights' | 'leaderboard'
  | 'shared-notes' | 'question-bank' | 'interview-packs' | 'resources' | 'learning-streams'

// ─── Shared Helpers ───────────────────────────────────────────────────────────

const PALETTE = ['#7c3aed','#2563eb','#059669','#dc2626','#d97706','#0891b2','#be185d','#0d9488']
const AVAIL_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as const
const DAY_TO_JAVA: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }
const JAVA_TO_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function slotsToGrid(slots: AvailabilitySlot[]): Record<string, Set<string>> {
  const grid: Record<string, Set<string>> = Object.fromEntries(AVAIL_DAYS.map((d) => [d, new Set<string>()]))
  for (const slot of slots) {
    const day = JAVA_TO_DAY[slot.dayOfWeek] ?? 'Mon'
    const startH = parseInt(slot.startTime.split(':')[0] ?? '0', 10)
    const endH = parseInt(slot.endTime.split(':')[0] ?? '0', 10)
    for (let h = startH; h < endH; h++) {
      grid[day]?.add(`${String(h).padStart(2, '0')}:00`)
    }
  }
  return grid
}

function gridToSlots(grid: Record<string, Set<string>>) {
  const slots: { dayOfWeek: number; startTime: string; endTime: string }[] = []
  for (const day of AVAIL_DAYS) {
    const hours = [...(grid[day] ?? [])].map((s) => parseInt(s.split(':')[0] ?? '0', 10)).sort((a, b) => a - b)
    if (hours.length === 0) continue
    let start = hours[0]
    let prev = hours[0]
    for (let i = 1; i <= hours.length; i++) {
      const h = hours[i]
      if (h === prev + 1) { prev = h; continue }
      slots.push({ dayOfWeek: DAY_TO_JAVA[day] ?? 1, startTime: `${String(start).padStart(2, '0')}:00`, endTime: `${String(prev + 1).padStart(2, '0')}:00` })
      start = h
      prev = h
    }
  }
  return slots
}

function bookingStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled',
    refund_requested: 'Refund Requested', refunded: 'Refunded',
  }
  return map[status] ?? status
}

function bookingStatusColor(status: string) {
  const map: Record<string, string> = {
    pending: 'amber', confirmed: 'blue', completed: 'green', cancelled: 'red',
    refund_requested: 'amber', refunded: 'gray',
  }
  return map[status] ?? 'gray'
}
const avatarColor = (s: string) => PALETTE[(s.charCodeAt(0) ?? 0) % PALETTE.length]

function Av({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.38 }}
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none">
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  const m: Record<string, string> = {
    green: 'bg-emerald-500/15 text-emerald-400', red:    'bg-red-500/15 text-red-400',
    amber: 'bg-amber-500/15 text-amber-400',     blue:   'bg-blue-500/15 text-blue-400',
    purple:'bg-violet-500/15 text-violet-400',   cyan:   'bg-cyan-500/15 text-cyan-400',
    gray:  'bg-[#2d2e3e] text-[#8b8ca8]',        indigo: 'bg-indigo-500/15 text-indigo-400',
  }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${m[color] ?? m.gray}`}>{children}</span>
}

function StatDelta({ pct, inverse = false }: { pct: number; inverse?: boolean }) {
  const positive = inverse ? pct <= 0 : pct >= 0
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      <TrendingUp size={10} className={positive ? '' : 'rotate-180'} />
      {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

function Loading() { return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-[#818cf8]" /></div> }

function Empty({ icon, text, sub }: { icon: React.ReactNode; text: string; sub?: string }) {
  return (
    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl flex flex-col items-center py-16 gap-3">
      <div className="text-[#2d2e3e]">{icon}</div>
      <p className="text-sm font-semibold text-[#5c5d72]">{text}</p>
      {sub && <p className="text-xs text-[#3d3e52]">{sub}</p>}
    </div>
  )
}

function SectionWrap({ title, sub, children, action }: {
  title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="flex-1 min-w-0 w-full overflow-y-auto">
      <div className="w-full max-w-none px-6 py-5 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-lg font-bold text-white">{title}</h2>{sub && <p className="text-xs text-[#5c5d72] mt-0.5">{sub}</p>}</div>
          {action}
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Mini Charts ──────────────────────────────────────────────────────────────

function SparkLine({ values, color = '#818cf8', h = 40 }: { values: number[]; color?: string; h?: number }) {
  const max = Math.max(...values, 1); const w = 120
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(' ')
  const area = [...values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 4)}`), `${w},${h}`, `0,${h}`].join(' ')
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs><linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={area} fill={`url(#sg${color.replace('#','')})`} />
      <polyline points={pts} stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function BarChart({ values, color = '#818cf8', h = 60 }: { values: number[]; color?: string; h?: number }) {
  const max = Math.max(...values, 1); const gapRatio = 0.15
  const barW = (100 - gapRatio * (values.length - 1) * 100 / values.length) / values.length
  return (
    <svg width="100%" height={h} viewBox={`0 0 100 ${h}`} preserveAspectRatio="none">
      {values.map((v, i) => {
        const bh = Math.max(3, (v / max) * (h - 4))
        return <rect key={i} x={i * (100 / values.length)} y={h - bh} width={barW} height={bh} rx="2" fill={color} opacity="0.85" />
      })}
    </svg>
  )
}

function LineChart({ series, colors, h = 100 }: { series: number[][]; colors: string[]; h?: number }) {
  const max = Math.max(...series.flat(), 1); const len = series[0]?.length ?? 1
  return (
    <svg width="100%" height={h} viewBox={`0 0 400 ${h}`} preserveAspectRatio="none">
      <defs>{colors.map((c, ci) => <linearGradient key={ci} id={`lg${ci}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity="0.2" /><stop offset="100%" stopColor={c} stopOpacity="0" /></linearGradient>)}</defs>
      {series.map((vals, si) => {
        const pts = vals.map((v, i) => `${(i / (len - 1)) * 400},${h - 8 - (v / max) * (h - 16)}`)
        return (
          <g key={si}>
            <polygon points={[...pts, `400,${h}`, `0,${h}`].join(' ')} fill={`url(#lg${si})`} />
            <polyline points={pts.join(' ')} stroke={colors[si]} strokeWidth="2" fill="none" strokeLinejoin="round" />
          </g>
        )
      })}
    </svg>
  )
}

function ProgressBar({ value, color = '#818cf8', label }: { value: number; color?: string; label?: string }) {
  return (
    <div>
      {label && <div className="flex justify-between text-[10px] mb-1"><span className="text-[#8b8ca8]">{label}</span><span className="text-white font-semibold">{value}%</span></div>}
      <div className="w-full bg-[#1c1d2a] rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const MENTOR_NAV = [
  {
    section: 'MAIN',
    items: [
      { id: 'dashboard'         as Tab, label: 'Mentor Dashboard',  icon: <LayoutDashboard size={14} /> },
      { id: 'live-sessions'     as Tab, label: 'Live Sessions',      icon: <Video size={14} />,           live: true },
      { id: 'session-requests'  as Tab, label: 'Session Requests',   icon: <Inbox size={14} />,           badge: 'session' },
      { id: 'mentorship-requests' as Tab, label: 'Mentorship Requests', icon: <UserPlus size={14} />,   badge: 'mentorship' },
      { id: 'video-rooms'       as Tab, label: 'Video Rooms',        icon: <Video size={14} /> },
      { id: 'pair-programming'  as Tab, label: 'Pair Programming',   icon: <Code2 size={14} /> },
    ],
  },
  {
    section: 'MENTORSHIP',
    items: [
      { id: 'my-students'  as Tab, label: 'My Students',         icon: <Users size={14} /> },
      { id: 'bookings'     as Tab, label: 'Bookings',            icon: <CalendarDays size={14} /> },
      { id: 'availability' as Tab, label: 'Availability',        icon: <Clock size={14} /> },
      { id: 'plans'        as Tab, label: 'Mentorship Plans',    icon: <Package size={14} /> },
      { id: 'feedback'     as Tab, label: 'Feedback & Reviews',  icon: <Star size={14} /> },
    ],
  },
  {
    section: 'COMMUNITY',
    items: [
      { id: 'community-rooms' as Tab, label: 'Community Rooms', icon: <Users2 size={14} /> },
      { id: 'host-webinar'    as Tab, label: 'Host Webinar',    icon: <Radio size={14} /> },
      { id: 'discussions'     as Tab, label: 'Discussions',     icon: <MessageSquare size={14} /> },
      { id: 'events'          as Tab, label: 'Events',          icon: <Calendar size={14} /> },
    ],
  },
  {
    section: 'ANALYTICS',
    items: [
      { id: 'earnings'          as Tab, label: 'Earnings',            icon: <DollarSign size={14} /> },
      { id: 'marketplace-pricing' as Tab, label: 'Pricing & Earnings', icon: <DollarSign size={14} /> },
      { id: 'session-analytics' as Tab, label: 'Session Analytics',   icon: <BarChart3 size={14} /> },
      { id: 'insights'          as Tab, label: 'Performance Insights', icon: <Sparkles size={14} /> },
      { id: 'leaderboard'       as Tab, label: 'Leaderboard Rank',    icon: <Trophy size={14} /> },
    ],
  },
  {
    section: 'RESOURCES',
    items: [
      { id: 'shared-notes'  as Tab, label: 'Shared Notes',          icon: <FileText size={14} /> },
      { id: 'question-bank' as Tab, label: 'Interview Question Bank',icon: <HelpCircle size={14} /> },
      { id: 'interview-packs' as Tab, label: 'Interview Packs',       icon: <Package size={14} /> },
      { id: 'resources'     as Tab, label: 'Learning Resources',    icon: <GraduationCap size={14} /> },
      { id: 'learning-streams' as Tab, label: 'Learning Streams', icon: <Radio size={14} /> },
    ],
  },
]

function MentorSidebar({ active, onChange, sessionRequestCount, mentorshipRequestCount, displayName, rating }: {
  active: Tab; onChange: (t: Tab) => void
  sessionRequestCount: number; mentorshipRequestCount: number
  displayName: string; rating: number
}) {
  const navigate = useNavigate()
  return (
    <aside className="w-[210px] shrink-0 flex flex-col h-screen bg-[#0f1018] border-r border-[#1e1f2e] overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-3.5 border-b border-[#1e1f2e] flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
          <Code2 size={13} className="text-white" />
        </div>
        <span className="font-bold text-sm text-white tracking-tight">DevConnect</span>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">Mentor</span>
      </div>

      {/* Mentor card */}
      <div className="px-3 py-3 border-b border-[#1e1f2e]">
        <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2.5 mb-2">
            <Av name={displayName} size={32} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{displayName}</p>
              <div className="flex items-center gap-1">
                <Star size={9} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] text-amber-400 font-semibold">{rating.toFixed(1)}</span>
                <span className="text-[9px] text-[#5c5d72]">rating</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-semibold">Available for sessions</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-5 overflow-y-auto">
        {MENTOR_NAV.map((group) => (
          <div key={group.section}>
            <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-[#3d3e52]">{group.section}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = active === item.id
                const badge = item.badge === 'session' && sessionRequestCount > 0
                  ? sessionRequestCount
                  : item.badge === 'mentorship' && mentorshipRequestCount > 0
                    ? mentorshipRequestCount
                    : null
                return (
                  <li key={item.id}>
                    <button onClick={() => onChange(item.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[11.5px] font-medium transition-all ${
                        isActive ? 'bg-violet-600/20 text-white border-l-2 border-violet-500' : 'text-[#8b8ca8] hover:text-white hover:bg-[#161722]'
                      }`}>
                      <span className={isActive ? 'text-violet-400' : ''}>{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.live && <span className="text-[8px] font-bold bg-red-500 text-white px-1 py-0.5 rounded animate-pulse">LIVE</span>}
                      {badge != null && <span className="bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">{badge}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Upgrade */}
      <div className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-violet-600/25 to-indigo-600/15 border border-violet-500/20 p-3 shrink-0">
        <div className="flex items-center gap-1.5 mb-1"><Sparkles size={11} className="text-violet-400" /><span className="text-xs font-bold text-white">Upgrade to Pro</span></div>
        <p className="text-[10px] text-[#8b8ca8] mb-2 leading-snug">Better visibility, AI assistant, unlimited webinars & analytics.</p>
        <button className="w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold transition-colors">Upgrade Now</button>
      </div>

      {/* Back to app */}
      <div className="px-4 py-3 border-t border-[#1e1f2e] shrink-0 space-y-2">
        <button onClick={() => navigate('/mentor/profile')} className="flex items-center gap-2 text-[11px] text-violet-400 hover:text-violet-300 transition-colors w-full">
          <User size={13} /> Edit Mentor Profile
        </button>
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-[11px] text-[#5c5d72] hover:text-white transition-colors w-full">
          <LogOut size={13} /> Back to App
        </button>
      </div>
    </aside>
  )
}

// ─── Top Nav ──────────────────────────────────────────────────────────────────

function MentorTopNav({ displayName, earnings, earningsLabel, rating, reviewCount, rankLabel, onGoLive }: {
  displayName: string; earnings: number; earningsLabel?: string; rating: number; reviewCount: number
  rankLabel: string; onGoLive: () => void
}) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const account = useAppSelector((s) => s.auth.account)
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
    <header className="h-14 flex items-center gap-3 px-5 bg-[#0f1018] border-b border-[#1e1f2e] shrink-0">
      <div className="flex-1 relative max-w-sm">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
        <input placeholder="Search learners, rooms, skills…"
          className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-8 pr-16 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#818cf8]" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#5c5d72] font-mono bg-[#2d2e3e] px-1.5 py-0.5 rounded">Ctrl /</span>
      </div>

      <button onClick={onGoLive} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shrink-0">
        <Play size={12} /> Go Live
      </button>
      <button className="flex items-center gap-1.5 bg-[#161722] hover:bg-[#2d2e3e] border border-[#2d2e3e] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shrink-0">
        <Video size={12} className="text-[#818cf8]" /> Start Interview
      </button>

      {/* Earnings */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-[#161722] border border-[#2d2e3e] rounded-lg shrink-0">
        <DollarSign size={13} className="text-emerald-400" />
        <span className="text-xs font-bold text-white">{earningsLabel ?? `$${earnings.toFixed(2)}`}</span>
        <span className="text-[9px] text-[#5c5d72]">Earnings</span>
      </div>

      {/* Rating */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-[#161722] border border-[#2d2e3e] rounded-lg shrink-0">
        <Star size={13} className="text-amber-400 fill-amber-400" />
        <span className="text-xs font-bold text-white">{rating.toFixed(1)}</span>
        <span className="text-[9px] text-[#5c5d72]">{reviewCount} Reviews</span>
      </div>

      {/* Notifications */}
      <div className="shrink-0 [&_button]:bg-[#161722] [&_button]:border [&_button]:border-[#2d2e3e]">
        <NotificationBell viewAllPath="/notifications" />
      </div>

      {/* Profile dropdown */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-[#1c1d2a] transition-colors"
        >
          <Av name={displayName} size={30} />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white leading-none">{displayName}</p>
            <p className="text-[10px] text-violet-400 leading-none mt-0.5">{rankLabel}</p>
          </div>
          <ChevronDown
            size={12}
            className={`text-[#5c5d72] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#161722] border border-[#2d2e3e] shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2d2e3e]">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-[#8b8ca8] truncate">{account?.email ?? account?.username}</p>
            </div>

            <div className="py-1">
              <Link
                to="/mentor/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b4b5c8] hover:text-white hover:bg-[#1c1d2a] transition-colors"
              >
                <LayoutDashboard size={16} className="text-[#818cf8]" />
                Mentor Dashboard
              </Link>
              <Link
                to="/mentor/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b4b5c8] hover:text-white hover:bg-[#1c1d2a] transition-colors"
              >
                <User size={16} className="text-[#818cf8]" />
                Edit Mentor Profile
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
                to="/mentor/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b4b5c8] hover:text-white hover:bg-[#1c1d2a] transition-colors"
              >
                <Settings size={16} className="text-[#818cf8]" />
                Settings
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b4b5c8] hover:text-white hover:bg-[#1c1d2a] transition-colors"
              >
                <LogOut size={16} className="text-[#818cf8]" />
                Back to App
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
    </header>
  )
}

// ─── Right Panel (Dashboard) ──────────────────────────────────────────────────

function MentorRightPanel({ dashboard, onTab }: {
  dashboard: ReturnType<typeof useGetMentorDashboardQuery>['data']
  onTab: (t: Tab) => void
}) {
  const pending = dashboard?.pendingRequests ?? []
  const [confirmBooking] = useConfirmMentorBookingMutation()
  const [cancelBooking] = useCancelMentorBookingMutation()
  const [suggestionSeed, setSuggestionSeed] = useState(0)

  const highlighted = dashboard?.highlightedStudent
  const aiSuggestions = useMemo(() => {
    const base = dashboard?.aiSuggestions ?? []
    if (base.length === 0) return []
    const rotated = [...base.slice(suggestionSeed % base.length), ...base.slice(0, suggestionSeed % base.length)]
    return rotated.slice(0, 4)
  }, [dashboard?.aiSuggestions, suggestionSeed])

  const myRating = dashboard?.averageRating ?? 0
  const sessionCount = dashboard?.sessionsCompleted ?? 0
  const rankLabel = dashboard?.mentorRankLabel ?? 'New Mentor'

  return (
    <div className="w-[250px] shrink-0 border-l border-[#1e1f2e] bg-[#0f1018] overflow-y-auto">
      {/* Incoming Requests */}
      <div className="p-4 border-b border-[#1e1f2e]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white">Incoming Requests</h3>
          <button onClick={() => onTab('session-requests')} className="text-[10px] text-violet-400 hover:text-white">View All</button>
        </div>
        {pending.length === 0 ? (
          <p className="text-[11px] text-[#5c5d72] text-center py-3">No pending requests</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((req) => (
              <li key={req.bookingId} className="flex items-start gap-2">
                <Av name={req.learnerName} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white truncate">{req.topic}</p>
                  <p className="text-[9px] text-[#5c5d72]">{req.learnerName} · {req.amountLabel}</p>
                  <p className="text-[9px] text-[#3d3e52]">{req.requestedAtLabel}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => confirmBooking(req.bookingId)}
                    className="text-[9px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded-md font-semibold transition-colors"
                  >Accept</button>
                  <button
                    onClick={() => cancelBooking(req.bookingId)}
                    className="text-[9px] bg-[#1c1d2a] hover:bg-[#2d2e3e] text-[#8b8ca8] hover:text-white px-2 py-1 rounded-md font-semibold transition-colors"
                  >Decline</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* AI Mentor Assistant */}
      <div className="p-4 border-b border-[#1e1f2e]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={12} className="text-violet-400" />
          <h3 className="text-xs font-bold text-white">AI Mentor Assistant</h3>
          <span className="text-[8px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded font-semibold border border-violet-500/20">BETA</span>
        </div>
        <p className="text-[10px] text-[#5c5d72] mb-3 italic">Suggested for your next session:</p>
        <ul className="space-y-2">
          {aiSuggestions.length === 0 ? (
            <li className="text-[11px] text-[#5c5d72]">Complete a session to unlock personalized suggestions.</li>
          ) : aiSuggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-violet-400 mt-0.5 shrink-0">•</span>
              <span className="text-[11px] text-[#a5a6bb] leading-snug">{s}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={() => setSuggestionSeed((n) => n + 1)}
          className="mt-3 flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
        >
          <RefreshCw size={10} /> Generate more suggestions
        </button>
      </div>

      {/* Student Progress */}
      <div className="p-4 border-b border-[#1e1f2e]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white">Student Progress</h3>
          <button onClick={() => onTab('my-students')} className="text-[10px] text-violet-400 hover:text-white">View All</button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Av name={highlighted?.name ?? 'Student'} size={28} />
          <div>
            <p className="text-[11px] font-semibold text-white">{highlighted?.name ?? 'No students yet'}</p>
            <p className="text-[9px] text-[#5c5d72]">
              {highlighted ? `${highlighted.overallProgressPct}% Progress` : 'Bookings populate student insights'}
            </p>
          </div>
        </div>
        <div className="space-y-2.5">
          {(highlighted?.topics ?? []).map((t, i) => (
            <ProgressBar key={t.topic} label={t.topic} value={t.progressPct} color={['#10b981','#818cf8','#06b6d4','#f59e0b'][i % 4]} />
          ))}
        </div>
        <button onClick={() => onTab('my-students')} className="mt-3 text-[10px] text-violet-400 hover:text-white transition-colors">View Detailed Progress →</button>
      </div>

      {/* Mentor Level */}
      <div className="p-4">
        <h3 className="text-xs font-bold text-white mb-3">Mentor Level</h3>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center"><Trophy size={18} className="text-amber-400" /></div>
          <div>
            <p className="text-xs font-bold text-white">{rankLabel}</p>
            <p className="text-[10px] text-[#5c5d72]">{sessionCount} sessions · {myRating.toFixed(1)}★</p>
          </div>
        </div>
        <ProgressBar value={Math.min(95, 40 + sessionCount * 8 + myRating * 5)} color="#f59e0b" />
        <p className="text-[10px] text-[#5c5d72] mt-2">Based on ratings, completion rate, and student retention.</p>
        <button onClick={() => onTab('insights')} className="mt-2 text-[10px] text-violet-400 hover:text-white transition-colors">View Performance Insights →</button>
      </div>
    </div>
  )
}

// ─── Dashboard View ────────────────────────────────────────────────────────────

function DashboardView({ profile, rooms, onTab }: {
  profile: ReturnType<typeof useGetMentorQuery>['data']
  rooms: ReturnType<typeof useListVideoRoomsQuery>['data']
  onTab: (t: Tab) => void
}) {
  const displayName = useAppSelector((s) => s.auth.account?.username ?? 'Mentor')
  const { data: dashboard, isLoading, refetch, isFetching } = useGetMentorDashboardQuery(undefined, {
    pollingInterval: 30_000,
  })

  const rating       = dashboard?.averageRating ?? profile?.averageRating ?? 0
  const sessionCount = dashboard?.sessionsCompleted ?? profile?.ratingCount ?? 0
  const earnings     = (dashboard?.totalEarningsCents ?? 0) / 100
  const activeStudents = dashboard?.activeStudents ?? 0
  const responseTime = dashboard?.responseTimeMinutes ?? 15
  const pendingCount = dashboard?.pendingBookingCount ?? 0
  const upcomingSessions = dashboard?.upcomingSessions ?? []

  const earningsSeries = useMemo(
    () => (dashboard?.earningsTrend ?? []).map((p) => Math.round(p.amountCents / 100)),
    [dashboard],
  )
  const sessionSeries = useMemo(
    () => (dashboard?.sessionsTrend ?? []).map((p) => p.amountCents),
    [dashboard?.sessionsTrend],
  )

  const liveRoom = (rooms ?? []).find((r) => r.status === 'LIVE')
  const topStudents = dashboard?.topStudents ?? []
  const todaySchedule = dashboard?.todaySchedule ?? []

  if (isLoading && !dashboard) return <Loading />

  return (
    <div className="flex flex-1 min-w-0 w-full h-full">
      <div className="flex-1 min-w-0 w-full overflow-y-auto px-6 py-5 space-y-5">
        {/* Welcome */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white">Welcome back, {displayName}! 👋</h1>
            <p className="text-xs text-[#8b8ca8] mt-0.5">Mentor, guide, and inspire the next generation of developers.</p>
          </div>
          <div className="flex items-center gap-2">
            {isFetching && <Loader2 size={14} className="animate-spin text-violet-400" />}
            <button onClick={() => refetch()} className="flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:bg-[#161722] transition-colors">
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
        </div>

        {/* Command center alerts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Pending Requests', value: pendingCount, color: 'amber', tab: 'session-requests' as Tab, icon: <Inbox size={14} /> },
            { label: 'Upcoming Sessions', value: upcomingSessions.length, color: 'blue', tab: 'bookings' as Tab, icon: <CalendarDays size={14} /> },
            { label: 'Active Students', value: activeStudents, color: 'cyan', tab: 'my-students' as Tab, icon: <Users size={14} /> },
            { label: 'Monthly Revenue', value: dashboard?.monthlyEarningsLabel ?? '$0.00', color: 'green', tab: 'earnings' as Tab, icon: <DollarSign size={14} /> },
          ].map((item) => (
            <button key={item.label} onClick={() => onTab(item.tab)}
              className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3.5 text-left hover:border-violet-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-[#8b8ca8]">{item.label}</p>
                <span className={`text-${item.color}-400`}>{item.icon}</span>
              </div>
              <p className="text-lg font-bold text-white">{item.value}</p>
            </button>
          ))}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Earnings',    value: dashboard?.totalEarningsLabel ?? `$${earnings.toFixed(2)}`, delta: dashboard?.earningsGrowthPct ?? 0, icon: <DollarSign size={14} />, color: '#10b981', sparkData: earningsSeries, tab: 'earnings' as Tab },
            { label: 'Sessions Completed',value: sessionCount,                       delta: dashboard?.sessionsGrowthPct ?? 0, icon: <Video size={14} />,      color: '#818cf8', sparkData: sessionSeries,  tab: 'session-analytics' as Tab },
            { label: 'Active Students',   value: activeStudents,                     delta: dashboard?.studentsGrowthPct ?? 0,  icon: <Users size={14} />,      color: '#06b6d4', sparkData: [],             tab: 'my-students' as Tab },
            { label: 'Average Rating',    value: `${rating.toFixed(1)}/5`,           delta: dashboard?.ratingGrowthPct ?? 0,  icon: <Star size={14} />,       color: '#f59e0b', sparkData: [],             tab: 'feedback' as Tab, showDelta: (dashboard?.ratingCount ?? 0) > 0 },
            { label: 'Response Time',     value: responseTime > 0 ? `${responseTime} min` : '—', delta: dashboard?.responseTimeGrowthPct ?? 0, icon: <Timer size={14} />, color: '#a78bfa', sparkData: [], tab: 'session-analytics' as Tab, showDelta: responseTime > 0 },
          ].map((s) => (
            <button key={s.label} onClick={() => onTab(s.tab)}
              className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-3.5 text-left hover:border-[#818cf8]/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-[#8b8ca8]">{s.label}</p>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <p className="text-xl font-bold text-white mb-1">{s.value}</p>
              {s.sparkData.length > 0 && <SparkLine values={s.sparkData} color={s.color} h={28} />}
              <div className="flex items-center gap-1 mt-1">
                {(s.showDelta ?? true) && <StatDelta pct={s.delta} inverse={s.label.includes('Time')} />}
                <span className="text-[9px] text-[#5c5d72]">{(s.showDelta ?? true) ? 'this month' : 'no data yet'}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Live session */}
        {liveRoom ? (
          <div className="bg-[#161722] border border-emerald-500/30 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2d2e3e] bg-emerald-600/10">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE
              </span>
              <span className="text-sm font-semibold text-white">Session in Progress</span>
              <button onClick={() => onTab('live-sessions')} className="ml-auto text-[10px] text-violet-400 hover:text-white">View All Sessions →</button>
            </div>
            <div className="p-5 flex items-start gap-4 flex-wrap">
              <div className="relative w-48 h-32 bg-[#0b0c14] rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                <Video size={28} className="text-[#2d2e3e]" />
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 px-1.5 py-0.5 rounded text-[9px] font-bold text-white">● LIVE 24:15</div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-bold text-white mb-3">{liveRoom.title}</p>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  {[['Topic','System Design Interview Prep'],['Focus Area','Low Level Design, Scalability'],['Goal','Crack SDE Interview'],['Participants',`${liveRoom.participantCount}/${liveRoom.maxParticipants}`]].map(([k,v]) => (
                    <div key={k}><p className="text-[10px] text-[#5c5d72]">{k}</p><p className="text-white font-medium">{v}</p></div>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {[{ icon: <Mic size={13} />, label: 'Mute' }, { icon: <Camera size={13} />, label: 'Camera' }, { icon: <Monitor size={13} />, label: 'Screen Share' }, { icon: <Edit3 size={13} />, label: 'Whiteboard' }, { icon: <Code2 size={13} />, label: 'Code Editor' }, { icon: <StopCircle size={13} className="text-red-400" />, label: 'End Session' }].map((b) => (
                    <button key={b.label} className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-[#1c1d2a] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:bg-[#2d2e3e] transition-colors">{b.icon}{b.label}</button>
                  ))}
                </div>
              </div>
              <div className="w-40 shrink-0 bg-[#12131c] rounded-xl p-3 border border-[#2d2e3e]">
                <p className="text-[10px] font-bold text-[#8b8ca8] mb-2">SESSION TOOLS</p>
                {[{ icon: <Code2 size={12} />, label: 'Open Code Editor' }, { icon: <Edit3 size={12} />, label: 'Whiteboard' }, { icon: <FileText size={12} />, label: 'Share Notes' }, { icon: <Timer size={12} />, label: 'Interview Timer' }, { icon: <FileText size={12} />, label: 'Feedback Form' }].map((t) => (
                  <button key={t.label} className="w-full flex items-center gap-2 py-2 text-[11px] text-[#8b8ca8] hover:text-white hover:bg-[#1c1d2a] rounded-lg px-1.5 transition-colors">
                    {t.icon}{t.label}<ChevronRight size={10} className="ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1c1d2a] flex items-center justify-center shrink-0"><Video size={22} className="text-[#3d3e52]" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">No Active Session</p>
              <p className="text-xs text-[#5c5d72]">Start a session or accept a request to begin mentoring.</p>
            </div>
            <button onClick={() => onTab('live-sessions')} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shrink-0">
              <Play size={13} /> Start Session
            </button>
          </div>
        )}

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Today's schedule */}
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-white">Today's Schedule</h3><button onClick={() => onTab('bookings')} className="text-[10px] text-violet-400 hover:text-white">View Calendar</button></div>
            <ul className="space-y-2.5">
              {todaySchedule.length === 0 ? (
                <li className="text-xs text-[#5c5d72] text-center py-4">No sessions scheduled for today</li>
              ) : todaySchedule.map((s) => (
                <li key={s.bookingId} className="flex items-center gap-2">
                  <span className="text-[10px] text-[#5c5d72] w-14 shrink-0">{s.timeLabel}</span>
                  <div className="flex-1 min-w-0 bg-[#1c1d2a] rounded-lg p-2">
                    <p className="text-[11px] font-semibold text-white truncate">{s.title}</p>
                    <p className="text-[9px] text-[#5c5d72]">{s.studentName}</p>
                  </div>
                  <Pill color={s.status === 'live' ? 'green' : 'gray'}>{s.status === 'live' ? 'Live Now' : 'Upcoming'}</Pill>
                </li>
              ))}
            </ul>
          </div>

          {/* Earnings overview */}
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-white">Earnings Overview</h3><button onClick={() => onTab('earnings')} className="text-[10px] text-violet-400 hover:text-white">This Month →</button></div>
            <p className="text-2xl font-bold text-white">{dashboard?.monthlyEarningsLabel ?? `$${earnings.toFixed(0)}`}</p>
            <div className="flex items-center gap-1.5 mb-4"><StatDelta pct={dashboard?.earningsGrowthPct ?? 0} /><span className="text-[10px] text-[#5c5d72]">vs last month</span></div>
            <LineChart series={[earningsSeries.length > 0 ? earningsSeries : [0]]} colors={['#10b981']} h={80} />
            <div className="flex justify-between mt-1">{(dashboard?.earningsTrend ?? []).map((p) => <span key={p.label} className="text-[9px] text-[#5c5d72]">{p.label}</span>)}</div>
          </div>

          {/* Top students */}
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-white">Top Performing Students</h3><button onClick={() => onTab('my-students')} className="text-[10px] text-violet-400 hover:text-white">View All</button></div>
            {topStudents.length === 0 ? <p className="text-xs text-[#5c5d72] text-center py-4">No student data yet</p> : (
              <ul className="space-y-2.5">
                {topStudents.map((s) => (
                  <li key={s.learnerId} className="flex items-center gap-2.5">
                    <Av name={s.name} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{s.name}</p>
                      <p className="text-[9px] text-[#5c5d72]">{s.sessions} Sessions</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.rating > 0 ? (
                        <>
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          <span className="text-[10px] text-white font-semibold">{s.rating.toFixed(1)}</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-[#5c5d72]">—</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 shrink-0">{s.progressPct}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Analytics snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Upcoming Sessions</h3>
              <button onClick={() => onTab('bookings')} className="text-[10px] text-violet-400 hover:text-white">Manage Bookings</button>
            </div>
            {upcomingSessions.length === 0 ? (
              <p className="text-xs text-[#5c5d72] text-center py-6">No upcoming sessions in the next 7 days</p>
            ) : (
              <ul className="space-y-2">
                {upcomingSessions.map((s) => (
                  <li key={s.bookingId} className="flex items-center gap-2 bg-[#1c1d2a] rounded-lg p-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0"><CalendarDays size={14} className="text-violet-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-white truncate">{s.title}</p>
                      <p className="text-[9px] text-[#5c5d72]">{s.timeLabel} · {s.studentName}</p>
                    </div>
                    <Pill color={s.status === 'live' ? 'green' : 'blue'}>{s.status === 'live' ? 'Live' : 'Scheduled'}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Performance Snapshot</h3>
              <button onClick={() => onTab('session-analytics')} className="text-[10px] text-violet-400 hover:text-white">Full Analytics</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Completion Rate', value: `${(dashboard?.completionRatePct ?? 0).toFixed(1)}%` },
                { label: 'Mentor Rank', value: dashboard?.mentorRankLabel ?? 'New Mentor' },
                { label: 'Rating Count', value: String(dashboard?.ratingCount ?? 0) },
                { label: 'Pending Payouts', value: dashboard?.monthlyEarningsLabel ?? '$0.00' },
              ].map((m) => (
                <div key={m.label} className="bg-[#1c1d2a] rounded-lg p-3">
                  <p className="text-[9px] text-[#5c5d72] mb-1">{m.label}</p>
                  <p className="text-sm font-bold text-white">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        {(sessionCount > 0 || pendingCount > 0) && (
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Mentorship Activity</h3>
              <button onClick={() => onTab('session-analytics')} className="text-[10px] text-violet-400 hover:text-white">View Analytics ›</button>
            </div>
            <p className="text-xs text-[#8b8ca8]">
              {pendingCount > 0 && `${pendingCount} booking request${pendingCount === 1 ? '' : 's'} awaiting your response. `}
              {sessionCount > 0 && `You have completed ${sessionCount} session${sessionCount === 1 ? '' : 's'} with ${activeStudents} active student${activeStudents === 1 ? '' : 's'}.`}
              {dashboard?.completionRatePct ? ` Completion rate: ${dashboard.completionRatePct.toFixed(1)}%.` : ''}
            </p>
          </div>
        )}
      </div>

      <MentorRightPanel dashboard={dashboard} onTab={onTab} />
    </div>
  )
}

// ─── Live Sessions ────────────────────────────────────────────────────────────

function LiveSessionsView({ onGoLive }: { onGoLive: () => void }) {
  return (
    <SectionWrap title="Live Sessions" sub="Connect with learners via real-time video sessions">
      <LiveSessionWorkspace onGoLive={onGoLive} />
    </SectionWrap>
  )
}

// ─── Session Requests ─────────────────────────────────────────────────────────

function SessionRequestsView() {
  const { data: requests = [] } = useGetMentorSessionRequestsQuery(undefined, { pollingInterval: 30_000 })

  return (
    <SectionWrap
      title="Session Requests"
      sub={`${requests.length} pending request${requests.length === 1 ? '' : 's'} · career guidance, code reviews & more`}
    >
      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-bold text-white mb-3">Mock interview requests</h3>
          <MockInterviewRequestsPanel />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white mb-3">Other session requests</h3>
          <SessionRequestsPanel />
        </div>
      </div>
    </SectionWrap>
  )
}

function MentorshipRequestsView() {
  const { data: countData } = useGetMentorMentorshipRequestCountQuery(undefined, { pollingInterval: 15_000 })
  const pending = countData?.pending ?? 0

  return (
    <SectionWrap
      title="Mentorship Requests"
      sub={`${pending} pending request${pending === 1 ? '' : 's'} · accept to add learners to My Students`}
    >
      <MentorshipRequestsPanel />
    </SectionWrap>
  )
}

// ─── Video Rooms ───────────────────────────────────────────────────────────────

function VideoRoomsView() {
  return (
    <SectionWrap title="Video Rooms" sub="Manage live discussion rooms · workshops, study groups & community">
      <MentorVideoRoomsPanel />
    </SectionWrap>
  )
}

// ─── Pair Programming ─────────────────────────────────────────────────────────

function PairProgrammingView() {
  return (
    <SectionWrap title="Pair Programming" sub="Accept incoming session requests and collaborate with your students">
      <div className="space-y-6">
        <IncomingPairRequests />
        <MentorCreateChallengePanel />
      </div>
    </SectionWrap>
  )
}

// ─── My Students ──────────────────────────────────────────────────────────────

function MyStudentsView() {
  return (
    <SectionWrap title="My Students" sub="Manage mentees · track progress, tasks, and interview readiness">
      <MentorStudentsPanel />
    </SectionWrap>
  )
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

function BookingsView() {
  return (
    <SectionWrap title="Bookings" sub="Manage scheduled sessions · calendar, reminders & recurring plans">
      <MentorBookingsPanel />
    </SectionWrap>
  )
}

// ─── Availability Schedule ────────────────────────────────────────────────────

function AvailabilityView() {
  return (
    <SectionWrap title="Availability Schedule" sub="Set when you are available for mentorship sessions">
      <MentorAvailabilityPanel />
    </SectionWrap>
  )
}

// ─── Mentorship Plans ─────────────────────────────────────────────────────────

function MentorshipPlansView() {
  return (
    <SectionWrap title="Mentorship Plans" sub="Create and manage your paid mentorship packages">
      <MentorMentorshipPlansPanel />
    </SectionWrap>
  )
}

// ─── Feedback & Reviews ────────────────────────────────────────────────────────

function FeedbackView() {
  const { data } = useGetMentorReviewsSummaryQuery()
  const sub = data
    ? `${data.totalReviews} total reviews · ${data.averageRating.toFixed(1)} average rating`
    : 'Track learner feedback, ratings, and testimonials'

  return (
    <SectionWrap title="Feedback & Reviews" sub={sub}>
      <MentorFeedbackPanel />
    </SectionWrap>
  )
}

// ─── Community Rooms ──────────────────────────────────────────────────────────

function CommunityRoomsView() {
  return (
    <SectionWrap title="Community Rooms" sub="Participate in and host community learning spaces">
      <MentorCommunityRoomsPanel />
    </SectionWrap>
  )
}

// ─── Host Webinar ──────────────────────────────────────────────────────────────

function HostWebinarView() {
  const [createEvent] = useCreateEventMutation()
  const [form, setForm] = useState({ title: '', description: '', topic: 'System Design', maxParticipants: 50, type: 'free', startsAt: '', durationHours: 1 })
  const [created, setCreated] = useState(false)
  const [error, setError] = useState('')

  async function create() {
    if (!form.title.trim()) return
    setError('')
    const start = form.startsAt ? new Date(form.startsAt) : new Date(Date.now() + 3600000)
    const end = new Date(start.getTime() + form.durationHours * 3600000)
    try {
      await createEvent({
        title: form.title.trim(),
        description: form.description.trim() || `Live webinar on ${form.topic}`,
        eventType: 'Webinar',
        category: form.topic,
        format: form.type === 'paid' ? 'Paid' : 'Online',
        locationOrLink: 'DevConnect Live Room',
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        maxAttendees: form.maxParticipants,
        tags: [form.topic, 'webinar', form.type],
      }).unwrap()
      setCreated(true)
      setForm({ title: '', description: '', topic: 'System Design', maxParticipants: 50, type: 'free', startsAt: '', durationHours: 1 })
      setTimeout(() => setCreated(false), 4000)
    } catch {
      setError('Could not create webinar. Please try again.')
    }
  }
  return (
    <SectionWrap title="Host Webinar" sub="Conduct large-scale live teaching sessions for the community">
      {created && <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-400" /><p className="text-xs text-emerald-400 font-semibold">Webinar published! Learners can discover and register from Events.</p></div>}
      {error && <div className="bg-red-600/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2"><AlertTriangle size={15} className="text-red-400" /><p className="text-xs text-red-400 font-semibold">{error}</p></div>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Create Webinar</h3>
          {[{ label: 'Webinar Title', key: 'title' as keyof typeof form, placeholder: 'e.g. Crack FAANG Interviews in 2024' }, { label: 'Description', key: 'description' as keyof typeof form, placeholder: 'What will students learn?' }].map((f) => (
            <div key={f.key}><label className="block text-[10px] text-[#5c5d72] mb-1">{f.label}</label><input value={form[f.key] as string} onChange={(e) => setForm(x => ({ ...x, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#818cf8]" /></div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] text-[#5c5d72] mb-1">Topic</label><select value={form.topic} onChange={(e) => setForm(f => ({ ...f, topic: e.target.value }))} className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#818cf8]"><option>System Design</option><option>DSA</option><option>React</option><option>Career</option><option>Spring Boot</option></select></div>
            <div><label className="block text-[10px] text-[#5c5d72] mb-1">Type</label><select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#818cf8]"><option value="free">Free</option><option value="paid">Paid</option><option value="subscription">Subscribers Only</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] text-[#5c5d72] mb-1">Start Time</label><input type="datetime-local" value={form.startsAt} onChange={(e) => setForm(f => ({ ...f, startsAt: e.target.value }))} className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#818cf8]" /></div>
            <div><label className="block text-[10px] text-[#5c5d72] mb-1">Duration (hours)</label><input type="number" min={1} max={4} value={form.durationHours} onChange={(e) => setForm(f => ({ ...f, durationHours: parseInt(e.target.value, 10) || 1 }))} className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#818cf8]" /></div>
          </div>
          <div><label className="block text-[10px] text-[#5c5d72] mb-1">Max Attendees</label><input type="number" value={form.maxParticipants} onChange={(e) => setForm(f => ({ ...f, maxParticipants: parseInt(e.target.value)||50 }))} className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#818cf8]" /></div>
          <button onClick={create} className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"><Radio size={14} />Publish Webinar</button>
        </div>
        <div className="space-y-4">
          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Webinar Features</h3>
            <ul className="space-y-3">
              {[{ icon: <Radio size={14} className="text-violet-400" />, l: 'Live Streaming', s: 'Up to 500 concurrent viewers' }, { icon: <MessageCircle size={14} className="text-blue-400" />, l: 'Audience Chat', s: 'Real-time Q&A interaction' }, { icon: <Monitor size={14} className="text-emerald-400" />, l: 'Screen Sharing', s: 'Share presentations and demos' }, { icon: <BarChart3 size={14} className="text-amber-400" />, l: 'Attendee Analytics', s: 'Track engagement and drop-off' }, { icon: <DollarSign size={14} className="text-emerald-400" />, l: 'Monetization', s: 'Free, paid, or subscriber-only' }].map((f) => (
                <li key={f.l} className="flex items-start gap-3">{f.icon}<div><p className="text-xs font-semibold text-white">{f.l}</p><p className="text-[10px] text-[#5c5d72]">{f.s}</p></div></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SectionWrap>
  )
}

// ─── Learning Resources ────────────────────────────────────────────────────────

const RESOURCES_DATA = [
  { type: 'Roadmap', title: 'Full Stack Developer Roadmap 2024', desc: 'Complete path from HTML to cloud deployment', tags: ['fullstack','beginner'] },
  { type: 'Article', title: 'System Design Fundamentals', desc: 'Scalability, CAP theorem, load balancing deep dive', tags: ['system-design','intermediate'] },
  { type: 'Video',   title: 'DSA Masterclass - NeetCode', desc: '150 must-know problems with video explanations', tags: ['dsa','leetcode'] },
  { type: 'PDF',     title: 'Java Spring Boot Interview Guide', desc: '200+ interview questions with answers', tags: ['java','spring-boot','interview'] },
  { type: 'Roadmap', title: 'React Developer Roadmap', desc: 'From basics to advanced patterns and testing', tags: ['react','frontend'] },
  { type: 'Article', title: 'Microservices Design Patterns', desc: 'Saga, CQRS, Event Sourcing explained', tags: ['microservices','architecture'] },
]
const TYPE_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  Roadmap: { icon: <Target size={16} />, color: '#818cf8' },
  Article: { icon: <FileText size={16} />, color: '#10b981' },
  Video:   { icon: <Video size={16} />,   color: '#ef4444' },
  PDF:     { icon: <BookOpen size={16} />, color: '#f59e0b' },
}

function LearningResourcesView() {
  const [saved, setSaved] = useState<Set<number>>(new Set())
  return (
    <SectionWrap title="Learning Resources" sub="Curated educational content to share with your students">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full auto-rows-fr">
        {RESOURCES_DATA.map((r, i) => {
          const cfg = TYPE_ICON[r.type] ?? { icon: <BookOpen size={16} />, color: '#818cf8' }
          return (
            <div key={i} className="h-full bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 hover:border-[#3d3e52] transition-colors">
              <div className="flex h-full items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cfg.color}20`, color: cfg.color }}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><Pill color="gray">{r.type}</Pill></div>
                  <p className="text-sm font-semibold text-white mb-1">{r.title}</p>
                  <p className="text-xs text-[#8b8ca8] mb-2">{r.desc}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {r.tags.map(t=><span key={t} className="text-[9px] bg-[#2d2e3e] text-[#8b8ca8] px-1.5 py-0.5 rounded">#{t}</span>)}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => setSaved(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${saved.has(i)?'text-amber-400 bg-amber-500/15':'text-[#5c5d72] hover:text-amber-400 hover:bg-[#2d2e3e]'}`}><Bookmark size={13} /></button>
                  <button className="w-7 h-7 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-violet-400 hover:bg-[#2d2e3e] transition-colors"><Send size={13} /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </SectionWrap>
  )
}

// ─── Global call overlay (reads from WebRTCContext) ───────────────────────────

function GlobalCallOverlay({ onTabChange }: { onTabChange: (t: Tab) => void }) {
  const { incomingCall, acceptCall, rejectCall, callState, startPreview } = useWebRTCContext()
  const { session, acceptMatch, rejectMatch } = useMatchFlow()

  useEffect(() => {
    if (callState === 'in_call' || session.status === 'matched') onTabChange('live-sessions')
  }, [callState, session.status, onTabChange])

  if (session.status === 'pending_request' && session.partner) {
    return (
      <IncomingMatchRequestDialog
        fromName={session.partner.displayName}
        criteria={session.criteria}
        onAccept={() => {
          startPreview()
          void acceptMatch()
          onTabChange('live-sessions')
        }}
        onReject={() => void rejectMatch()}
      />
    )
  }

  if (!incomingCall) return null
  return (
    <IncomingCallDialog
      call={incomingCall}
      onAccept={() => {
        startPreview()
        acceptCall()
        onTabChange('live-sessions')
      }}
      onReject={rejectCall}
    />
  )
}

// ─── Root MentorDashboardPage ─────────────────────────────────────────────────

export function MentorDashboardPage() {
  const account  = useAppSelector((s) => s.auth.account)
  const userId   = account?.id ?? ''
  const [tab, setTab] = useState<Tab>('dashboard')

  const { data: application } = useGetMyApplicationQuery()
  const { data: profile }     = useGetMentorQuery(userId, { skip: !userId })
  const { data: dashboard }   = useGetMentorDashboardQuery(undefined, { pollingInterval: 30_000 })
  const { data: rooms }       = useListVideoRoomsQuery({ status: 'live', limit: 50 })
  const { startMatchAsMentor } = useMatchFlow()
  const { data: myProfile }   = useGetMyProfileQuery()

  void application

  const displayName  = account?.username ?? 'Mentor'
  const myName       = myProfile?.displayName ?? displayName
  const rating       = dashboard?.averageRating ?? profile?.averageRating ?? 0
  const reviewCount  = dashboard?.ratingCount ?? profile?.ratingCount ?? 0
  const sessionCount = dashboard?.sessionsCompleted ?? profile?.ratingCount ?? 0
  const earnings     = (dashboard?.totalEarningsCents ?? 0) / 100
  const pendingCount = dashboard?.pendingBookingCount ?? 0
  const { data: mentorshipCountData } = useGetMentorMentorshipRequestCountQuery(undefined, { pollingInterval: 15_000 })
  const mentorshipPendingCount = mentorshipCountData?.pending ?? 0

  async function handleGoLive() {
    const skills = myProfile?.skills ?? []
    await startMatchAsMentor(
      'Mentor session — connect me with a learner',
      skills,
      myProfile?.experienceLevel ?? undefined,
    )
    setTab('live-sessions')
  }

  useLiveMatchEvents(userId || undefined)

  return (
    // WebRTCProvider owns the single RTCPeerConnection for this page.
    // GlobalCallOverlay + VideoCallSection both consume the same context.
    <WebRTCProvider userId={userId || undefined} name={myName}>
      <div className="flex h-screen bg-[#0b0c14] text-white overflow-hidden">
        {/* Incoming call overlay — visible on any tab */}
        <GlobalCallOverlay onTabChange={setTab} />
        <MentorSidebar
          active={tab}
          onChange={setTab}
          sessionRequestCount={pendingCount}
          mentorshipRequestCount={mentorshipPendingCount}
          displayName={displayName}
          rating={rating}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MentorTopNav
            displayName={displayName}
            earnings={earnings}
            earningsLabel={dashboard?.totalEarningsLabel}
            rating={rating}
            reviewCount={reviewCount}
            rankLabel={dashboard?.mentorRankLabel ?? 'New Mentor'}
            onGoLive={handleGoLive}
          />
          <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
            {tab === 'dashboard'        && <DashboardView profile={profile} rooms={rooms} onTab={setTab} />}
            {tab === 'live-sessions'    && <LiveSessionsView onGoLive={handleGoLive} />}
            {tab === 'session-requests' && <SessionRequestsView />}
            {tab === 'mentorship-requests' && <MentorshipRequestsView />}
            {tab === 'video-rooms'      && <VideoRoomsView />}
            {tab === 'pair-programming' && <PairProgrammingView />}
            {tab === 'my-students'      && <MyStudentsView />}
            {tab === 'bookings'         && <BookingsView />}
            {tab === 'availability'     && <AvailabilityView />}
            {tab === 'plans'            && <MentorshipPlansView />}
            {tab === 'feedback'         && <FeedbackView />}
            {tab === 'community-rooms'  && <CommunityRoomsView />}
            {tab === 'host-webinar'     && <HostWebinarView />}
            {tab === 'discussions'      && <MentorDiscussionsPanel />}
            {tab === 'events'           && <MentorEventsPanel />}
            {tab === 'earnings'         && <MentorEarningsPanel />}
            {tab === 'marketplace-pricing' && <MentorPricingPanel />}
            {tab === 'session-analytics'&& <MentorSessionAnalyticsPanel />}
            {tab === 'insights'         && <MentorPerformanceInsightsPanel onNavigate={setTab} />}
            {tab === 'leaderboard'      && <MentorLeaderboardPanel />}
            {tab === 'shared-notes'     && <MentorSharedNotesPanel />}
            {tab === 'question-bank'    && <MentorInterviewQuestionBankPanel />}
            {tab === 'interview-packs'  && <MentorInterviewPacksPanel />}
            {tab === 'resources'        && <TutorialBuilderPanel mode="mentor" />}
            {tab === 'learning-streams' && <VideoCourseBuilderPanel mode="mentor" />}
          </main>
        </div>
      </div>
    </WebRTCProvider>
  )
}

export default MentorDashboardPage
