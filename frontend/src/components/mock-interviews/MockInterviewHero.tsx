import { Mic, Shield, Sparkles, Star, Users } from 'lucide-react'
import { MockInterviewHeroIllustration } from './MockInterviewHeroIllustration'

/** Reference design uses fixed platform marketing stats in the hero banner */
const HERO_STATS = [
  {
    label: 'Interviewers',
    value: '350+',
    icon: Users,
    iconBg: 'bg-[#6366f1]/20',
    iconClass: 'text-[#818cf8]',
  },
  {
    label: 'Interviews Conducted',
    value: '12,000+',
    icon: Sparkles,
    iconBg: 'bg-pink-500/15',
    iconClass: 'text-pink-400',
  },
  {
    label: 'Average Rating',
    value: '4.8',
    icon: Star,
    iconBg: 'bg-amber-500/15',
    iconClass: 'text-amber-400 fill-amber-400',
  },
  {
    label: 'Satisfaction Rate',
    value: '98%',
    icon: Shield,
    iconBg: 'bg-emerald-500/15',
    iconClass: 'text-emerald-400',
  },
] as const

export function MockInterviewHero() {
  return (
    <section className="relative rounded-2xl overflow-hidden border border-[#2d2e3e]/80 bg-gradient-to-br from-[#12131c] via-[#161722] to-[#1a1740] shadow-xl shadow-black/20">
      {/* Right-side illustration */}
      <div className="absolute inset-y-0 right-0 w-[52%] pointer-events-none hidden md:block">
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#161722]/10 to-[#161722] z-10" />
        <div className="absolute inset-0 flex items-end justify-end pr-2 pb-0">
          <MockInterviewHeroIllustration />
        </div>
      </div>

      <div className="relative z-20 p-6 sm:p-7 md:max-w-[58%]">
        <div className="mb-4">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#6366f1] shadow-lg shadow-[#6366f1]/30 mb-3">
            <Mic className="w-5 h-5 text-white" />
          </span>
          <h1 className="text-2xl sm:text-[1.75rem] font-bold text-white tracking-tight leading-tight">
            Mock Interviews
          </h1>
          <p className="text-[13px] text-[#9ca3af] leading-relaxed mt-2 max-w-md">
            Practice with experienced engineers from top companies. Book real interview sessions and get
            personalized feedback.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {HERO_STATS.map(({ label, value, icon: Icon, iconBg, iconClass }) => (
            <div
              key={label}
              className="rounded-xl bg-[#0b0c14]/50 border border-white/[0.06] backdrop-blur-md px-3 py-2.5"
            >
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${iconBg} mb-1.5`}>
                <Icon size={12} className={iconClass} />
              </span>
              <p className="text-base font-bold text-white leading-none">{value}</p>
              <p className="text-[9px] text-[#6b7280] mt-1 leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile illustration */}
      <div className="relative md:hidden px-4 pb-4 pt-1 max-h-[140px] overflow-hidden">
        <MockInterviewHeroIllustration />
      </div>
    </section>
  )
}
