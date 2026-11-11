import { Link } from 'react-router-dom'
import { Check, Users } from 'lucide-react'
import { useListMyMentorshipRequestsQuery } from '../../api/mentorshipApi'
import { getMentorshipRequestState } from './marketplaceUtils'

interface MentorshipRequestActionsProps {
  mentorId: string
  onRequest: () => void
  compact?: boolean
  className?: string
}

export function MentorshipRequestActions({
  mentorId,
  onRequest,
  compact = false,
  className = '',
}: MentorshipRequestActionsProps) {
  const { data: requests = [] } = useListMyMentorshipRequestsQuery(undefined, {
    pollingInterval: 15_000,
  })
  const state = getMentorshipRequestState(mentorId, requests)

  if (state === 'pending') {
    return (
      <button
        type="button"
        disabled
        className={`w-full py-2.5 rounded-xl text-xs font-bold bg-[#2d2e3e]/60 text-[#8b8ca8] border border-[#2d2e3e] cursor-not-allowed ${className}`}
      >
        Request Sent
      </button>
    )
  }

  if (state === 'accepted') {
    return (
      <div className={`space-y-2 ${className}`}>
        <button
          type="button"
          disabled
          className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-default"
        >
          <Check className="w-3.5 h-3.5" /> ✓ Your Mentor
        </button>
        <Link
          to="/my-mentorship-requests"
          className={`block w-full text-center rounded-xl text-xs font-semibold text-[#c7d2fe] bg-[#6366f1]/10 border border-[#6366f1]/30 hover:bg-[#6366f1]/20 transition-colors ${
            compact ? 'py-2' : 'py-2.5'
          }`}
        >
          Go To My Mentor
        </Link>
      </div>
    )
  }

  if (state === 'rejected') {
    return (
      <button
        type="button"
        onClick={onRequest}
        className={`w-full py-2.5 rounded-xl text-xs font-bold dc-gradient-btn text-white flex items-center justify-center gap-1.5 ${className}`}
      >
        <Users className="w-3.5 h-3.5" /> Reapply
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onRequest}
      className={`w-full py-2.5 rounded-xl text-xs font-bold dc-gradient-btn text-white flex items-center justify-center gap-1.5 ${className}`}
    >
      <Users className="w-3.5 h-3.5" /> Request Mentorship
    </button>
  )
}
