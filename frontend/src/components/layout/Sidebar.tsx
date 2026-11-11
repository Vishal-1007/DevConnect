import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Video, GraduationCap, Code2, Mic, FileCode2,
  Rss, MessageSquare, Calendar, Trophy, BookOpen, Map, Target, Sparkles,
  Moon, Sun, CreditCard, Radio,
  Briefcase, ShoppingBag, Send,
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useListMyMentorshipRequestsQuery } from '../../api/mentorshipApi'

type NavItem = { to: string; label: string; icon: React.ReactNode; badge?: string; countKey?: string }

const mainNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/find-match', label: 'Find Match', icon: <Users size={18} /> },
  { to: '/video-rooms', label: 'Video Rooms', icon: <Video size={18} /> },
  { to: '/mentors', label: 'Mentorship', icon: <GraduationCap size={18} /> },
  { to: '/my-mentorship-requests', label: 'My Mentorship Requests', icon: <Send size={18} />, countKey: 'mentorshipPending' },
  { to: '/jobs', label: 'Jobs', icon: <Briefcase size={18} />, badge: 'New' },
  { to: '/pair-programming', label: 'Pair Programming', icon: <Code2 size={18} /> },
  { to: '/mock-interviews', label: 'Mock Interviews', icon: <Mic size={18} /> },
  { to: '/code-review', label: 'Code Review', icon: <FileCode2 size={18} /> },
]

const communityNav: NavItem[] = [
  { to: '/community', label: 'Community Feed', icon: <Rss size={18} /> },
  { to: '/discussions', label: 'Discussions', icon: <MessageSquare size={18} /> },
  { to: '/events', label: 'Events', icon: <Calendar size={18} /> },
  { to: '/leaderboard', label: 'Leaderboard', icon: <Trophy size={18} /> },
]

const resourcesNav: NavItem[] = [
  { to: '/billing', label: 'Billing', icon: <CreditCard size={18} /> },
  { to: '/resources', label: 'Learning Resources', icon: <BookOpen size={18} /> },
  { to: '/learning-streams', label: 'Learning Streams', icon: <Radio size={18} /> },
  { to: '/roadmaps', label: 'Roadmaps', icon: <Map size={18} /> },
  { to: '/challenges', label: 'Challenges', icon: <Target size={18} /> },
  { to: '/interview-marketplace', label: 'Interview Marketplace', icon: <Briefcase size={18} /> },
  { to: '/my-interview-purchases', label: 'My Purchases', icon: <ShoppingBag size={18} /> },
]

function NavSection({ title, items, counts }: { title: string; items: NavItem[]; counts?: Record<string, number> }) {
  return (
    <div className="mb-6">
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#5c5d72]">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const count = item.countKey ? counts?.[item.countKey] : undefined
          return (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#6366f1]/20 text-white border-l-2 border-[#6366f1] -ml-px pl-[11px]'
                    : 'text-[#8b8ca8] hover:text-white hover:bg-[#1c1d2a]'
                }`
              }
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {count != null && count > 0 ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black min-w-[18px] text-center">
                  {count}
                </span>
              ) : item.badge ? (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#3b82f6] text-white">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Sidebar() {
  const { isDark, toggleTheme } = useTheme()
  const { data: myRequests = [] } = useListMyMentorshipRequestsQuery(undefined, { pollingInterval: 30_000 })
  const mentorshipPending = myRequests.filter((r) => r.status === 'PENDING').length
  return (
    <aside className="w-[240px] shrink-0 flex flex-col h-screen bg-[#12131c] border-r border-[#2d2e3e]">
      <div className="px-5 py-5 border-b border-[#2d2e3e]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg dc-gradient-btn flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">DevConnect</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavSection title="Main" items={mainNav} counts={{ mentorshipPending }} />
        <NavSection title="Community" items={communityNav} />
        <NavSection title="Resources" items={resourcesNav} />
      </nav>

      <div className="p-3 space-y-3 border-t border-[#2d2e3e]">
        <div className="dc-gradient-pro rounded-xl p-4 text-white">
          <p className="font-semibold text-sm">Upgrade to Pro</p>
          <p className="text-xs text-white/80 mt-1 leading-relaxed">
            Unlimited mentorship & priority matching
          </p>
          <NavLink
            to="/billing"
            className="mt-3 w-full py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-semibold transition-colors block text-center"
          >
            Upgrade Now
          </NavLink>
        </div>

        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-[#8b8ca8]">
            {isDark ? <Moon size={16} /> : <Sun size={16} className="text-amber-400" />}
            <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={toggleTheme}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
              isDark ? 'bg-[#6366f1]' : 'bg-amber-400'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                isDark ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </aside>
  )
}
