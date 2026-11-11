import {
  BadgeCheck, Eye, MessageCircle, MoreHorizontal, Star,
} from 'lucide-react'
import type { SavedTalentCandidate } from '../../../data/recruiterTalentPoolData'

type Props = {
  candidate: SavedTalentCandidate
  onView: () => void
  onMessage: () => void
  onMore: () => void
}

function DevScoreRing({ score, percentile }: { score: number; percentile: string }) {
  const pct = Math.min(score / 1000, 1)
  const circumference = 2 * Math.PI * 20
  const offset = circumference * (1 - pct)
  const color = score >= 900 ? '#10b981' : score >= 800 ? '#6366f1' : '#f59e0b'

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-12 w-12">
        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#2d2e3e" strokeWidth="4" />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {score}
        </span>
      </div>
      <p className="mt-1 text-[10px] font-medium text-emerald-400">{percentile}</p>
    </div>
  )
}

function statusStyle(status: SavedTalentCandidate['status']) {
  if (status === 'Open to Work') return 'text-emerald-400'
  if (status === 'Interviewing') return 'text-amber-400'
  return 'text-[#8b8ca8]'
}

function sourceStyle(source: SavedTalentCandidate['source']) {
  const map: Record<string, string> = {
    Search: 'text-violet-300',
    'Job Application': 'text-blue-300',
    Referral: 'text-emerald-300',
    Manual: 'text-amber-300',
  }
  return map[source] ?? 'text-[#8b8ca8]'
}

export function SavedCandidateCard({ candidate, onView, onMessage, onMore }: Props) {
  const visibleSkills = candidate.skills.slice(0, 4)
  const more = candidate.skills.length - visibleSkills.length

  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-4 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
            {candidate.avatar}
          </div>
          <div>
            <p className="flex items-center gap-1 text-sm font-semibold text-white">
              {candidate.name}
              {candidate.verified && <BadgeCheck size={13} className="text-blue-400" />}
            </p>
            <p className="text-xs text-[#8b8ca8]">{candidate.role}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-400">
              <Star size={11} fill="currentColor" />
              {candidate.rating} ({candidate.reviewCount} reviews)
            </p>
          </div>
        </div>
        <DevScoreRing score={candidate.devScore} percentile={candidate.percentile} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {visibleSkills.map((s) => (
          <span key={s} className="rounded-full border border-[#2d2e3e] bg-white/5 px-2 py-0.5 text-[10px] text-[#c4c5d6]">
            {s}
          </span>
        ))}
        {more > 0 && (
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-200">
            +{more} more
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[#8b8ca8]">Experience</p>
          <p className="font-medium text-white">{candidate.experience}</p>
        </div>
        <div>
          <p className="text-[#8b8ca8]">Location</p>
          <p className="font-medium text-white">{candidate.locationDisplay}</p>
          <p className={`text-[11px] ${statusStyle(candidate.status)}`}>{candidate.status}</p>
        </div>
        <div>
          <p className="text-[#8b8ca8]">Added On</p>
          <p className="font-medium text-white">{candidate.addedOnDisplay}</p>
        </div>
        <div>
          <p className="text-[#8b8ca8]">Source</p>
          <p className={`font-medium ${sourceStyle(candidate.source)}`}>{candidate.source}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2 border-t border-[#2d2e3e]/60 pt-3">
        <button
          type="button"
          onClick={onMessage}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#2d2e3e] bg-white/5 py-2 text-xs text-[#c4c5d6] hover:text-white"
        >
          <MessageCircle size={13} />
          Message
        </button>
        <button
          type="button"
          onClick={onView}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#2d2e3e] bg-white/5 py-2 text-xs text-[#c4c5d6] hover:text-white"
        >
          <Eye size={13} />
          View
        </button>
        <button
          type="button"
          onClick={onMore}
          className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] hover:text-white"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  )
}

export function DevScoreCell({ score, percentile }: { score: number; percentile: string }) {
  return <DevScoreRing score={score} percentile={percentile} />
}

export function CandidateCell({ candidate }: { candidate: SavedTalentCandidate }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
        {candidate.avatar}
      </div>
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
          {candidate.name}
          {candidate.verified && <BadgeCheck size={14} className="text-blue-400" />}
        </p>
        <p className="text-xs text-[#8b8ca8]">{candidate.role}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-400">
          <Star size={11} fill="currentColor" />
          {candidate.rating} ({candidate.reviewCount} reviews)
        </p>
      </div>
    </div>
  )
}

export { statusStyle, sourceStyle }
