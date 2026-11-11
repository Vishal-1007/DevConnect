import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  MessageSquarePlus,
  Phone,
  PhoneOff,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { avatarUrl } from '../../lib/avatar'
import { useMatchFlow } from '../../hooks/useMatchFlow'
import { useLocalMedia } from '../../hooks/useLocalMedia'
import { formatCallDuration } from '../../lib/formatTime'
import { InterviewChatPanel } from '../mock-interviews/InterviewChatPanel'
import { REVIEW_CHECKLIST, type ReviewVerdict } from '../../data/codeReviewData'
import type { CodeReviewMeta } from '../../store/matchSessionSlice'

interface LineComment {
  id: string
  line: number
  text: string
  author: 'you' | 'reviewer'
}

interface CodeReviewSessionPanelProps {
  meta: CodeReviewMeta
}

export function CodeReviewSessionPanel({ meta }: CodeReviewSessionPanelProps) {
  const { session, startCall, endSession } = useMatchFlow()
  const partner = session.partner
  const inCall = session.status === 'in_call'

  const [code] = useState(meta.code)
  const [lineComments, setLineComments] = useState<LineComment[]>([])
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [completedChecks, setCompletedChecks] = useState<Set<number>>(new Set())
  const [verdict, setVerdict] = useState<ReviewVerdict>('in_progress')
  const [timer, setTimer] = useState('00:00')

  const { stopMedia } = useLocalMedia(inCall)

  useEffect(() => {
    if (!inCall || !session.callStartedAt) return
    const tick = () => setTimer(formatCallDuration(session.callStartedAt))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [inCall, session.callStartedAt])

  if (!partner || !session.conversationId) return null

  const lines = code.split('\n')

  function handleLeave() {
    stopMedia()
    endSession()
  }

  function toggleCheck(index: number) {
    setCompletedChecks((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function addLineComment() {
    if (!selectedLine || !commentDraft.trim()) return
    setLineComments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        line: selectedLine,
        text: commentDraft.trim(),
        author: 'you',
      },
    ])
    setCommentDraft('')
    setSelectedLine(null)
  }

  function commentsForLine(lineNum: number) {
    return lineComments.filter((c) => c.line === lineNum)
  }

  const verdictStyles: Record<ReviewVerdict, string> = {
    in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    changes_requested: 'bg-red-500/15 text-red-400 border-red-500/30',
  }

  const verdictLabel: Record<ReviewVerdict, string> = {
    in_progress: 'In review',
    approved: 'Approved',
    changes_requested: 'Changes requested',
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={handleLeave}
        className="flex items-center gap-2 text-sm text-[#8b8ca8] hover:text-white transition-colors -ml-1"
      >
        <ArrowLeft size={16} />
        Back to submissions
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#818cf8]">
            Live code review
          </p>
          <h2 className="text-xl font-bold text-white mt-1">{meta.title}</h2>
          <p className="text-sm text-[#8b8ca8] mt-0.5">
            {meta.reviewTypeLabel} · {meta.languageLabel} · with {partner.displayName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${verdictStyles[verdict]}`}>
            {verdictLabel[verdict]}
          </span>
          {inCall && (
            <span className="text-sm font-mono text-white bg-[#161722] px-3 py-1 rounded-lg border border-[#2d2e3e]">
              {timer}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-3">
          <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#2d2e3e] bg-[#12131c]">
              <span className="text-xs text-[#8b8ca8]">
                {meta.languageLabel} · {lines.length} lines
              </span>
              <span className="text-xs text-[#6366f1]">{lineComments.length} inline comments</span>
            </div>
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full border-collapse font-mono text-sm">
                <tbody>
                  {lines.map((line, index) => {
                    const lineNum = index + 1
                    const lineCommentsHere = commentsForLine(lineNum)
                    const isSelected = selectedLine === lineNum
                    return (
                      <tr
                        key={lineNum}
                        className={`group ${isSelected ? 'bg-[#6366f1]/10' : 'hover:bg-[#1c1d2a]/80'}`}
                      >
                        <td className="w-12 px-3 py-0.5 text-right text-[#5c5d72] select-none border-r border-[#2d2e3e] align-top">
                          <button
                            type="button"
                            onClick={() => setSelectedLine(isSelected ? null : lineNum)}
                            className="w-full text-right hover:text-[#818cf8]"
                            title="Add comment on this line"
                          >
                            {lineNum}
                          </button>
                        </td>
                        <td className="px-4 py-0.5 text-[#e2e8f0] whitespace-pre">{line || ' '}</td>
                        <td className="w-8 px-1 align-top">
                          {lineCommentsHere.length > 0 && (
                            <MessageSquarePlus size={14} className="text-[#818cf8] mt-1" />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selectedLine && (
            <div className="rounded-xl bg-[#161722] border border-[#6366f1]/40 p-4">
              <p className="text-xs text-[#818cf8] mb-2">Comment on line {selectedLine}</p>
              <div className="flex gap-2">
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Suggest a change or ask a question…"
                  className="flex-1 h-9 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-sm text-white focus:outline-none focus:border-[#6366f1]"
                  onKeyDown={(e) => e.key === 'Enter' && addLineComment()}
                />
                <button
                  type="button"
                  onClick={addLineComment}
                  className="px-3 py-1 rounded-lg dc-gradient-btn text-white text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {lineComments.length > 0 && (
            <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Review comments</h3>
              <ul className="space-y-2">
                {lineComments.map((c) => (
                  <li key={c.id} className="text-sm border-l-2 border-[#6366f1] pl-3">
                    <span className="text-[#818cf8] font-mono text-xs">L{c.line}</span>
                    <p className="text-[#b4b5c8] mt-0.5">{c.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-[#8b8ca8]">{meta.description}</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4 flex gap-3">
            <img src={avatarUrl(partner.displayName, 48)} alt="" className="w-12 h-12 rounded-full shrink-0" />
            <div>
              <p className="font-semibold text-white text-sm">{partner.displayName}</p>
              <p className="text-xs text-[#8b8ca8]">{partner.role ?? 'Senior Reviewer'}</p>
              <p className="text-xs text-emerald-400 mt-1">Reviewer · Online</p>
            </div>
          </div>

          <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Focus areas</h3>
            <div className="flex flex-wrap gap-1.5">
              {meta.focusAreas.map((area) => (
                <span
                  key={area}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[#6366f1]/20 text-[#a5b4fc]"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Review checklist</h3>
            <ul className="space-y-1.5">
              {REVIEW_CHECKLIST.map((item, i) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => toggleCheck(i)}
                    className="flex items-center gap-2 text-xs text-[#b4b5c8] hover:text-white w-full text-left"
                  >
                    {completedChecks.has(i) ? (
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Circle size={14} className="text-[#5c5d72] shrink-0" />
                    )}
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4 space-y-2">
            <h3 className="text-sm font-semibold text-white mb-1">Verdict</h3>
            <button
              type="button"
              onClick={() => setVerdict('approved')}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                verdict === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0b0c14] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
              }`}
            >
              <ThumbsUp size={16} /> Approve
            </button>
            <button
              type="button"
              onClick={() => setVerdict('changes_requested')}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                verdict === 'changes_requested'
                  ? 'bg-red-600 text-white'
                  : 'bg-[#0b0c14] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
              }`}
            >
              <ThumbsDown size={16} /> Request changes
            </button>
          </div>

          {inCall ? (
            <button
              type="button"
              onClick={handleLeave}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold"
            >
              <PhoneOff size={16} /> End call & leave
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={startCall}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg dc-gradient-btn text-white text-sm font-semibold"
              >
                <Phone size={16} /> Join review call
              </button>
              <button
                type="button"
                onClick={handleLeave}
                className="w-full py-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] text-sm hover:text-white transition-colors"
              >
                Leave review
              </button>
            </>
          )}
        </div>
      </div>

      <div className="h-[360px]">
        <InterviewChatPanel conversationId={session.conversationId} partner={partner} />
      </div>
    </div>
  )
}
