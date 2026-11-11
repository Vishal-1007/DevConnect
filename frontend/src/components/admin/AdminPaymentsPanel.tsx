import { useMemo, useState } from 'react'
import {
  CreditCard,
  RefreshCw,
  Search,
  Loader2,
  Eye,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  Users,
  Wallet,
  PieChart,
  CheckCircle2,
} from 'lucide-react'
import {
  useListAdminTransactionsQuery,
  useGetPaymentAnalyticsQuery,
  useListMentorPayoutsQuery,
  useListPremiumSubscriptionsQuery,
  useRefundTransactionMutation,
  useRetryTransactionMutation,
  useProcessMentorPayoutMutation,
  TX_TYPE_COLORS,
  TX_STATUS_COLORS,
  type FinancialTransaction,
  type PaymentAnalytics,
} from '../../api/adminPaymentsApi'
import { extractApiError } from '../../lib/extractApiError'

const PALETTE = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#0891b2']
const avatarColor = (s: string) => PALETTE[s.charCodeAt(0) % PALETTE.length]

function Av({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.38 }}
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
    >
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    green: 'bg-emerald-500/15 text-emerald-400',
    red: 'bg-red-500/15 text-red-400',
    amber: 'bg-amber-500/15 text-amber-400',
    blue: 'bg-blue-500/15 text-blue-400',
    purple: 'bg-violet-500/15 text-violet-400',
    cyan: 'bg-cyan-500/15 text-cyan-400',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[color] ?? map.gray}`}>
      {children}
    </span>
  )
}

function StatDelta({ pct }: { pct: number }) {
  const up = pct >= 0
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      <TrendingUp size={10} className={up ? '' : 'rotate-180'} />
      {up ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

function BarChartSimple({ values, color = '#10b981', height = 100 }: { values: number[]; color?: string; height?: number }) {
  const max = Math.max(...values, 1)
  const w = 100
  const h = height
  const gap = 4
  const barW = (w - gap * (values.length - 1)) / values.length
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {values.map((v, i) => {
        const bh = Math.max(4, (v / max) * (h - 8))
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={h - bh}
            width={barW}
            height={bh}
            rx={2}
            fill={color}
            opacity={0.85}
          />
        )
      })}
    </svg>
  )
}

function AlertBanner({ type, message, onDismiss }: { type: 'error' | 'success'; message: string; onDismiss?: () => void }) {
  return (
    <div
      className={`flex items-start justify-between gap-3 px-4 py-3 rounded-lg text-xs ${
        type === 'error'
          ? 'bg-red-500/10 border border-red-500/30 text-red-300'
          : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
      }`}
    >
      <p>{message}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-[#8b8ca8] hover:text-white shrink-0">
          ✕
        </button>
      )}
    </div>
  )
}

type ViewTab = 'overview' | 'transactions' | 'payouts' | 'subscriptions'
type TxFilter = 'all' | 'failed' | 'refunds' | 'payment' | 'subscription'

export function AdminPaymentsPanel() {
  const [viewTab, setViewTab] = useState<ViewTab>('overview')
  const [txFilter, setTxFilter] = useState<TxFilter>('all')
  const [search, setSearch] = useState('')
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const queryParams = useMemo(() => {
    if (txFilter === 'failed') return { filter: 'failed', q: search }
    if (txFilter === 'refunds') return { filter: 'refunds', q: search }
    if (txFilter === 'payment' || txFilter === 'subscription') {
      return { type: txFilter, q: search }
    }
    return { q: search }
  }, [txFilter, search])

  const { data: transactions = [], isLoading, isFetching, refetch } = useListAdminTransactionsQuery(queryParams, {
    pollingInterval: 15000,
    skip: viewTab === 'payouts' || viewTab === 'subscriptions',
  })
  const { data: analytics } = useGetPaymentAnalyticsQuery(undefined, { pollingInterval: 20000 })
  const { data: payouts = [] } = useListMentorPayoutsQuery(undefined, { skip: viewTab !== 'payouts' && viewTab !== 'overview' })
  const { data: subscriptions = [] } = useListPremiumSubscriptionsQuery(undefined, {
    skip: viewTab !== 'subscriptions' && viewTab !== 'overview',
  })

  const [refundTx] = useRefundTransactionMutation()
  const [retryTx] = useRetryTransactionMutation()
  const [processPayout] = useProcessMentorPayoutMutation()

  const stats: PaymentAnalytics = analytics ?? {
    totalRevenueCents: 0,
    totalRevenueLabel: '$0.00',
    monthlyRevenueCents: 0,
    monthlyRevenueLabel: '$0.00',
    monthlyRevenueGrowthPct: 0,
    pendingPayoutCents: 0,
    pendingPayoutLabel: '$0.00',
    platformCommissionCents: 0,
    platformCommissionLabel: '$0.00',
    totalTransactions: 0,
    failedCount: 0,
    refundCount: 0,
    premiumUserCount: 0,
    activeSubscriptions: 0,
    transactionsByType: {},
    revenueTrend: [],
  }

  const revValues = useMemo(
    () => stats.revenueTrend.map((p) => p.amountCents / 100),
    [stats.revenueTrend]
  )
  const revLabels = stats.revenueTrend.map((p) => p.label)

  async function handleRefund(id: string) {
    if (!confirm('Process refund for this transaction?')) return
    try {
      await refundTx(id).unwrap()
      setBanner({ type: 'success', message: 'Refund processed' })
      refetch()
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    }
  }

  async function handleRetry(id: string) {
    try {
      await retryTx(id).unwrap()
      setBanner({ type: 'success', message: 'Payment retry succeeded' })
      refetch()
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    }
  }

  async function handlePayout(id: string) {
    try {
      await processPayout(id).unwrap()
      setBanner({ type: 'success', message: 'Payout completed' })
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard size={20} className="text-violet-400" />
            Payments & Revenue
          </h2>
          <p className="text-xs text-[#8b8ca8] mt-1">
            Financial management · commissions · payouts · subscriptions
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {banner && <AlertBanner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: 'Total Revenue', v: stats.totalRevenueLabel, delta: stats.monthlyRevenueGrowthPct },
          { l: 'Pending Payouts', v: stats.pendingPayoutLabel, delta: 12.3 },
          { l: 'Transactions', v: String(stats.totalTransactions), delta: 9.1 },
          { l: 'Failed', v: String(stats.failedCount), delta: stats.failedCount > 0 ? -2.5 : 0 },
        ].map((c) => (
          <div key={c.l} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <p className="text-[10px] text-[#8b8ca8] mb-2">{c.l}</p>
            <p className="text-2xl font-bold text-white mb-1">{c.v}</p>
            <StatDelta pct={c.delta} />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['overview', 'transactions', 'payouts', 'subscriptions'] as ViewTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setViewTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize ${
              viewTab === t
                ? 'bg-violet-600 text-white'
                : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {(viewTab === 'overview' || viewTab === 'transactions') && (
        <>
          {viewTab === 'transactions' && (
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'payment', 'subscription', 'refunds', 'failed'] as TxFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTxFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                    txFilter === f
                      ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200'
                      : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
              <div className="relative flex-1 min-w-[200px] max-w-md ml-auto">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transactions…"
                  className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#818cf8]"
                />
              </div>
            </div>
          )}

          {viewTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">Revenue (Last 7 Days)</h3>
                <BarChartSimple values={revValues.length ? revValues : [0, 0, 0, 0, 0, 0, 0]} color="#10b981" height={100} />
                <div className="flex justify-between mt-2">
                  {(revLabels.length ? revLabels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map((d) => (
                    <span key={d} className="text-[9px] text-[#5c5d72]">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PieChart size={14} className="text-violet-400" />
                  Business metrics
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8b8ca8]">Monthly revenue</span>
                    <span className="text-white font-semibold">{stats.monthlyRevenueLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b8ca8]">Platform commission</span>
                    <span className="text-emerald-400 font-semibold">{stats.platformCommissionLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b8ca8]">Premium users</span>
                    <span className="text-white font-semibold">{stats.premiumUserCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b8ca8]">Refunds processed</span>
                    <span className="text-amber-400 font-semibold">{stats.refundCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2d2e3e] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Transaction History</h3>
              {stats.failedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setViewTab('transactions')
                    setTxFilter('failed')
                  }}
                  className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <AlertTriangle size={12} />
                  {stats.failedCount} failed
                </button>
              )}
            </div>
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-violet-400" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-16 text-center text-sm text-[#5c5d72]">
                No transactions. Restart payment-service with local profile to seed demo data.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#2d2e3e] bg-[#12131c]">
                    {['TXN ID', 'From', 'To', 'Amount', 'Type', 'Commission', 'Status', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1d2a]">
                  {transactions.slice(0, viewTab === 'overview' ? 8 : undefined).map((t) => (
                    <TransactionRow
                      key={t.id}
                      tx={t}
                      onRefund={() => handleRefund(t.id)}
                      onRetry={() => handleRetry(t.id)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {viewTab === 'payouts' && (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2d2e3e]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wallet size={14} className="text-amber-400" />
              Mentor payouts
            </h3>
            <p className="text-[10px] text-[#5c5d72] mt-1">70% mentor share after platform commission</p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2d2e3e] bg-[#12131c]">
                {['Payout ID', 'Mentor', 'Amount', 'Status', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1d2a]">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-[#1c1d2a]/50">
                  <td className="px-4 py-3 text-[10px] font-mono text-[#5c5d72]">{p.payoutCode}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Av name={p.mentorDisplayName} size={24} />
                      <span className="text-xs text-white">{p.mentorDisplayName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-white">{p.amountLabel}</td>
                  <td className="px-4 py-3">
                    <Pill color={p.status === 'completed' ? 'green' : p.status === 'failed' ? 'red' : 'amber'}>
                      {p.status}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-[#5c5d72]">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handlePayout(p.id)}
                        className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <CheckCircle2 size={12} /> Process
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewTab === 'subscriptions' && (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2d2e3e]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users size={14} className="text-cyan-400" />
              Premium subscriptions
            </h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2d2e3e] bg-[#12131c]">
                {['User', 'Plan', 'Amount', 'Status', 'Renews'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1d2a]">
              {subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-[#1c1d2a]/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Av name={s.username} size={24} />
                      <span className="text-xs text-white">{s.username}</span>
                      {s.premium && <Pill color="cyan">Premium</Pill>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#a5a6bb]">{s.planName}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-violet-300">{s.amountLabel}</td>
                  <td className="px-4 py-3">
                    <Pill color={s.status === 'active' ? 'green' : 'gray'}>{s.status}</Pill>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-[#5c5d72]">
                    {s.renewsAt ? new Date(s.renewsAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TransactionRow({
  tx,
  onRefund,
  onRetry,
}: {
  tx: FinancialTransaction
  onRefund: () => void
  onRetry: () => void
}) {
  return (
    <tr className="hover:bg-[#1c1d2a]/50">
      <td className="px-4 py-3 text-[10px] text-[#5c5d72] font-mono">{tx.transactionCode}</td>
      <td className="px-4 py-3 text-xs text-[#8b8ca8]">{tx.payerDisplayName}</td>
      <td className="px-4 py-3 text-xs text-white max-w-[160px] truncate">{tx.payeeDisplayName}</td>
      <td className="px-4 py-3 text-xs font-bold text-white">{tx.amountLabel}</td>
      <td className="px-4 py-3">
        <Pill color={TX_TYPE_COLORS[tx.transactionType] ?? 'gray'}>{tx.typeLabel}</Pill>
      </td>
      <td className="px-4 py-3 text-[10px] text-[#8b8ca8]">{tx.commissionLabel}</td>
      <td className="px-4 py-3">
        <Pill color={TX_STATUS_COLORS[tx.status] ?? 'gray'}>{tx.statusLabel}</Pill>
      </td>
      <td className="px-4 py-3 text-[10px] text-[#5c5d72]">{tx.dateLabel}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button type="button" className="text-[#5c5d72] hover:text-white p-1" title="View">
            <Eye size={12} />
          </button>
          {tx.status === 'failed' && (
            <button type="button" onClick={onRetry} className="text-[#5c5d72] hover:text-blue-400 p-1" title="Retry">
              <RefreshCw size={12} />
            </button>
          )}
          {tx.status === 'completed' && tx.transactionType === 'payment' && (
            <button type="button" onClick={onRefund} className="text-[#5c5d72] hover:text-amber-400 p-1" title="Refund">
              <RotateCcw size={12} />
            </button>
          )}
          {tx.transactionType === 'refund' && (
            <Pill color="amber">Refund</Pill>
          )}
        </div>
      </td>
    </tr>
  )
}
