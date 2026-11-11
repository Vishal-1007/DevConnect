import { formatInr } from '../../lib/money'

interface RevenueBreakdownCardProps {
  totalRevenueCents: number
  platformShareCents: number
  mentorEarningsCents: number
  completedCalls: number
}

export function RevenueBreakdownCard({
  totalRevenueCents,
  platformShareCents,
  mentorEarningsCents,
  completedCalls,
}: RevenueBreakdownCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4">
        <p className="text-xs text-[#8b8ca8]">Total Revenue Generated</p>
        <p className="text-xl font-bold text-white mt-1">{formatInr(totalRevenueCents)}</p>
      </div>
      <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4">
        <p className="text-xs text-[#8b8ca8]">Platform Share (50%)</p>
        <p className="text-xl font-bold text-amber-400 mt-1">{formatInr(platformShareCents)}</p>
      </div>
      <div className="rounded-xl bg-[#161722] border border-[#6366f1]/30 p-4">
        <p className="text-xs text-[#8b8ca8]">Mentor Earnings (50%)</p>
        <p className="text-xl font-bold text-emerald-400 mt-1">{formatInr(mentorEarningsCents)}</p>
      </div>
      <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4">
        <p className="text-xs text-[#8b8ca8]">Completed Calls</p>
        <p className="text-xl font-bold text-white mt-1">{completedCalls}</p>
      </div>
    </div>
  )
}
