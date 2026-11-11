import { Users, Zap, IndianRupee, Phone } from 'lucide-react'
import { formatInr } from '../../lib/money'
import type { MarketplaceStats } from '../../api/marketplaceApi'

export function MarketplaceStatsRow({ stats }: { stats?: MarketplaceStats }) {
  const items = [
    { label: 'Available Mentors', value: stats?.availableMentors ?? '—', icon: Users, color: 'text-[#818cf8]' },
    { label: 'Online Now', value: stats?.onlineNow ?? '—', icon: Zap, color: 'text-emerald-400' },
    { label: 'Average Price', value: stats ? `${formatInr(stats.averagePricePerMinuteCents)}/min` : '—', icon: IndianRupee, color: 'text-amber-400' },
    { label: 'Calls Today', value: stats?.callsToday?.toLocaleString() ?? '—', icon: Phone, color: 'text-cyan-400' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {items.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="rounded-2xl border border-[#2d2e3e]/80 bg-[#12131c]/70 backdrop-blur-xl p-4 hover:border-[#6366f1]/30 transition-colors"
        >
          <Icon className={`w-4 h-4 ${color} mb-2`} />
          <p className="text-lg font-bold text-white">{value}</p>
          <p className="text-[10px] text-[#5c5d72] mt-0.5 uppercase tracking-wide">{label}</p>
        </div>
      ))}
    </div>
  )
}
