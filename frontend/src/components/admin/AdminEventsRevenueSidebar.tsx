import { Check, Loader2, Wallet, X } from 'lucide-react'
import {
  useApproveEventWithdrawalMutation,
  useGetEventRevenueQuery,
  useListEventWithdrawalsQuery,
  useRejectEventWithdrawalMutation,
} from '../../api/adminEventsApi'
import { formatInr } from '../../lib/formatTime'
import { categoryLabels } from '../../data/eventsData'

export function AdminEventsRevenueSidebar() {
  const { data: revenue, isLoading } = useGetEventRevenueQuery()
  const { data: withdrawals } = useListEventWithdrawalsQuery('pending')
  const [approve] = useApproveEventWithdrawalMutation()
  const [reject] = useRejectEventWithdrawalMutation()

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={20} className="animate-spin text-[#818cf8]" />
      </div>
    )
  }

  if (!revenue) return null

  const total = revenue.totalRevenueInr || 1
  const platformPct = Math.round((revenue.platformEarningsInr / total) * 100)
  const mentorPct = 100 - platformPct

  return (
    <div className="space-y-4 w-full xl:w-72 shrink-0">
      <aside className="dc-glass-card rounded-2xl p-4">
        <h3 className="text-sm font-bold text-white mb-4">Revenue Overview</h3>
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2d2e3e" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke="#7c3aed" strokeWidth="3"
              strokeDasharray={`${platformPct} ${100 - platformPct}`}
            />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke="#34d399" strokeWidth="3"
              strokeDasharray={`${mentorPct} ${100 - mentorPct}`}
              strokeDashoffset={`-${platformPct}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-white">{formatInr(revenue.totalRevenueInr)}</span>
            <span className="text-[9px] text-[#8b8ca8]">Total</span>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#8b8ca8]">Platform (40%)</span>
            <span className="text-[#a5b4fc] font-semibold">{formatInr(revenue.platformEarningsInr)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b8ca8]">Mentor payouts (60%)</span>
            <span className="text-emerald-400 font-semibold">{formatInr(revenue.mentorPayoutsInr)}</span>
          </div>
        </div>
      </aside>

      <aside className="dc-glass-card rounded-2xl p-4">
        <h3 className="text-sm font-bold text-white mb-3">Event Statistics</h3>
        <ul className="space-y-2 text-xs">
          <li className="flex justify-between"><span className="text-[#8b8ca8]">Total events</span><span className="text-white font-semibold">{revenue.totalEvents}</span></li>
          <li className="flex justify-between"><span className="text-[#8b8ca8]">Approved</span><span className="text-emerald-400 font-semibold">{revenue.approvedEvents}</span></li>
          <li className="flex justify-between"><span className="text-[#8b8ca8]">Pending</span><span className="text-amber-400 font-semibold">{revenue.pendingApprovals}</span></li>
          <li className="flex justify-between"><span className="text-[#8b8ca8]">Registrations</span><span className="text-white font-semibold">{revenue.totalRegistrations}</span></li>
          <li className="flex justify-between"><span className="text-[#8b8ca8]">Paid users</span><span className="text-white font-semibold">{revenue.paidRegistrations}</span></li>
        </ul>
      </aside>

      {revenue.topCategories.length > 0 && (
        <aside className="dc-glass-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">Top Categories</h3>
          <ul className="space-y-2">
            {revenue.topCategories.map((cat) => {
              const max = revenue.topCategories[0]?.count ?? 1
              const pct = Math.round((cat.count / max) * 100)
              return (
                <li key={cat.category}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[#8b8ca8]">{categoryLabels[cat.category] ?? cat.category}</span>
                    <span className="text-white">{cat.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#2d2e3e] overflow-hidden">
                    <div className="h-full dc-gradient-btn rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </aside>
      )}

      {(withdrawals?.length ?? 0) > 0 && (
        <aside className="dc-glass-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Wallet size={14} />
            Pending Withdrawals ({withdrawals!.length})
          </h3>
          <ul className="space-y-2">
            {withdrawals!.slice(0, 5).map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2 text-xs bg-[#0b0c14]/60 rounded-lg p-2">
                <span className="text-white font-medium">{formatInr(w.amountCents / 100)}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => approve(w.id)}
                    className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10"
                    title="Approve"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => reject({ withdrawalId: w.id })}
                    className="p-1 rounded text-red-400 hover:bg-red-500/10"
                    title="Reject"
                  >
                    <X size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  )
}
