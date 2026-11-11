import { CheckCircle2, Loader2, Star, XCircle } from 'lucide-react'
import {
  useAcceptMockInterviewRequestMutation,
  useListIncomingMockInterviewRequestsQuery,
  useRejectMockInterviewRequestMutation,
} from '../../api/mockInterviewApi'
import { avatarUrl } from '../../lib/avatar'
import { formatRelativeTime } from '../../lib/formatTime'

export function MockInterviewRequestsPanel() {
  const { data: requests = [], isLoading, refetch } = useListIncomingMockInterviewRequestsQuery(undefined, {
    pollingInterval: 10_000,
  })
  const [accept, { isLoading: accepting }] = useAcceptMockInterviewRequestMutation()
  const [reject, { isLoading: rejecting }] = useRejectMockInterviewRequestMutation()

  async function handleAccept(requestId: string) {
    await accept({ requestId }).unwrap()
    void refetch()
  }

  async function handleReject(requestId: string) {
    if (!window.confirm('Decline this mock interview request?')) return
    await reject({ requestId }).unwrap()
    void refetch()
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#8b8ca8] py-4">
        <Loader2 size={16} className="animate-spin" /> Loading mock interview requests…
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-6 text-center">
        <Star className="w-8 h-8 text-[#5c5d72] mx-auto mb-2" />
        <p className="text-sm text-[#8b8ca8]">No incoming mock interview requests.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div
          key={req.id}
          className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4 flex flex-col lg:flex-row lg:items-center gap-4"
        >
          <img
            src={avatarUrl(req.learnerName, 44)}
            alt=""
            className="w-11 h-11 rounded-full shrink-0 border border-[#2d2e3e] hidden sm:block"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">{req.learnerName}</p>
            <p className="text-xs text-[#8b8ca8] mt-1">
              <span className="text-white">{req.interviewType}</span> · {req.difficulty}
            </p>
            <p className="text-xs text-[#8b8ca8]">
              Focus: <span className="text-white">{req.focusTopic}</span>
            </p>
            {req.message && (
              <p className="text-xs text-[#5c5d72] mt-1 italic line-clamp-2">&ldquo;{req.message}&rdquo;</p>
            )}
            <p className="text-[10px] text-[#5c5d72] mt-1">{formatRelativeTime(req.createdAt)}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              disabled={accepting || rejecting}
              onClick={() => void handleAccept(req.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> Accept
            </button>
            <button
              type="button"
              disabled={accepting || rejecting}
              onClick={() => void handleReject(req.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 text-xs font-semibold disabled:opacity-50"
            >
              <XCircle size={14} /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
