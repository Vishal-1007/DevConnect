import { BadgeCheck, Mic, Star, Video, X } from 'lucide-react'
import { avatarUrl } from '../../lib/avatar'
import { formatInr } from '../../lib/money'
import { useListMyMentorshipRequestsQuery } from '../../api/mentorshipApi'
import { getMentorshipRequestState } from './marketplaceUtils'
import { MentorshipRequestButton } from './MentorshipRequestButton'
import type { MarketplaceMentor } from '../../api/marketplaceApi'

interface MentorProfileModalProps {
  mentor: MarketplaceMentor
  onClose: () => void
  onAudioCall: (mentor: MarketplaceMentor) => void
  onVideoCall: (mentor: MarketplaceMentor) => void
  onRequestMentorship?: (mentor: MarketplaceMentor) => void
}

export function MentorProfileModal({ mentor, onClose, onAudioCall, onVideoCall, onRequestMentorship }: MentorProfileModalProps) {
  const canCall = mentor.availabilityStatus === 'AVAILABLE' && mentor.instantCallEnabled
  const { data: requests = [] } = useListMyMentorshipRequestsQuery(undefined, { pollingInterval: 15_000 })
  const requestState = getMentorshipRequestState(mentor.mentorId, requests)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-[#161722] border border-[#2d2e3e] shadow-2xl overflow-hidden">
        <div className="relative p-5 border-b border-[#2d2e3e] dc-gradient-pro">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <img src={mentor.profileImageUrl || avatarUrl(mentor.displayName, 72)} alt="" className="w-16 h-16 rounded-full ring-2 ring-white/30 object-cover" />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-white">{mentor.displayName}</h2>
                {mentor.verified && <BadgeCheck className="w-5 h-5 text-white" />}
              </div>
              <p className="text-sm text-white/80">{mentor.designation} @ {mentor.company}</p>
              <div className="flex items-center gap-1 mt-1 text-amber-300">
                <Star className="w-4 h-4 fill-amber-300" />
                <span className="font-semibold">{mentor.averageRating.toFixed(1)}</span>
                <span className="text-white/70 text-xs">({mentor.ratingCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <h3 className="text-xs font-semibold text-[#8b8ca8] uppercase tracking-wide mb-1">About Mentor</h3>
            <p className="text-sm text-[#d1d2e0]">{mentor.bio ?? 'Experienced mentor ready to help you grow.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-[#0b0c14] border border-[#2d2e3e] p-3">
              <p className="text-[#8b8ca8] text-xs">Experience</p>
              <p className="text-white font-semibold">{mentor.experienceYears ?? '—'} years</p>
            </div>
            <div className="rounded-lg bg-[#0b0c14] border border-[#2d2e3e] p-3">
              <p className="text-[#8b8ca8] text-xs">Sessions Completed</p>
              <p className="text-white font-semibold">{mentor.sessionsCompleted}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[#8b8ca8] uppercase tracking-wide mb-2">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {mentor.expertiseTags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 rounded-full bg-[#6366f1]/15 text-[#a5b4fc]">{tag}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="text-xs text-[#8b8ca8]">Audio Call</p>
              <p className="text-emerald-400 font-bold">{formatInr(mentor.audioPricePerMinuteCents)}/min</p>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="text-xs text-[#8b8ca8]">Video Call</p>
              <p className="text-emerald-400 font-bold">{formatInr(mentor.videoPricePerMinuteCents)}/min</p>
            </div>
          </div>

          {mentor.linkedinUrl && (
            <a href={mentor.linkedinUrl} target="_blank" rel="noreferrer" className="text-sm text-[#6366f1] hover:underline">
              View LinkedIn Profile
            </a>
          )}
        </div>

        <div className="p-4 border-t border-[#2d2e3e] grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!canCall}
            onClick={() => onAudioCall(mentor)}
            className="flex items-center justify-center gap-1 py-2.5 rounded-xl text-sm font-semibold dc-gradient-btn text-white disabled:opacity-40"
          >
            <Mic className="w-4 h-4" /> Audio
          </button>
          <button
            type="button"
            disabled={!canCall}
            onClick={() => onVideoCall(mentor)}
            className="flex items-center justify-center gap-1 py-2.5 rounded-xl text-sm font-semibold bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/40 disabled:opacity-40"
          >
            <Video className="w-4 h-4" /> Video
          </button>
          <div className="col-span-2 flex justify-center">
            <MentorshipRequestButton
              state={requestState}
              size="sm"
              onRequest={() => {
                onRequestMentorship?.(mentor)
                onClose()
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
