import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react'
import type { CodeReviewIssue } from '../../lib/codeReviewAnalyzer'

const SEVERITY_META = {
  critical: {
    icon: AlertTriangle,
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/20 text-red-300',
    label: 'Critical',
  },
  improvement: {
    icon: Lightbulb,
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/20 text-amber-300',
    label: 'Improvement',
  },
  good: {
    icon: CheckCircle2,
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    badge: 'bg-emerald-500/20 text-emerald-300',
    label: 'Good practice',
  },
} as const

interface CodeReviewIssueCardProps {
  issue: CodeReviewIssue
  index: number
}

export function CodeReviewIssueCard({ issue, index }: CodeReviewIssueCardProps) {
  const meta = SEVERITY_META[issue.severity]
  const Icon = meta.icon

  return (
    <article
      className={`rounded-xl border ${meta.border} ${meta.bg} p-4 transition-all duration-300 hover:border-opacity-60`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#0b0c14] flex items-center justify-center shrink-0">
          <Icon size={16} className="text-white/80" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white">{issue.problem}</h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.badge}`}>
              {meta.label}
            </span>
          </div>
          <p className="text-xs text-[#b4b5c8] leading-relaxed mb-2">{issue.explanation}</p>
          <p className="text-xs text-[#8b8ca8]">
            <span className="text-[#818cf8] font-medium">Recommended: </span>
            {issue.solution}
          </p>
          {issue.codeSuggestion && (
            <pre className="mt-3 p-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-[11px] font-mono text-[#c4c5d8] overflow-x-auto whitespace-pre-wrap">
              {issue.codeSuggestion}
            </pre>
          )}
        </div>
      </div>
    </article>
  )
}
