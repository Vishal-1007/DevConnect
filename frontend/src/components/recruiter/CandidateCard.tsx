import { BadgeCheck, Bookmark, Eye, MapPin, MessageCircle, Star } from 'lucide-react'
import type { RecruiterCandidate } from '../../data/recruiterData'

type Props = {
  candidate: RecruiterCandidate
  onView: (candidate: RecruiterCandidate) => void
  onSave?: (candidate: RecruiterCandidate) => void
}

function DevScoreRing({ score, percentile }: { score: number; percentile: string }) {
  const pct = Math.min(score / 1000, 1)
  const circumference = 2 * Math.PI * 22
  const offset = circumference * (1 - pct)

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-14 shrink-0">
        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="22" fill="none" stroke="#2d2e3e" strokeWidth="4" />
          <circle
            cx="26"
            cy="26"
            r="22"
            fill="none"
            stroke="url(#devScoreGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
          <defs>
            <linearGradient id="devScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
          {score}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-300">DevScore</p>
        <p className="text-xs text-[#8b8ca8]">{percentile} Developers</p>
      </div>
    </div>
  )
}

export function CandidateCard({ candidate, onView, onSave }: Props) {
  const statusColor =
    candidate.status === 'Open to Work'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
      : candidate.status === 'Interviewing'
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
        : 'text-[#8b8ca8] bg-white/5 border-[#2d2e3e]'

  return (
    <tr className="border-b border-[#2d2e3e]/50 transition-colors hover:bg-white/[0.02]">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
            {candidate.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">{candidate.name}</span>
              {candidate.verified && <BadgeCheck size={14} className="text-blue-400" />}
            </div>
            <p className="text-xs text-[#8b8ca8]">{candidate.role}</p>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-400">
              <Star size={11} fill="currentColor" />
              {candidate.rating}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <DevScoreRing score={candidate.devScore} percentile={candidate.percentile} />
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-1.5">
          {candidate.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-[#2d2e3e] bg-white/5 px-2 py-0.5 text-[11px] text-[#c4c5d6]"
            >
              {skill}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-[#c4c5d6]">{candidate.experience}</td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1 text-sm text-[#c4c5d6]">
          <MapPin size={13} className="text-[#8b8ca8]" />
          {candidate.location}
        </div>
        <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColor}`}>
          {candidate.status}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Message"
            className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] transition hover:border-violet-500/40 hover:text-violet-300"
          >
            <MessageCircle size={15} />
          </button>
          <button
            type="button"
            title="View Profile"
            onClick={() => onView(candidate)}
            className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] transition hover:border-violet-500/40 hover:text-violet-300"
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            title="Save Candidate"
            onClick={() => onSave?.(candidate)}
            className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] transition hover:border-violet-500/40 hover:text-violet-300"
          >
            <Bookmark size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}
