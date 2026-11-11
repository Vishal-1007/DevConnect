import { Link } from 'react-router-dom'
import { Check, Users } from 'lucide-react'
import type { MentorshipRequestState } from './marketplaceUtils'

interface MentorshipRequestButtonProps {
  state: MentorshipRequestState
  onRequest: () => void
  size?: 'sm' | 'md'
}

export function MentorshipRequestButton({ state, onRequest, size = 'md' }: MentorshipRequestButtonProps) {
  const padding = size === 'sm' ? 'px-4 py-2' : 'px-5 py-2.5'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  if (state === 'pending') {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center gap-2 ${padding} rounded-xl ${textSize} font-bold bg-[#2d2e3e]/60 text-[#8b8ca8] border border-[#2d2e3e] cursor-not-allowed`}
      >
        Request Sent
      </button>
    )
  }

  if (state === 'accepted') {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          className={`inline-flex items-center gap-2 ${padding} rounded-xl ${textSize} font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-default`}
        >
          <Check className="w-4 h-4" /> ✓ Your Mentor
        </button>
        <Link
          to="/my-mentorship-requests"
          className={`inline-flex items-center gap-2 ${padding} rounded-xl ${textSize} font-semibold text-[#c7d2fe] bg-[#6366f1]/10 border border-[#6366f1]/30 hover:bg-[#6366f1]/20 transition-colors`}
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
        className={`inline-flex items-center gap-2 ${padding} rounded-xl ${textSize} font-bold dc-gradient-btn text-white`}
      >
        <Users className="w-4 h-4" /> Reapply
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onRequest}
      className={`inline-flex items-center gap-2 ${padding} rounded-xl ${textSize} font-bold dc-gradient-btn text-white`}
    >
      <Users className="w-4 h-4" /> Request Mentorship
    </button>
  )
}
