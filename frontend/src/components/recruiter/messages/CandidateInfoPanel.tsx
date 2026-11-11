import { ArrowLeft, Calendar } from 'lucide-react'
import { ScheduleInterviewButton } from './ScheduleInterviewButton'
import { formatDisplayDate, formatSlotTime } from '../../../lib/bookingDates'
import type { RecruiterConversation } from '../../../data/recruiterMessagesData'

type Props = {
  conversation: RecruiterConversation | null
  notes: string
  onNotesChange: (notes: string) => void
  onSaveNotes: () => void
  onViewProfile: () => void
  onViewApplication: () => void
  onScheduleInterview: () => void
  onBack?: () => void
  className?: string
}

function DevScoreRing({ score, percentile }: { score: number; percentile: string }) {
  const pct = Math.min(100, (score / 1000) * 100)
  const r = 36
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#2d2e3e" strokeWidth="8" />
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke="url(#devScoreGrad)"
            strokeWidth="8"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="devScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white">{score}</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-[#8b8ca8]">DevScore</p>
        <p className="text-sm font-semibold text-emerald-400">{percentile}</p>
      </div>
    </div>
  )
}

function statusStyle(status: RecruiterConversation['status']) {
  if (status === 'Open to Work') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (status === 'Interviewing') return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  return 'border-[#2d2e3e] bg-white/5 text-[#8b8ca8]'
}

export function CandidateInfoPanel({
  conversation,
  notes,
  onNotesChange,
  onSaveNotes,
  onViewProfile,
  onViewApplication,
  onScheduleInterview,
  onBack,
  className = '',
}: Props) {
  if (!conversation) {
    return (
      <aside className={`flex items-center justify-center border-l border-[#2d2e3e]/80 bg-[#161722]/60 p-6 ${className}`}>
        <p className="text-center text-sm text-[#8b8ca8]">Select a conversation to view candidate details</p>
      </aside>
    )
  }

  const visibleSkills = conversation.skills.slice(0, 6)
  const moreSkills = conversation.skills.length - visibleSkills.length
  const stage = conversation.interviewStage

  return (
    <aside
      className={`flex flex-col overflow-y-auto border-l border-[#2d2e3e]/80 bg-[#161722]/60 backdrop-blur-md ${className}`}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 border-b border-[#2d2e3e]/60 px-4 py-3 text-sm text-[#8b8ca8] hover:text-white xl:hidden"
        >
          <ArrowLeft size={16} />
          Back to chat
        </button>
      )}
      <div className="border-b border-[#2d2e3e]/60 p-5 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white">
          {conversation.candidateAvatar}
        </div>
        <h3 className="mt-3 text-base font-bold text-white">{conversation.candidateName}</h3>
        {conversation.verified && (
          <p className="mt-0.5 text-xs text-blue-400">✔ Verified Candidate</p>
        )}
        <p className="mt-1 text-sm text-[#8b8ca8]">{conversation.role}</p>
        <p className="mt-1 text-xs text-[#8b8ca8]">{conversation.location}</p>
        <span className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyle(conversation.status)}`}>
          {conversation.status}
        </span>
      </div>

      <div className="border-b border-[#2d2e3e]/60 p-5">
        <DevScoreRing score={conversation.devScore} percentile={conversation.percentile} />
      </div>

      <div className="border-b border-[#2d2e3e]/60 p-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8b8ca8]">Skills</h4>
        <div className="flex flex-wrap gap-1.5">
          {visibleSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-[#2d2e3e] bg-white/5 px-2 py-0.5 text-[11px] text-[#c4c5d6]"
            >
              {skill}
            </span>
          ))}
          {moreSkills > 0 && (
            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-200">
              +{moreSkills} more
            </span>
          )}
        </div>
      </div>

      {stage && (
        <div className="border-b border-[#2d2e3e]/60 p-5">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#8b8ca8]">
            <Calendar size={13} />
            Interview Stage
          </h4>
          <p className="text-sm font-semibold text-violet-200">{stage.type}</p>
          <dl className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-[#8b8ca8]">Date</dt>
              <dd className="text-white">{formatDisplayDate(stage.date)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#8b8ca8]">Time</dt>
              <dd className="text-white">{formatSlotTime(stage.time)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#8b8ca8]">Meeting</dt>
              <dd>
                {stage.meetingLink ? (
                  <a href={stage.meetingLink} target="_blank" rel="noreferrer" className="text-violet-300 hover:underline">
                    {stage.platform}
                  </a>
                ) : (
                  <span className="text-white">{stage.platform}</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div className="space-y-2 border-b border-[#2d2e3e]/60 p-5">
        <button
          type="button"
          onClick={onViewProfile}
          className="w-full rounded-xl border border-[#2d2e3e] bg-white/5 py-2.5 text-sm font-medium text-white hover:border-violet-500/40"
        >
          View Full Profile
        </button>
        <button
          type="button"
          onClick={onViewApplication}
          className="w-full rounded-xl border border-[#2d2e3e] bg-white/5 py-2.5 text-sm font-medium text-white hover:border-violet-500/40"
        >
          View Application
        </button>
        <ScheduleInterviewButton onClick={onScheduleInterview} />
      </div>

      <div className="p-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8b8ca8]">Private Notes</h4>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          placeholder="Add notes about this candidate..."
          className="w-full resize-none rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white placeholder:text-[#5c5d72] focus:border-violet-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={onSaveNotes}
          className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Save Notes
        </button>
      </div>
    </aside>
  )
}
