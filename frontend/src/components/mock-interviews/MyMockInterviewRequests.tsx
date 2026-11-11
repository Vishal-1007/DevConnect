import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Video, XCircle } from 'lucide-react'
import {
  useCancelMockInterviewRequestMutation,
  useGetMockInterviewSessionQuery,
  useListMyMockInterviewRequestsQuery,
} from '../../api/mockInterviewApi'
import { avatarUrl } from '../../lib/avatar'
import { formatEventDateTime } from '../../lib/formatTime'

const STATUS_TABS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'] as const

function FeedbackLink({ sessionCode }: { sessionCode: string }) {
  const { data: session, isLoading } = useGetMockInterviewSessionQuery(sessionCode)
  if (isLoading) return <span className="text-xs text-[#8b8ca8]">Loading…</span>
  if (!session) return null
  return (
    <Link
      to={`/mock-interviews/feedback/${session.id}`}
      className="px-3 py-1.5 rounded-lg border border-[#6366f1]/40 text-[#a5b4fc] text-xs font-semibold hover:bg-[#6366f1]/10"
    >
      View Feedback
    </Link>
  )
}

function statusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'text-amber-400 bg-amber-500/15 border-amber-500/30'
    case 'ACCEPTED':
      return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
    case 'REJECTED':
      return 'text-red-400 bg-red-500/15 border-red-500/30'
    case 'COMPLETED':
      return 'text-[#818cf8] bg-[#6366f1]/15 border-[#6366f1]/30'
    default:
      return 'text-[#8b8ca8] bg-[#2d2e3e]/50 border-[#2d2e3e]'
  }
}

function paymentStatusColor(status: string | null): string {
  if (!status) return 'text-[#8b8ca8]'
  switch (status.toUpperCase()) {
    case 'PAID':
    case 'SUCCESS':
      return 'text-emerald-400'
    case 'PENDING':
      return 'text-amber-400'
    case 'FAILED':
    case 'REFUNDED':
      return 'text-red-400'
    default:
      return 'text-[#8b8ca8]'
  }
}

function formatAmount(cents: number | null): string {
  if (cents == null || cents <= 0) return '—'
  return `₹${(cents / 100).toLocaleString('en-IN')}`
}

export function MyMockInterviewRequests() {
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>('ALL')
  const { data: requests = [], isLoading, refetch } = useListMyMockInterviewRequestsQuery(
    tab === 'ALL' ? undefined : tab,
    { pollingInterval: 15_000 }
  )

  const [cancelRequest, { isLoading: cancelling }] = useCancelMockInterviewRequestMutation()

  const sorted = useMemo(
    () => [...requests].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [requests]
  )

  function handleCancel(requestId: string) {
    if (!window.confirm('Cancel this booking?')) return
    void cancelRequest({ requestId }).unwrap().then(() => refetch())
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setTab(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              tab === status
                ? 'bg-violet-600 text-white'
                : 'bg-[#161722] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-[#8b8ca8] py-6">
          <Loader2 size={18} className="animate-spin" /> Loading bookings…
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-8 text-center">
          <p className="text-sm text-[#8b8ca8]">
            No {tab === 'ALL' ? '' : `${tab.toLowerCase()} `}bookings yet.
          </p>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead>
              <tr className="border-b border-[#2d2e3e] text-[#5c5d72] uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Mentor</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Date & time</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((req) => (
                <tr key={req.id} className="border-b border-[#2d2e3e]/60 hover:bg-[#0b0c14]/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={req.interviewerPicture ?? avatarUrl(req.interviewerName, 32)}
                        alt=""
                        className="w-8 h-8 rounded-full border border-[#2d2e3e]"
                      />
                      <span className="font-semibold text-white">{req.interviewerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#b4b5c8]">{req.interviewType}</td>
                  <td className="px-4 py-3 text-[#818cf8]">
                    {req.scheduledAt ? formatEventDateTime(req.scheduledAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-white font-medium">
                    {formatAmount(req.amountCents)}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${paymentStatusColor(req.paymentStatus)}`}>
                    {req.paymentStatus ?? (req.amountCents ? 'Paid' : 'Free')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {req.status.toUpperCase() === 'ACCEPTED' && req.sessionCode && (
                        <Link
                          to={`/interview-room/${req.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg dc-gradient-btn text-white text-xs font-semibold"
                        >
                          <Video size={12} /> View
                        </Link>
                      )}
                      {req.status.toUpperCase() === 'COMPLETED' && req.sessionCode && (
                        <FeedbackLink sessionCode={req.sessionCode} />
                      )}
                      {['PENDING', 'ACCEPTED'].includes(req.status.toUpperCase()) && (
                        <button
                          type="button"
                          disabled={cancelling}
                          onClick={() => handleCancel(req.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 text-xs font-semibold hover:bg-red-500/10 disabled:opacity-50"
                        >
                          <XCircle size={12} /> Cancel
                        </button>
                      )}
                    </div>
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
