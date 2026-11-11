/**
 * MentorEarningsPanel — financial dashboard with payouts, withdrawals, and payment analytics.
 */
import { useMemo, useState } from 'react'
import {
  DollarSign, TrendingUp, Loader2, RefreshCw, AlertTriangle, Wallet,
  ArrowDownToLine, Receipt, PieChart, Check, X,
} from 'lucide-react'
import {
  useGetMentorEarningsQuery,
  useRequestMentorWithdrawalMutation,
} from '../../api/mentorWorkspaceApi'
import { MentorPanelShell } from './MentorPanelShell'

function StatDelta({ pct, inverse = false }: { pct: number; inverse?: boolean }) {
  const positive = inverse ? pct <= 0 : pct >= 0
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      <TrendingUp size={10} className={positive ? '' : 'rotate-180'} />
      {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

function BarChart({ values, color = '#10b981', h = 80 }: { values: number[]; color?: string; h?: number }) {
  const max = Math.max(...values, 1)
  const barW = (100 - 0.15 * (values.length - 1) * 100 / values.length) / values.length
  return (
    <svg width="100%" height={h} viewBox="0 0 100 100" preserveAspectRatio="none">
      {values.map((v, i) => {
        const bh = Math.max(3, (v / max) * 96)
        return (
          <rect
            key={i}
            x={i * (100 / values.length)}
            y={100 - bh}
            width={barW}
            height={bh}
            rx="1"
            fill={color}
            opacity="0.85"
          />
        )
      })}
    </svg>
  )
}

function Pill({ children, color }: { children: React.ReactNode; color: 'green' | 'amber' | 'gray' | 'blue' }) {
  const cls = {
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8] border-[#3d3e52]',
  }[color]
  return (
    <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {children}
    </span>
  )
}

function WithdrawModal({
  availableCents,
  onClose,
}: {
  availableCents: number
  onClose: () => void
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [request, { isLoading }] = useRequestMentorWithdrawalMutation()

  const submit = async () => {
    const cents = Math.round(parseFloat(amount) * 100)
    if (!cents || cents < 100) {
      setError('Minimum withdrawal is $1.00')
      return
    }
    if (cents > availableCents) {
      setError(`Maximum available: $${(availableCents / 100).toFixed(2)}`)
      return
    }
    setError('')
    try {
      await request({ amountCents: cents, note: note.trim() || undefined }).unwrap()
      onClose()
    } catch {
      setError('Could not submit withdrawal request.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-[#2d2e3e] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Request Withdrawal</h3>
            <p className="text-[10px] text-[#5c5d72] mt-0.5">
              Available: ${(availableCents / 100).toFixed(2)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg px-3 py-2 text-[10px] text-red-400">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[10px] text-[#5c5d72] mb-1">Amount (USD)</label>
            <input
              type="number"
              min={1}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#5c5d72] mb-1">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Monthly payout to bank account"
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowDownToLine size={14} />}
            Submit Withdrawal Request
          </button>
        </div>
      </div>
    </div>
  )
}

export function MentorEarningsPanel() {
  const { data: earnings, isLoading, isError, refetch, isFetching } = useGetMentorEarningsQuery()
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [tab, setTab] = useState<'transactions' | 'payouts' | 'withdrawals'>('transactions')

  const revSeries = useMemo(
    () => (earnings?.revenueTrend ?? []).map((p) => Math.round(p.amountCents / 100)),
    [earnings],
  )

  if (isLoading && !earnings) {
    return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
  }

  if (isError || !earnings) {
    return (
      <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
        <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
        <p className="text-sm text-white font-semibold mb-1">Could not load earnings</p>
        <button type="button" onClick={() => refetch()} className="text-xs text-violet-400 hover:text-violet-300 mt-2">Try again</button>
      </div>
    )
  }

  const analytics = earnings.paymentAnalytics

  return (
    <MentorPanelShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Earnings</h2>
          <p className="text-xs text-[#8b8ca8] mt-0.5">Your financial dashboard — revenue, payouts, commissions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setShowWithdraw(true)}
            disabled={(analytics?.availableBalanceCents ?? 0) <= 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold"
          >
            <ArrowDownToLine size={13} /> Withdraw
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 w-full">
        {[
          { l: 'Total Earnings', v: earnings.totalEarningsLabel, delta: earnings.revenueGrowthPct, c: '#10b981' },
          { l: 'Monthly Revenue', v: earnings.monthlyRevenueLabel, delta: earnings.revenueGrowthPct, c: '#818cf8' },
          { l: 'Session Revenue', v: earnings.sessionRevenueLabel, delta: 0, c: '#06b6d4' },
          { l: 'Pending Payout', v: earnings.pendingPayoutLabel, delta: 0, c: '#f59e0b' },
          { l: 'Net (after fee)', v: earnings.netEarningsLabel, delta: 0, c: '#a78bfa' },
        ].map((s) => (
          <div key={s.l} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <p className="text-[10px] text-[#8b8ca8] mb-2">{s.l}</p>
            <p className="text-xl font-bold text-white mb-1">{s.v}</p>
            {s.delta !== 0 && <StatDelta pct={s.delta} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full items-stretch">
        <div className="lg:col-span-2 bg-[#161722] border border-[#2d2e3e] rounded-xl p-5 h-full flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4">Revenue (Last 7 Days)</h3>
          <BarChart values={revSeries.length > 0 ? revSeries : [0]} color="#10b981" h={80} />
          <div className="flex justify-between mt-2">
            {(earnings.revenueTrend ?? []).map((p) => (
              <span key={p.label} className="text-[9px] text-[#5c5d72]">{p.label}</span>
            ))}
          </div>
        </div>

        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5 space-y-4 h-full flex flex-col">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart size={14} className="text-violet-400" /> Payment Analytics
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#8b8ca8]">Platform commission</span>
              <span className="text-white font-semibold">{earnings.commissionRatePct}% ({earnings.platformFeeLabel})</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#8b8ca8]">Available balance</span>
              <span className="text-emerald-400 font-semibold">{analytics?.availableBalanceLabel ?? '$0.00'}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#2d2e3e] space-y-2">
            {(analytics?.revenueByCategory ?? []).slice(0, 4).map((item) => (
              <div key={item.category}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#8b8ca8]">{item.category}</span>
                  <span className="text-white font-semibold">{item.amountLabel}</span>
                </div>
                <div className="w-full bg-[#1c1d2a] rounded-full h-1">
                  <div
                    className="h-1 rounded-full bg-violet-500"
                    style={{ width: `${Math.min(100, item.sharePct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2d2e3e] flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-white">Financial Activity</h3>
          <div className="flex gap-2">
            {(['transactions', 'payouts', 'withdrawals'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                  tab === t
                    ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                    : 'bg-[#12131a] border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
                }`}
              >
                {t === 'transactions' ? 'Session Revenue' : t === 'payouts' ? 'Payout History' : 'Withdrawals'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'transactions' && (
          (earnings.transactions ?? []).length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5c5d72]">No transactions yet</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1c1d2a] bg-[#12131c]">
                  {['TXN', 'Description', 'Amount', 'Date', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1d2a]">
                {earnings.transactions.map((t) => (
                  <tr key={t.bookingId} className="hover:bg-[#1c1d2a]/50">
                    <td className="px-5 py-3 text-[10px] text-[#5c5d72] font-mono">{t.code}</td>
                    <td className="px-5 py-3 text-xs text-white">{t.description}</td>
                    <td className="px-5 py-3 text-xs font-bold text-emerald-400">{t.amountLabel}</td>
                    <td className="px-5 py-3 text-[10px] text-[#5c5d72]">{t.dateLabel}</td>
                    <td className="px-5 py-3">
                      <Pill color={t.status === 'Completed' ? 'green' : 'amber'}>{t.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'payouts' && (
          (earnings.payoutHistory ?? []).length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5c5d72]">No payout history yet</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1c1d2a] bg-[#12131c]">
                  {['Payout ID', 'Method', 'Amount', 'Date', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1d2a]">
                {earnings.payoutHistory.map((p) => (
                  <tr key={p.id} className="hover:bg-[#1c1d2a]/50">
                    <td className="px-5 py-3 text-[10px] text-[#5c5d72] font-mono">{p.payoutCode}</td>
                    <td className="px-5 py-3 text-xs text-[#8b8ca8]">{p.method}</td>
                    <td className="px-5 py-3 text-xs font-bold text-emerald-400">{p.amountLabel}</td>
                    <td className="px-5 py-3 text-[10px] text-[#5c5d72]">{p.dateLabel}</td>
                    <td className="px-5 py-3"><Pill color="green">{p.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'withdrawals' && (
          (earnings.withdrawalRequests ?? []).length === 0 ? (
            <div className="p-8 text-center">
              <Wallet size={32} className="text-[#3d3e52] mx-auto mb-2" />
              <p className="text-xs text-[#5c5d72]">No withdrawal requests yet</p>
              <button type="button" onClick={() => setShowWithdraw(true)} className="text-xs text-violet-400 mt-2 hover:text-violet-300">
                Request your first withdrawal
              </button>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1c1d2a] bg-[#12131c]">
                  {['Request ID', 'Amount', 'Date', 'Note', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1d2a]">
                {earnings.withdrawalRequests.map((w) => (
                  <tr key={w.id} className="hover:bg-[#1c1d2a]/50">
                    <td className="px-5 py-3 text-[10px] text-[#5c5d72] font-mono">{w.withdrawalCode}</td>
                    <td className="px-5 py-3 text-xs font-bold text-emerald-400">{w.amountLabel}</td>
                    <td className="px-5 py-3 text-[10px] text-[#5c5d72]">{w.dateLabel}</td>
                    <td className="px-5 py-3 text-xs text-[#8b8ca8] max-w-[200px] truncate">{w.note ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Pill color={w.status === 'Completed' ? 'green' : w.status === 'Pending' ? 'amber' : 'gray'}>
                        {w.status === 'Pending' && <Check size={9} className="mr-0.5" />}
                        {w.status}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {showWithdraw && (
        <WithdrawModal
          availableCents={analytics?.availableBalanceCents ?? 0}
          onClose={() => setShowWithdraw(false)}
        />
      )}
    </MentorPanelShell>
  )
}
