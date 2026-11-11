import { ArrowLeft, BookOpen, Star, TrendingUp } from 'lucide-react'
import type { AiInterviewResult } from '../../api/aiInterviewApi'

interface InterviewResultProps {
  result: AiInterviewResult
  candidateName?: string
  onBack: () => void
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#8b8ca8]">{label}</span>
        <span className="text-white font-semibold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#0b0c14] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#818cf8] transition-all duration-700"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}

function hiringBadge(level?: string) {
  const l = (level ?? '').toLowerCase()
  if (l.includes('strong')) return { text: level ?? 'Strong Hire', className: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' }
  if (l === 'hire') return { text: level ?? 'Hire', className: 'text-[#818cf8] bg-[#6366f1]/10 border-[#6366f1]/30' }
  if (l.includes('improvement')) return { text: level ?? 'Needs Improvement', className: 'text-amber-400 bg-amber-400/10 border-amber-400/30' }
  return { text: level ?? 'No Hire', className: 'text-red-400 bg-red-400/10 border-red-400/30' }
}

export function InterviewResult({ result, candidateName, onBack }: InterviewResultProps) {
  const badge = hiringBadge(result.hiringLevel)
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[#8b8ca8] hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to Mock Interviews
      </button>

      <div className="rounded-2xl bg-[#161722] border border-[#2d2e3e] p-6 sm:p-8 text-center">
        <p className="text-xs uppercase tracking-wide text-[#818cf8] font-bold mb-2">Interview Complete</p>
        <h1 className="text-3xl font-bold text-white mb-1">
          {result.overallScore}
          <span className="text-lg text-[#8b8ca8] font-normal">/100</span>
        </h1>
        <p className="text-sm text-[#8b8ca8]">
          Overall Score{candidateName ? ` · ${candidateName}` : ''}
        </p>
        {result.hiringLevel && (
          <div className={`inline-flex mt-3 px-4 py-1.5 rounded-full text-sm font-bold border ${badge.className}`}>
            Hiring: {badge.text}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp size={16} className="text-[#818cf8]" /> Performance Breakdown
        </h3>
        <ScoreBar label="Technical Knowledge" value={result.technicalScore} />
        <ScoreBar label="Communication" value={result.communicationScore} />
        <ScoreBar label="Problem Solving" value={result.problemSolvingScore} />
        <ScoreBar label="Confidence" value={result.confidenceScore} />
        <ScoreBar label="Grammar" value={result.grammarScore ?? 0} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
          <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
            <Star size={14} /> Strengths
          </h3>
          <ul className="space-y-2">
            {result.strengths.map((s) => (
              <li key={s} className="text-xs text-[#b4b5c8] flex gap-2">
                <span className="text-emerald-400">✓</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
          <h3 className="text-sm font-bold text-amber-400 mb-3">Improvements</h3>
          <ul className="space-y-2">
            {result.improvements.map((s) => (
              <li key={s} className="text-xs text-[#b4b5c8] flex gap-2">
                <span className="text-amber-400">→</span> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {result.recommendedTopics.length > 0 && (
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <BookOpen size={16} className="text-[#818cf8]" /> Recommended Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.recommendedTopics.map((t) => (
              <span key={t} className="text-xs px-3 py-1 rounded-full bg-[#6366f1]/10 text-[#a5b4fc] border border-[#6366f1]/25">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.questions.length > 0 && (
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
          <h3 className="text-sm font-bold text-white mb-3">Question-by-Question Review</h3>
          <div className="space-y-3">
            {result.questions.filter((q) => q.score != null).map((q) => (
              <div key={q.questionId} className="rounded-lg bg-[#0b0c14] p-3 border border-[#2d2e3e]">
                <div className="flex justify-between gap-2 mb-1">
                  <span className="text-[10px] text-[#818cf8] font-bold">Q{q.questionOrder}</span>
                  <span className="text-[10px] font-bold text-white">{q.score}/100</span>
                </div>
                <p className="text-xs text-[#b4b5c8] mb-1">{q.question}</p>
                {q.aiFeedback && <p className="text-[10px] text-[#8b8ca8]">{q.aiFeedback}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
