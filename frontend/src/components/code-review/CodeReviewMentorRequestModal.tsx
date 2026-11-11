import { useState } from 'react'
import { Loader2, UserCheck, X } from 'lucide-react'
import { useCreateMentorshipRequestMutation, useListMyMentorsQuery } from '../../api/mentorshipApi'
import { avatarUrl } from '../../lib/avatar'
import type { CodeReviewReport } from '../../lib/codeReviewAnalyzer'

interface CodeReviewMentorRequestModalProps {
  report: CodeReviewReport
  onClose: () => void
  onSuccess: () => void
}

export function CodeReviewMentorRequestModal({
  report,
  onClose,
  onSuccess,
}: CodeReviewMentorRequestModalProps) {
  const { data: mentors = [], isLoading } = useListMyMentorsQuery()
  const [createRequest, { isLoading: submitting }] = useCreateMentorshipRequestMutation()
  const [mentorId, setMentorId] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selected = mentors.find((m) => m.mentorId === mentorId)

  async function handleSubmit() {
    if (!mentorId) {
      setError('Select a mentor to continue.')
      return
    }
    setError(null)
    const summary = [
      `Code review: ${report.submission.title}`,
      `Score: ${report.overallScore}/10`,
      `Language: ${report.submission.languageLabel} (${report.submission.framework})`,
      report.submission.githubUrl ? `Repo: ${report.submission.githubUrl}` : null,
      `Critical: ${report.critical.length}, Improvements: ${report.improvements.length}`,
      note.trim() ? `Note: ${note.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    try {
      await createRequest({
        mentorId,
        goal: 'Expert Code Review',
        message: summary,
      }).unwrap()
      onSuccess()
    } catch {
      setError('Could not send request. Try again or pick another mentor.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#161722] border border-[#2d2e3e] shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="mentor-review-title"
      >
        <div className="flex items-center justify-between p-5 border-b border-[#2d2e3e]">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-[#818cf8]" />
            <h2 id="mentor-review-title" className="text-sm font-bold text-white">
              Request expert mentor review
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b8ca8] hover:text-white hover:bg-[#2d2e3e]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-[#8b8ca8]">
            Your AI report ({report.overallScore}/10) will be attached. The mentor reviews asynchronously — no live session required.
          </p>

          {isLoading && <p className="text-sm text-[#8b8ca8]">Loading your mentors…</p>}

          {!isLoading && mentors.length === 0 && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-200">
              You need an accepted mentor first. Request mentorship from Find Match or your mentor dashboard, then return here.
            </div>
          )}

          {mentors.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-[#8b8ca8]">Select mentor</label>
              {mentors.map((m) => (
                <button
                  key={m.mentorId}
                  type="button"
                  onClick={() => setMentorId(m.mentorId)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    mentorId === m.mentorId
                      ? 'border-[#6366f1] bg-[#6366f1]/10'
                      : 'border-[#2d2e3e] bg-[#0b0c14] hover:border-[#6366f1]/40'
                  }`}
                >
                  <img
                    src={m.profileImageUrl ?? avatarUrl(m.mentorName, 40)}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{m.mentorName}</p>
                    <p className="text-[10px] text-[#8b8ca8] truncate">
                      {m.headline ?? m.company ?? 'Mentor'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs text-[#8b8ca8] mb-1">Additional context (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="PR link, deadline, areas you want deep feedback on…"
              className="w-full px-3 py-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1] resize-y"
            />
          </div>

          {error && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="p-5 border-t border-[#2d2e3e] flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-[#8b8ca8] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || mentors.length === 0 || !mentorId}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 rounded-lg dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Send async review request
          </button>
        </div>

        {selected && (
          <p className="px-5 pb-4 text-[10px] text-[#5c5d72] text-center">
            Request goes to {selected.mentorName} · typical response within 24–48h
          </p>
        )}
      </div>
    </div>
  )
}
