import { ArrowRight, Bot, Check } from 'lucide-react'

const ROBOT_IMAGE = '/assets/mock-interview/ai-robot.png'

const FEATURES = [
  'Resume Based Questions',
  'Real AI Interview Simulation',
  'Voice Based Interview',
  'Instant AI Feedback',
  'Performance Score',
] as const

interface SmartInterviewCardProps {
  onStart: () => void
}

export function SmartInterviewCard({ onStart }: SmartInterviewCardProps) {
  return (
    <section className="relative rounded-2xl overflow-hidden border border-[#6366f1]/25 bg-gradient-to-r from-[#1a1040] via-[#161722] to-[#0f172a] shadow-xl shadow-[#6366f1]/10 transition-all duration-300 hover:border-[#6366f1]/40 hover:shadow-[#6366f1]/20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,_rgba(99,102,241,0.25),transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,_rgba(59,130,246,0.12),transparent_50%)] pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-stretch">
        <div className="flex-1 p-6 sm:p-7 z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#6366f1]/20 border border-[#6366f1]/30">
              <Bot className="w-5 h-5 text-[#a5b4fc]" />
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-white">Smart Interview Room</h2>
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/40">
                AI Powered
              </span>
            </div>
          </div>

          <p className="text-sm text-[#9ca3af] leading-relaxed max-w-lg mb-5">
            Practice realistic AI interviews based on your resume, experience, and target role.
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-6">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-xs text-[#b4b5c8]">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/15 shrink-0">
                  <Check size={10} className="text-emerald-400" />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg dc-gradient-btn text-white text-sm font-semibold shadow-lg shadow-[#6366f1]/25 hover:shadow-[#6366f1]/40 transition-all"
          >
            Start AI Interview
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="relative w-full md:w-[42%] lg:w-[38%] min-h-[180px] md:min-h-[220px] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#161722]/80 md:to-[#161722]/40 z-10" />
          <img
            src={ROBOT_IMAGE}
            alt="AI interview robot assistant"
            className="absolute right-0 bottom-0 h-full w-full object-contain object-right-bottom scale-105 origin-bottom-right"
          />
        </div>
      </div>
    </section>
  )
}
