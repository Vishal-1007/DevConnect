import { Trophy, X } from 'lucide-react'
import type { SessionSummary } from '../../api/pairProgrammingApi'

interface Props {
  summary: SessionSummary
  onClose: () => void
}

export function SessionSummaryModal({ summary, onClose }: Props) {
  const mins = Math.floor(summary.durationSeconds / 60)
  const secs = summary.durationSeconds % 60

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-[#161722] border border-[#6366f1]/30 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-[#2d2e3e] flex items-center justify-between dc-gradient-pro">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-300" />
            <h2 className="font-bold text-white">Session Summary</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Duration', `${mins}m ${secs}s`],
              ['Problem', summary.problemTitle],
              ['Language', summary.language],
              ['Points', `+${summary.pointsEarned}`],
              ['Code Quality', `${summary.codeQualityScore}/100`],
              ['Solved', summary.problemSolved ? 'Yes ✓' : 'Not yet'],
            ].map(([label, val]) => (
              <div key={label as string} className="p-3 rounded-xl bg-[#0b0c14] border border-[#2d2e3e]">
                <p className="text-[10px] text-[#5c5d72]">{label as string}</p>
                <p className="text-white font-bold mt-0.5">{val as string}</p>
              </div>
            ))}
          </div>
          <p className="text-[#a5b4fc]">{summary.mentorFeedback}</p>
          <SummaryList title="Strengths" items={summary.strengths} color="text-emerald-400" />
          <SummaryList title="Weaknesses" items={summary.weaknesses} color="text-amber-400" />
          <SummaryList title="Improvement Areas" items={summary.improvementAreas} color="text-[#818cf8]" />
        </div>
        <div className="p-4 border-t border-[#2d2e3e]">
          <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl dc-gradient-btn text-white font-semibold text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

function SummaryList({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div>
      <h4 className={`font-bold ${color} mb-1`}>{title}</h4>
      <ul className="list-disc pl-4 text-[#8b8ca8] space-y-0.5">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}
