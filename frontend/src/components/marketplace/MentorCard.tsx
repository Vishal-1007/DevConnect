import { useState } from 'react'
import { BadgeCheck, Heart, Phone, Star, Target, Video, Zap, Info } from 'lucide-react'
import { avatarUrl } from '../../lib/avatar'
import { formatInr } from '../../lib/money'
import { isMentorSaved, toggleSavedMentor } from './marketplaceUtils'
import { MentorshipRequestActions } from './MentorshipRequestActions'
import type { MarketplaceMentor } from '../../api/marketplaceApi'

interface MentorCardProps {
  mentor: MarketplaceMentor
  onViewProfile: (mentor: MarketplaceMentor) => void
  onAudioCall: (mentor: MarketplaceMentor) => void
  onVideoCall: (mentor: MarketplaceMentor) => void
  onRequestMentorship: (mentor: MarketplaceMentor) => void
}

function statusMeta(status: MarketplaceMentor['availabilityStatus']) {
  if (status === 'AVAILABLE') {
    return { label: 'Online Now', dot: 'bg-emerald-400', text: 'text-emerald-400', glow: 'shadow-[0_0_8px_rgba(52,211,153,0.6)]' }
  }
  if (status === 'BUSY') {
    return { label: 'Busy', dot: 'bg-amber-400', text: 'text-amber-400', glow: '' }
  }
  return { label: 'Offline', dot: 'bg-red-400', text: 'text-red-400', glow: '' }
}

const CATEGORY_COLORS = [
  'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'bg-amber-500/15 text-amber-300 border-amber-500/30',
]

export function MentorCard({ mentor, onViewProfile, onAudioCall, onVideoCall, onRequestMentorship }: MentorCardProps) {
  const [favorited, setFavorited] = useState(() => isMentorSaved(mentor.mentorId))
  const [showPricingTip, setShowPricingTip] = useState(false)
  const status = statusMeta(mentor.availabilityStatus)
  const canCall = mentor.availabilityStatus === 'AVAILABLE' && mentor.instantCallEnabled
  const displayPrice = mentor.videoPricePerMinuteCents
  const platformShare = displayPrice / 2
  const img = mentor.profileImageUrl || avatarUrl(mentor.displayName, 96)

  return (
    <article className="shrink-0 w-[300px] rounded-2xl bg-gradient-to-b from-[#161722]/95 to-[#12131c]/90 border border-[#2d2e3e] p-4 hover:border-[#6366f1]/45 hover:shadow-[0_0_30px_rgba(99,102,241,0.12)] transition-all backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${status.text}`}>
          <span className={`w-2 h-2 rounded-full ${status.dot} ${status.glow}`} />
          {status.label}
        </span>
        <button
          type="button"
          onClick={() => setFavorited(toggleSavedMentor(mentor.mentorId))}
          className="inline-flex items-center gap-1 text-[10px] text-[#8b8ca8] hover:text-red-400 transition-colors px-1.5 py-0.5 rounded-lg hover:bg-red-500/10"
          aria-label="Save mentor"
        >
          <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-red-400 text-red-400' : ''}`} />
          Save
        </button>
      </div>

      <div className="flex flex-col items-center text-center mb-3">
        <img src={img} alt="" className="w-[72px] h-[72px] rounded-2xl ring-2 ring-[#6366f1]/40 mb-2 object-cover" />
        <div className="flex items-center gap-1 flex-wrap justify-center">
          <h3 className="font-bold text-white text-sm">{mentor.displayName}</h3>
          {mentor.verified && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-[#818cf8] font-bold">
              <BadgeCheck className="w-3.5 h-3.5" /> Verified
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#a5b4fc] mt-0.5 leading-snug">
          {mentor.designation} @ {mentor.company}
        </p>
        {mentor.experienceYears != null && (
          <p className="text-[10px] text-[#5c5d72] mt-0.5">{mentor.experienceYears} Years Experience</p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-1 mb-3 min-h-[24px]">
        {mentor.categories.slice(0, 3).map((cat, i) => (
          <span key={cat} className={`text-[9px] px-1.5 py-0.5 rounded-md border font-medium ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}>
            {cat}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
        <div className="flex items-center gap-1 text-[#8b8ca8]">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-white font-bold">{mentor.averageRating.toFixed(1)}</span>
          <span>({mentor.ratingCount})</span>
        </div>
        <div className="flex items-center gap-1 text-[#8b8ca8]">
          <Target className="w-3 h-3 text-[#818cf8]" />
          <span className="text-white font-semibold">{mentor.sessionsCompleted.toLocaleString()}</span> sessions
        </div>
        <div className="col-span-2 flex items-center gap-1 text-emerald-400/90">
          <Zap className="w-3 h-3" />
          Replies within {mentor.responseMinutes} min
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3 min-h-[44px]">
        {mentor.expertiseTags.slice(0, 6).map((tag) => (
          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#c7d2fe]">
            {tag}
          </span>
        ))}
      </div>

      <div className="relative mb-3">
        <div className="text-center py-2 rounded-xl bg-[#0b0c14]/80 border border-emerald-500/20">
          <span className="text-xl font-bold text-emerald-400">{formatInr(displayPrice)}</span>
          <span className="text-xs text-[#8b8ca8]"> / minute</span>
          <button
            type="button"
            onMouseEnter={() => setShowPricingTip(true)}
            onMouseLeave={() => setShowPricingTip(false)}
            className="ml-1 inline-flex align-middle text-[#5c5d72] hover:text-[#818cf8]"
          >
            <Info className="w-3 h-3" />
          </button>
        </div>
        {showPricingTip && (
          <div className="absolute z-10 left-0 right-0 top-full mt-1 p-2 rounded-lg bg-[#161722] border border-[#2d2e3e] text-[9px] text-[#8b8ca8] shadow-xl">
            <p>User Pays: {formatInr(displayPrice)}/min</p>
            <p>Platform Share (50%): {formatInr(platformShare)}/min</p>
            <p>Mentor Earnings (50%): {formatInr(platformShare)}/min</p>
          </div>
        )}
      </div>

      <p className={`text-center text-[10px] font-bold mb-3 ${canCall ? 'text-emerald-400' : 'text-red-400'}`}>
        {canCall ? '🟢 Instant Call Available' : mentor.availabilityStatus === 'BUSY' ? '🟡 Currently Busy' : '🔴 Currently Offline'}
      </p>

      <div className="mt-auto space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!canCall}
            onClick={() => onAudioCall(mentor)}
            className="flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-40"
          >
            <Phone className="w-3.5 h-3.5" /> Audio
          </button>
          <button
            type="button"
            disabled={!canCall}
            onClick={() => onVideoCall(mentor)}
            className="flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold dc-gradient-btn text-white disabled:opacity-40"
          >
            <Video className="w-3.5 h-3.5" /> Video
          </button>
        </div>
        <MentorshipRequestActions
          mentorId={mentor.mentorId}
          onRequest={() => onRequestMentorship(mentor)}
          compact
        />
        <button
          type="button"
          onClick={() => onViewProfile(mentor)}
          className="w-full py-2 rounded-xl text-xs font-semibold text-[#8b8ca8] bg-[#0b0c14] border border-[#2d2e3e] hover:text-white hover:border-[#6366f1]/40"
        >
          View Profile
        </button>
      </div>
    </article>
  )
}
