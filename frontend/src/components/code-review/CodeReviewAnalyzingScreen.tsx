import { ScanSearch } from 'lucide-react'

const STEPS = [
  'Parsing syntax & structure',
  'Running security heuristics',
  'Evaluating performance patterns',
  'Checking architecture & clean code',
  'Generating quality report',
]

export function CodeReviewAnalyzingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 animate-in fade-in duration-300">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-2xl bg-[#6366f1]/20 animate-pulse" />
        <div className="absolute inset-2 rounded-xl bg-[#161722] border border-[#6366f1]/40 flex items-center justify-center">
          <ScanSearch className="w-8 h-8 text-[#818cf8] dc-analyze-spin" />
        </div>
      </div>
      <h2 className="text-lg font-bold text-white mb-2">Analyzing your code</h2>
      <p className="text-sm text-[#8b8ca8] text-center max-w-sm mb-8">
        Static analysis across security, performance, architecture, and maintainability…
      </p>
      <ul className="w-full max-w-xs space-y-2">
        {STEPS.map((step, i) => (
          <li
            key={step}
            className="flex items-center gap-2 text-xs text-[#b4b5c8] dc-analyze-step"
            style={{ animationDelay: `${i * 0.35}s` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse" />
            {step}
          </li>
        ))}
      </ul>
    </div>
  )
}
