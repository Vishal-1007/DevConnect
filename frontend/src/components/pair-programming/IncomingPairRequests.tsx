import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle, Code2 } from 'lucide-react'
import {
  useAcceptPairInvitationMutation,
  useListIncomingPairInvitationsQuery,
  useRejectPairInvitationMutation,
} from '../../api/pairProgrammingApi'

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function IncomingPairRequests() {
  const navigate = useNavigate()
  const { data: invitations = [], isLoading, refetch } = useListIncomingPairInvitationsQuery(undefined, {
    pollingInterval: 5000,
  })
  const [accept, { isLoading: accepting }] = useAcceptPairInvitationMutation()
  const [reject, { isLoading: rejecting }] = useRejectPairInvitationMutation()

  async function handleAccept(sessionId: string, sessionCode: string) {
    await accept({ sessionId }).unwrap()
    void refetch()
    navigate(`/pair-session/${sessionCode}`)
  }

  async function handleReject(sessionId: string) {
    await reject({ sessionId }).unwrap()
    void refetch()
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#8b8ca8] py-4">
        <Loader2 size={16} className="animate-spin" /> Loading incoming requests…
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-6 text-center">
        <Code2 className="w-8 h-8 text-[#5c5d72] mx-auto mb-2" />
        <p className="text-sm text-[#8b8ca8]">No incoming pair programming requests.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Incoming Session Requests</h3>
      {invitations.map((inv) => (
        <div
          key={inv.id}
          className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4 flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">{inv.senderName}</p>
            <p className="text-xs text-[#8b8ca8] mt-1">
              Language: <span className="text-white capitalize">{inv.language}</span>
            </p>
            <p className="text-xs text-[#8b8ca8]">
              Challenge: <span className="text-white">{inv.challenge}</span>
            </p>
            <p className="text-xs text-[#8b8ca8]">
              Role: <span className="text-white capitalize">{inv.role}</span>
            </p>
            <p className="text-xs text-[#5c5d72] mt-1">Requested at: {formatDate(inv.createdAt)}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              disabled={accepting || rejecting}
              onClick={() => void handleAccept(inv.sessionId, inv.sessionCode)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> Accept
            </button>
            <button
              type="button"
              disabled={accepting || rejecting}
              onClick={() => void handleReject(inv.sessionId)}
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
