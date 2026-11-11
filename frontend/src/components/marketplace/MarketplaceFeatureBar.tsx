import { Clock, IndianRupee, Shield, UserCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: Clock,
    title: 'Instant Connection',
    subtitle: 'Connect in less than 30 seconds',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: UserCheck,
    title: 'Verified Mentors',
    subtitle: 'All mentors are verified experts',
    color: 'text-[#818cf8]',
    bg: 'bg-[#6366f1]/10',
  },
  {
    icon: IndianRupee,
    title: 'Pay Per Minute',
    subtitle: 'Only pay for the time you use',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    subtitle: 'Your safety is our priority',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
] as const

export function MarketplaceFeatureBar() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
      {FEATURES.map(({ icon: Icon, title, subtitle, color, bg }) => (
        <div
          key={title}
          className="flex items-center gap-3 rounded-xl bg-[#12131c] border border-[#2d2e3e] px-4 py-3"
        >
          <div className={`shrink-0 w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-[11px] text-[#5c5d72] truncate">{subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
