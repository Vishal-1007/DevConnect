import { useState } from 'react'
import {
  BadgeCheck, Download, ExternalLink, Star, X,
} from 'lucide-react'
import type { RecruiterInterview, InterviewFeedback } from '../../../data/recruiterInterviewData'
import { updateRecruiterInterview } from '../../../lib/recruiterInterviewStore'

type Props = {
  interview: RecruiterInterview
  onClose: () => void
  onUpdate: (interviews: RecruiterInterview[]) => void
}

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-[#8b8ca8]">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="text-amber-400 transition hover:scale-110"
          >
            <Star size={18} fill={n <= value ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    </div>
  )
}

export function InterviewDetails({ interview, onClose, onUpdate }: Props) {
  const [notes, setNotes] = useState(interview.recruiterNotes ?? '')
  const [feedback, setFeedback] = useState<InterviewFeedback>(
    interview.feedback ?? {
      technical: 4,
      communication: 4,
      problemSolving: 4,
      decision: 'Hold',
    },
  )

  function saveFeedback() {
    const next = updateRecruiterInterview(interview.id, {
      recruiterNotes: notes,
      feedback,
    })
    onUpdate(next)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#2d2e3e] bg-[#161722] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[#2d2e3e] bg-[#161722]/95 px-6 py-4 backdrop-blur-md">
          <div>
            <h2 className="text-lg font-bold text-white">Interview Details</h2>
            <p className="text-xs text-[#8b8ca8]">
              {interview.interviewType} · {interview.jobTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8b8ca8] hover:bg-[#2d2e3e]/50 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section className="flex flex-wrap items-start gap-4 rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/60 p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">
              {interview.candidateAvatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-xl font-bold text-white">
                {interview.candidateName}
                {interview.verified && <BadgeCheck size={18} className="text-blue-400" />}
              </p>
              <p className="mt-1 text-sm text-violet-300">
                DevScore <span className="font-bold">{interview.devScore}</span>
                {interview.aiMatchPercent && (
                  <span className="ml-3 text-emerald-400">AI Match {interview.aiMatchPercent}%</span>
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {interview.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[#2d2e3e] bg-white/5 px-2 py-0.5 text-[11px] text-[#c4c5d6]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            {interview.resumeUrl && (
              <a
                href={interview.resumeUrl}
                className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
              >
                <Download size={15} />
                Resume
              </a>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'AI Interview Score', value: `${interview.aiInterviewScore ?? 0}%`, color: 'text-violet-300' },
              { label: 'Coding Score', value: String(interview.codingScore ?? 0), color: 'text-emerald-400' },
              { label: 'Mentor Rating', value: String(interview.mentorRating ?? 0), color: 'text-amber-300' },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/60 p-4 text-center"
              >
                <p className="text-[11px] text-[#8b8ca8]">{metric.label}</p>
                <p className={`mt-1 text-2xl font-bold ${metric.color}`}>{metric.value}</p>
              </div>
            ))}
          </section>

          {interview.projectLinks && interview.projectLinks.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-white">Project Links</h3>
              <div className="flex flex-wrap gap-2">
                {interview.projectLinks.map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    className="flex items-center gap-1.5 rounded-lg border border-[#2d2e3e] bg-white/5 px-3 py-2 text-xs text-violet-300 hover:text-violet-200"
                  >
                    <ExternalLink size={12} />
                    {p.name}
                  </a>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold text-white">Recruiter Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this candidate's interview..."
              className="w-full resize-none rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white placeholder:text-[#5c5d72] focus:border-violet-500 focus:outline-none"
            />
          </section>

          <section className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/60 p-4">
            <h3 className="mb-4 text-sm font-semibold text-white">Feedback Form</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <StarRating
                label="Technical Knowledge"
                value={feedback.technical}
                onChange={(v) => setFeedback({ ...feedback, technical: v })}
              />
              <StarRating
                label="Communication"
                value={feedback.communication}
                onChange={(v) => setFeedback({ ...feedback, communication: v })}
              />
              <StarRating
                label="Problem Solving"
                value={feedback.problemSolving}
                onChange={(v) => setFeedback({ ...feedback, problemSolving: v })}
              />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-[#8b8ca8]">Overall Decision</p>
              <div className="flex flex-wrap gap-2">
                {(['Selected', 'Hold', 'Rejected'] as const).map((decision) => (
                  <button
                    key={decision}
                    type="button"
                    onClick={() => setFeedback({ ...feedback, decision })}
                    className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                      feedback.decision === decision
                        ? decision === 'Selected'
                          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                          : decision === 'Rejected'
                            ? 'border-red-500/50 bg-red-500/15 text-red-300'
                            : 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                        : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
                    }`}
                  >
                    {decision}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={saveFeedback}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Save Feedback
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
