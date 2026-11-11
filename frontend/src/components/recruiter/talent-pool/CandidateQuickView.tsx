import { BadgeCheck, Calendar, Download, Eye, MessageCircle, Trash2, X } from 'lucide-react'
import type { SavedTalentCandidate } from '../../../data/recruiterTalentPoolData'

type Props = {
  candidate: SavedTalentCandidate
  onClose: () => void
  onMessage: () => void
  onScheduleInterview: () => void
  onViewFullProfile: () => void
  onRemove: () => void
}

export function CandidateQuickView({
  candidate,
  onClose,
  onMessage,
  onScheduleInterview,
  onViewFullProfile,
  onRemove,
}: Props) {
  const b = candidate.breakdown

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[#2d2e3e] bg-[#161722] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[#2d2e3e] bg-[#161722]/95 px-5 py-4 backdrop-blur-md">
          <h2 className="text-base font-bold text-white">Candidate Quick View</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8b8ca8] hover:bg-[#2d2e3e]/50 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white">
              {candidate.avatar}
            </div>
            <h3 className="mt-3 flex items-center justify-center gap-2 text-lg font-bold text-white">
              {candidate.name}
              {candidate.verified && <BadgeCheck size={18} className="text-blue-400" />}
            </h3>
            <p className="text-sm text-[#8b8ca8]">{candidate.role}</p>
            <p className="mt-2 text-2xl font-bold text-violet-300">
              DevScore {candidate.devScore}
            </p>
            {candidate.aiMatch && (
              <p className="mt-1 text-sm font-medium text-emerald-400">
                AI Match {candidate.aiMatch}%
              </p>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8b8ca8]">Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-[#2d2e3e] bg-white/5 px-2 py-0.5 text-[11px] text-[#c4c5d6]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {b && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'AI Interview', value: `${b.aiInterview}%` },
                { label: 'Coding Score', value: String(b.codingScore) },
                { label: 'Project Score', value: `${b.projectScore}%` },
                { label: 'Mentor Rating', value: String(b.mentorRating) },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/60 p-3 text-center"
                >
                  <p className="text-[10px] text-[#8b8ca8]">{metric.label}</p>
                  <p className="mt-1 text-lg font-bold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          )}

          {candidate.mentorFeedback && (
            <div className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8b8ca8]">Mentor Feedback</p>
              <p className="mt-1 text-sm italic text-[#c4c5d6]">&ldquo;{candidate.mentorFeedback}&rdquo;</p>
            </div>
          )}

          {candidate.resumeUrl && (
            <a
              href={candidate.resumeUrl}
              className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
            >
              <Download size={15} />
              Download Resume
            </a>
          )}

          <div className="space-y-2 border-t border-[#2d2e3e]/60 pt-4">
            <button
              type="button"
              onClick={onViewFullProfile}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2d2e3e] bg-white/5 py-2.5 text-sm font-medium text-white hover:border-violet-500/40"
            >
              <Eye size={15} />
              View Full Profile
            </button>
            <button
              type="button"
              onClick={onMessage}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2d2e3e] bg-white/5 py-2.5 text-sm font-medium text-white hover:border-violet-500/40"
            >
              <MessageCircle size={15} />
              Message
            </button>
            <button
              type="button"
              onClick={onScheduleInterview}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/20"
            >
              <Calendar size={15} />
              Schedule Interview
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/20"
            >
              <Trash2 size={15} />
              Remove from Pool
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
