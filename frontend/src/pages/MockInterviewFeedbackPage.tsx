import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Loader2, Star } from 'lucide-react'
import { useGetMockInterviewFeedbackQuery } from '../api/mockInterviewApi'

const SCORE_KEYS = [
  { key: 'technicalScore' as const, label: 'Technical' },
  { key: 'communicationScore' as const, label: 'Communication' },
  { key: 'problemSolvingScore' as const, label: 'Problem Solving' },
  { key: 'systemDesignScore' as const, label: 'System Design' },
]

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const labels = SCORE_KEYS.map((s) => s.label)
  const values = SCORE_KEYS.map((s) => Math.min(10, Math.max(0, scores[s.key] ?? 0)))
  const cx = 120
  const cy = 120
  const maxR = 80
  const angleStep = (2 * Math.PI) / labels.length

  function point(i: number, r: number) {
    const angle = i * angleStep - Math.PI / 2
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  }

  const gridLevels = [0.25, 0.5, 0.75, 1]
  const dataPoints = values
    .map((v, i) => {
      const [x, y] = point(i, (v / 10) * maxR)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[280px] mx-auto">
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={labels
            .map((_, i) => {
              const [x, y] = point(i, maxR * level)
              return `${x},${y}`
            })
            .join(' ')}
          fill="none"
          stroke="#2d2e3e"
          strokeWidth="1"
        />
      ))}
      {labels.map((label, i) => {
        const [x, y] = point(i, maxR + 14)
        const [lx, ly] = point(i, maxR)
        return (
          <g key={label}>
            <line x1={cx} y1={cy} x2={lx} y2={ly} stroke="#2d2e3e" strokeWidth="1" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#8b8ca8" fontSize="9">
              {label}
            </text>
          </g>
        )
      })}
      <polygon points={dataPoints} fill="rgba(99,102,241,0.35)" stroke="#818cf8" strokeWidth="2" />
      {values.map((v, i) => {
        const [x, y] = point(i, (v / 10) * maxR)
        return <circle key={i} cx={x} cy={y} r="4" fill="#a5b4fc" />
      })}
    </svg>
  )
}

export function MockInterviewFeedbackPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>()
  const { data: feedback, isLoading, error } = useGetMockInterviewFeedbackQuery(sessionId, {
    skip: !sessionId,
  })

  if (!sessionId) {
    return (
      <div className="p-6 text-[#8b8ca8]">
        Missing session. <Link to="/mock-interviews" className="text-[#818cf8]">Back</Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[280px] gap-2 text-[#8b8ca8]">
        <Loader2 className="animate-spin" size={20} /> Loading feedback…
      </div>
    )
  }

  if (error || !feedback) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-white font-semibold">Feedback not available yet</p>
        <Link to="/mock-interviews" className="text-sm text-[#818cf8] hover:underline mt-2 inline-block">
          Back to Mock Interviews
        </Link>
      </div>
    )
  }

  const scoreMap = {
    technicalScore: feedback.technicalScore,
    communicationScore: feedback.communicationScore,
    problemSolvingScore: feedback.problemSolvingScore,
    systemDesignScore: feedback.systemDesignScore,
  }

  const avg =
    (feedback.technicalScore +
      feedback.communicationScore +
      feedback.problemSolvingScore +
      feedback.systemDesignScore) /
    4

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        to="/mock-interviews?tab=requests"
        className="inline-flex items-center gap-2 text-sm text-[#8b8ca8] hover:text-white mb-6"
      >
        <ArrowLeft size={16} /> Back to My Requests
      </Link>

      <div className="rounded-2xl bg-gradient-to-br from-[#6366f1]/20 via-[#161722] to-[#0b0c14] border border-[#2d2e3e] p-6 mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-[#818cf8]">Mock interview feedback</p>
        <h1 className="text-2xl font-bold text-white mt-1">Session with {feedback.interviewerName}</h1>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={18}
                className={
                  i <= Math.round(feedback.overallRating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-[#3d3e52]'
                }
              />
            ))}
          </div>
          <span className="text-lg font-bold text-white">{feedback.overallRating.toFixed(1)}</span>
          <span className="text-sm text-[#8b8ca8]">overall · avg skill {avg.toFixed(1)}/10</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
          <h2 className="text-sm font-bold text-white mb-4">Score breakdown</h2>
          <div className="space-y-3">
            {SCORE_KEYS.map(({ key, label }) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#8b8ca8]">{label}</span>
                  <span className="text-white font-mono">{feedback[key]}/10</span>
                </div>
                <div className="h-2 rounded-full bg-[#0b0c14] overflow-hidden">
                  <div
                    className="h-full dc-gradient-btn rounded-full"
                    style={{ width: `${(feedback[key] / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5 flex flex-col items-center">
          <h2 className="text-sm font-bold text-white mb-2 w-full text-left">Skills radar</h2>
          <RadarChart scores={scoreMap} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {feedback.strengths && (
          <section className="rounded-xl bg-[#161722] border border-emerald-500/30 p-4">
            <h3 className="text-xs font-bold uppercase text-emerald-400 mb-2">Strengths</h3>
            <p className="text-sm text-[#b4b5c8] whitespace-pre-wrap">{feedback.strengths}</p>
          </section>
        )}
        {feedback.weaknesses && (
          <section className="rounded-xl bg-[#161722] border border-amber-500/30 p-4">
            <h3 className="text-xs font-bold uppercase text-amber-400 mb-2">Areas to improve</h3>
            <p className="text-sm text-[#b4b5c8] whitespace-pre-wrap">{feedback.weaknesses}</p>
          </section>
        )}
        {feedback.recommendations && (
          <section className="rounded-xl bg-[#161722] border border-[#6366f1]/30 p-4 md:col-span-1">
            <h3 className="text-xs font-bold uppercase text-[#818cf8] mb-2">Recommendations</h3>
            <p className="text-sm text-[#b4b5c8] whitespace-pre-wrap">{feedback.recommendations}</p>
          </section>
        )}
      </div>
    </div>
  )
}
