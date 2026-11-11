import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  GitBranch,
  RotateCcw,
  Star,
} from 'lucide-react'
import type { CodeReviewReport as Report } from '../../lib/codeReviewAnalyzer'
import {
  REVIEW_FOCUS_OPTIONS,
  type FocusAreaId,
} from '../../data/codeReviewData'
import { CodeReviewIssueCard } from './CodeReviewIssueCard'

function AnimatedScoreBar({
  label,
  value,
  delayMs,
}: {
  label: string
  value: number
  delayMs: number
}) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = window.setTimeout(() => setWidth((value / 10) * 100), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])

  return (
    <div className="dc-score-bar-enter">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-[#8b8ca8]">{label}</span>
        <span className="text-white font-semibold tabular-nums">
          {value}/10
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-[#0b0c14] overflow-hidden border border-[#2d2e3e]/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#6366f1] via-[#818cf8] to-[#a78bfa] transition-all duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

interface CodeReviewReportViewProps {
  report: Report
  onNewAnalysis: () => void
  onRequestMentor: () => void
  mentorRequested: boolean
}

export function CodeReviewReportView({
  report,
  onNewAnalysis,
  onRequestMentor,
  mentorRequested,
}: CodeReviewReportViewProps) {
  const { submission } = report
  const focusLabels = submission.focusAreas
    .map((id) => REVIEW_FOCUS_OPTIONS.find((o) => o.id === id)?.label ?? id)
    .join(' · ')

  const scoreEntries: { id: FocusAreaId; label: string; value: number }[] = submission.focusAreas.map(
    (id) => ({
      id,
      label: REVIEW_FOCUS_OPTIONS.find((o) => o.id === id)?.label ?? id,
      value: report.scores[id],
    })
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onNewAnalysis}
          className="flex items-center gap-2 text-sm text-[#8b8ca8] hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> New analysis
        </button>
        <button
          type="button"
          onClick={onNewAnalysis}
          className="flex items-center gap-1.5 text-xs text-[#818cf8] hover:text-white"
        >
          <RotateCcw size={12} /> Run again
        </button>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-[#6366f1]/20 via-[#161722] to-[#161722] border border-[#6366f1]/30 p-6 sm:p-8 text-center shadow-xl shadow-[#6366f1]/10">
        <p className="text-[10px] uppercase tracking-widest text-[#a5b4fc] font-bold mb-2">
          AI Code Quality Report
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl sm:text-5xl font-bold text-white tabular-nums">
            {report.overallScore}
          </span>
          <span className="text-lg text-[#8b8ca8]">/10</span>
          <Star className="w-6 h-6 text-amber-400 fill-amber-400 ml-1" />
        </div>
        <p className="text-sm text-[#b4b5c8] mt-2 max-w-lg mx-auto">{report.summary}</p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#0b0c14] border border-[#2d2e3e] text-[#b4b5c8]">
            {submission.title}
          </span>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#0b0c14] border border-[#2d2e3e] text-[#b4b5c8]">
            {submission.languageLabel} · {submission.framework}
          </span>
          {submission.githubUrl && (
            <a
              href={submission.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] px-2.5 py-1 rounded-full bg-[#0b0c14] border border-[#2d2e3e] text-[#818cf8] hover:text-white inline-flex items-center gap-1"
            >
              <GitBranch size={10} /> Repository
            </a>
          )}
        </div>
        <p className="text-[10px] text-[#5c5d72] mt-3">{focusLabels}</p>
      </div>

      <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Quality dimensions</h3>
        {scoreEntries.map((entry, i) => (
          <AnimatedScoreBar
            key={entry.id}
            label={entry.label}
            value={entry.value}
            delayMs={120 + i * 80}
          />
        ))}
      </div>

      {report.critical.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
            <span>🔴</span> Critical issues
          </h3>
          <div className="space-y-3">
            {report.critical.map((issue, i) => (
              <CodeReviewIssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        </section>
      )}

      {report.improvements.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
            <span>🟡</span> Improvements
          </h3>
          <div className="space-y-3">
            {report.improvements.map((issue, i) => (
              <CodeReviewIssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        </section>
      )}

      {report.goodPractices.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
            <span>🟢</span> Good practices
          </h3>
          <div className="space-y-3">
            {report.goodPractices.map((issue, i) => (
              <CodeReviewIssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        </section>
      )}

      <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
        <h3 className="text-sm font-semibold text-white mb-2">Submitted code</h3>
        <pre className="p-4 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-[11px] font-mono text-[#b4b5c8] overflow-x-auto max-h-48">
          {submission.code}
        </pre>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-[#6366f1]/10 to-[#7c3aed]/10 border border-[#6366f1]/25 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Want human validation?</h3>
          <p className="text-xs text-[#8b8ca8] mt-1 max-w-md">
            Request an expert mentor to review this report asynchronously. No live match — they respond when available.
          </p>
        </div>
        <button
          type="button"
          disabled={mentorRequested}
          onClick={onRequestMentor}
          className="shrink-0 px-5 py-2.5 rounded-xl dc-gradient-btn text-white text-sm font-semibold disabled:opacity-60"
        >
          {mentorRequested ? 'Mentor review requested ✓' : 'Request Expert Mentor Review'}
        </button>
      </div>
    </div>
  )
}
