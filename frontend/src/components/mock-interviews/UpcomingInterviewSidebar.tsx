import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  BookOpen,
  Calendar,
  FileText,
  Layers,
  Loader2,
  MessageSquare,
  Star,
  Video,
  XCircle,
} from 'lucide-react'
import {
  useCancelMockInterviewRequestMutation,
  useGetUpcomingMockInterviewQuery,
  useListMyMockInterviewRequestsQuery,
} from '../../api/mockInterviewApi'
import { avatarUrl } from '../../lib/avatar'
import { formatEventDateTime } from '../../lib/formatTime'

const LEARNING_RESOURCES = [
  { label: 'DSA Patterns Cheat Sheet', icon: BookOpen, href: '/resources' },
  { label: 'System Design Roadmap', icon: Layers, href: '/resources' },
  { label: 'Behavioral STAR Guide', icon: MessageSquare, href: '/resources' },
  { label: 'Top 100 Company Questions', icon: FileText, href: '/resources' },
  { label: 'Resume Templates', icon: FileText, href: '/resources' },
]

function statusBadgeClass(status: string): string {
  const s = status?.toUpperCase() ?? ''
  if (s === 'ACCEPTED' || s === 'CONFIRMED') {
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  }
  if (s === 'PENDING') {
    return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  }
  return 'bg-[#6366f1]/15 text-[#a5b4fc] border-[#6366f1]/30'
}

interface UpcomingInterviewSidebarProps {
  onReschedule?: (interviewerId: string) => void
}

export function UpcomingInterviewSidebar({ onReschedule }: UpcomingInterviewSidebarProps) {
  const { data: upcoming, isLoading: loadingUpcoming } = useGetUpcomingMockInterviewQuery(undefined, {
    pollingInterval: 30_000,
  })
  const { data: myRequests = [], isLoading: loadingRequests } = useListMyMockInterviewRequestsQuery('ACCEPTED', {
    pollingInterval: 30_000,
  })
  const [cancelRequest, { isLoading: cancelling }] = useCancelMockInterviewRequestMutation()

  const nextThree = myRequests
    .filter((r) => r.scheduledAt && new Date(r.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 3)

  function handleCancel() {
    if (!upcoming) return
    if (!window.confirm('Cancel this scheduled interview? Refunds depend on mentor policy.')) return
    void cancelRequest({ requestId: upcoming.requestId })
  }

  if (loadingUpcoming) {
    return (
      <aside className="rounded-xl bg-[#161722]/90 border border-[#2d2e3e] p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm text-[#8b8ca8]">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      </aside>
    )
  }

  return (
    <aside className="space-y-4 w-full">
      {/* Upcoming Interview */}
      <div className="rounded-xl bg-[#161722]/90 border border-[#2d2e3e] p-4 backdrop-blur-sm shadow-lg shadow-black/10">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-[#818cf8]" />
          Upcoming Interview
        </h3>

        {!upcoming ? (
          <p className="text-xs text-[#8b8ca8] leading-relaxed">
            No scheduled mock interviews. Book an interviewer from the marketplace.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3">
              <img
                src={upcoming.interviewerPicture ?? avatarUrl(upcoming.interviewerName, 52)}
                alt=""
                className="w-[52px] h-[52px] rounded-full shrink-0 border-2 border-[#6366f1]/30 object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-white text-sm truncate">{upcoming.interviewerName}</p>
                  <BadgeCheck size={13} className="text-[#818cf8] shrink-0" />
                </div>
                <p className="text-xs text-[#818cf8] mt-0.5">{upcoming.interviewType}</p>
                <p className="text-[10px] text-[#8b8ca8] mt-1">{formatEventDateTime(upcoming.scheduledAt)}</p>
                <span
                  className={`inline-block mt-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusBadgeClass(upcoming.status)}`}
                >
                  {upcoming.status === 'ACCEPTED' ? 'Confirmed' : upcoming.status}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {upcoming.canJoin && upcoming.sessionCode ? (
                <Link
                  to={`/interview-room/${upcoming.requestId}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg dc-gradient-btn text-white text-xs font-semibold"
                >
                  <Video size={14} /> Join Interview
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title={upcoming.joinMessage}
                  className="w-full py-2.5 rounded-lg bg-[#2d2e3e]/40 text-[#5c5d72] text-xs font-semibold cursor-not-allowed"
                >
                  Join Interview
                </button>
              )}
              {!upcoming.canJoin && upcoming.joinMessage && (
                <p className="text-[10px] text-[#8b8ca8] text-center">{upcoming.joinMessage}</p>
              )}
              <button
                type="button"
                onClick={() => onReschedule?.(upcoming.interviewerId)}
                className="w-full py-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] text-xs font-semibold hover:text-white hover:border-[#5c5d72] transition-colors"
              >
                Reschedule
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="w-full py-1.5 text-red-400/90 text-[10px] font-semibold hover:text-red-300 disabled:opacity-50 inline-flex items-center justify-center gap-1"
              >
                <XCircle size={12} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* My Next 3 Interviews */}
      <div className="rounded-xl bg-[#161722]/90 border border-[#2d2e3e] p-4 backdrop-blur-sm">
        <h4 className="text-xs font-bold uppercase tracking-wide text-[#8b8ca8] mb-3">My Next 3 Interviews</h4>
        {loadingRequests ? (
          <div className="flex items-center gap-2 text-xs text-[#8b8ca8]">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : nextThree.length === 0 ? (
          <p className="text-xs text-[#5c5d72]">No upcoming bookings yet.</p>
        ) : (
          <ul className="space-y-3">
            {nextThree.map((req) => (
              <li key={req.id} className="flex gap-2.5 items-start">
                <img
                  src={req.interviewerPicture ?? avatarUrl(req.interviewerName, 36)}
                  alt=""
                  className="w-9 h-9 rounded-full shrink-0 border border-[#2d2e3e] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{req.interviewerName}</p>
                  <p className="text-[10px] text-[#818cf8]">{req.interviewType}</p>
                  <p className="text-[10px] text-[#8b8ca8]">
                    {req.scheduledAt ? formatEventDateTime(req.scheduledAt) : '—'}
                  </p>
                  <span
                    className={`inline-block mt-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${statusBadgeClass(req.status)}`}
                  >
                    {req.status === 'ACCEPTED' ? 'Confirmed' : req.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Learning Resources */}
      <div className="rounded-xl bg-[#161722]/90 border border-[#2d2e3e] p-4 backdrop-blur-sm">
        <h4 className="text-xs font-bold uppercase tracking-wide text-[#8b8ca8] mb-3">Learning Resources</h4>
        <ul className="space-y-2">
          {LEARNING_RESOURCES.map(({ label, icon: Icon, href }) => (
            <li key={label}>
              <Link
                to={href}
                className="flex items-center gap-2.5 text-xs text-[#b4b5c8] hover:text-white transition-colors group"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#6366f1]/10 border border-[#6366f1]/20 group-hover:border-[#6366f1]/40">
                  <Icon size={13} className="text-[#818cf8]" />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent Feedback */}
      <div className="rounded-xl bg-[#161722]/90 border border-[#2d2e3e] p-4 backdrop-blur-sm">
        <h4 className="text-xs font-bold uppercase tracking-wide text-[#8b8ca8] mb-3 flex items-center gap-1.5">
          <MessageSquare size={12} className="text-[#818cf8]" /> Recent Feedback
        </h4>
        <div className="rounded-lg bg-[#0b0c14]/60 border border-[#2d2e3e] p-3">
          <div className="flex gap-3">
            <img
              src={avatarUrl('Vishal Gupta', 40)}
              alt=""
              className="w-10 h-10 rounded-full shrink-0 border border-[#6366f1]/30 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-white">Vishal Gupta</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-[#8b8ca8] leading-relaxed">
                Great mock session — actionable feedback on system design trade-offs and communication.
              </p>
              <p className="text-[10px] text-[#5c5d72] mt-1.5">— Aman Singh</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
