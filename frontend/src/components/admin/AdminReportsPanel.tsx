import { useState } from 'react'
import {
  Flag,
  RefreshCw,
  Search,
  Loader2,
  Shield,
  AlertTriangle,
  Eye,
  Ban,
  Trash2,
  MessageSquareWarning,
  Clock,
} from 'lucide-react'
import {
  useListAdminReportsQuery,
  useGetReportAnalyticsQuery,
  useMarkReportUnderReviewMutation,
  useEscalateReportMutation,
  useApplyReportActionMutation,
  REPORT_CATEGORY_COLORS,
  REPORT_STATUS_COLORS,
  type PlatformReport,
  type ReportAnalytics,
} from '../../api/adminReportsApi'
import { useToggleUserEnabledMutation } from '../../api/adminApi'
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
    gray: 'bg-[#2d2e3e] text-[#8b8ca8]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[color] ?? map.gray}`}>
      {children}
    </span>
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

type StatusFilter = 'all' | 'pending' | 'under_review' | 'resolved' | 'escalated'
type CategoryFilter = 'all' | 'harassment' | 'spam' | 'fake_profile' | 'abusive_language' | 'scam_attempt'

type TargetTypeFilter = 'all' | 'user' | 'post' | 'room' | 'message'

function ReportDetailModal({
  report,
  onClose,
  onDone,
}: {
  report: PlatformReport
  onClose: () => void
  onDone: (type: 'success' | 'error', msg: string) => void
}) {
  const [note, setNote] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)
  const [markReview] = useMarkReportUnderReviewMutation()
  const [escalateReport, { isLoading: escalating }] = useEscalateReportMutation()
  const [applyAction, { isLoading }] = useApplyReportActionMutation()
  const [toggleEnabled] = useToggleUserEnabledMutation()

  const isOpen = report.status === 'pending' || report.status === 'under_review' || report.status === 'escalated'
  const banTargetId = report.banTargetAccountId ?? report.targetAccountId
  const canBan = report.targetType === 'user' || report.targetType === 'post' || !!banTargetId
  const canRemoveContent = report.targetType === 'post'

  async function runAction(action: string) {
    setModalError(null)
    try {
      const updated = await applyAction({ id: report.id, action, note: note.trim() || undefined }).unwrap()
      if (action === 'temp_ban' || action === 'permanent_ban') {
        const accountId = updated.banTargetAccountId
        if (!accountId) {
          throw new Error('Report resolved but no auth account was linked for this ban.')
        }
        await toggleEnabled(accountId).unwrap()
      }
      onDone('success', `Action applied: ${updated.adminActionLabel ?? action}`)
      onClose()
    } catch (err) {
      const msg = extractApiError(err)
      setModalError(msg)
      onDone('error', msg)
    }
  }

  async function handleReview() {
    try {
      await markReview(report.id).unwrap()
      onDone('success', 'Marked under review')
      onClose()
    } catch (err) {
      onDone('error', extractApiError(err))
    }
  }

  async function handleEscalate() {
    try {
      await escalateReport(report.id).unwrap()
      onDone('success', 'Report escalated for priority review.')
      onClose()
    } catch (err) {
      onDone('error', extractApiError(err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#2d2e3e] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">{report.reportCode}</h3>
            <p className="text-xs text-[#8b8ca8] mt-0.5">Safety & trust review</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Pill color={REPORT_CATEGORY_COLORS[report.category] ?? 'gray'}>{report.categoryLabel}</Pill>
            <Pill color={REPORT_STATUS_COLORS[report.status] ?? 'gray'}>{report.statusLabel}</Pill>
            <Pill color="blue">{report.targetTypeLabel}</Pill>
          </div>
          <div className="p-4 rounded-xl bg-[#12131c] border border-[#2d2e3e] space-y-2 text-xs">
            <p><span className="text-[#5c5d72]">Target:</span> <span className="text-white">{report.targetSummary}</span></p>
            <p><span className="text-[#5c5d72]">Reporter:</span> <span className="text-white">@{report.reporterUsername}</span></p>
            <p><span className="text-[#5c5d72]">Filed:</span> <span className="text-white">{report.dateLabel}</span></p>
            {report.details && <p className="text-[#a5a6bb] italic pt-2">"{report.details}"</p>}
          </div>
          {report.adminAction && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              Resolved: {report.adminActionLabel}
              {report.adminNote && <p className="mt-1 text-[#8b8ca8]">{report.adminNote}</p>}
            </div>
          )}
          {modalError && (
            <AlertBanner type="error" message={modalError} onDismiss={() => setModalError(null)} />
          )}
          {isOpen && (
            <>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Admin note (optional)…"
                className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-[#818cf8]"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => runAction('warning')}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 disabled:opacity-50"
                >
                  <MessageSquareWarning size={14} /> Warning
                </button>
                <button
                  type="button"
                  disabled={isLoading || !canRemoveContent}
                  title={canRemoveContent ? undefined : 'Only available for post reports'}
                  onClick={() => runAction('content_removal')}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold disabled:opacity-50"
                >
                  <Trash2 size={14} /> Remove content
                </button>
                <button
                  type="button"
                  disabled={isLoading || !canBan}
                  title={canBan ? undefined : 'No user account linked to this report'}
                  onClick={() => runAction('temp_ban')}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-semibold disabled:opacity-50"
                >
                  <Clock size={14} /> Temp ban
                </button>
                <button
                  type="button"
                  disabled={isLoading || !canBan}
                  title={canBan ? undefined : 'No user account linked to this report'}
                  onClick={() => runAction('permanent_ban')}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold disabled:opacity-50"
                >
                  <Ban size={14} /> Permanent ban
                </button>
              </div>
              {report.status === 'pending' && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleReview}
                  className="w-full py-2 rounded-lg border border-[#2d2e3e] text-xs text-[#8b8ca8] hover:text-white"
                >
                  Mark under review
                </button>
              )}
              {(report.status === 'pending' || report.status === 'under_review') && (
                <button
                  type="button"
                  disabled={escalating}
                  onClick={handleEscalate}
                  className="w-full py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300 hover:bg-red-500/20"
                >
                  Escalate report
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminReportsPanel({ variant = 'reports' }: { variant?: 'reports' | 'reported-items' }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [targetTypeFilter, setTargetTypeFilter] = useState<TargetTypeFilter>('all')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<PlatformReport | null>(null)
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const { data: reports = [], isLoading, isFetching, refetch } = useListAdminReportsQuery(
    {
      status: statusFilter,
      category: categoryFilter,
      targetType: targetTypeFilter,
      q: search,
    },
    { pollingInterval: 15000 }
  )
  const { data: analytics } = useGetReportAnalyticsQuery()

  const stats: ReportAnalytics = analytics ?? {
    totalReports: reports.length,
    pendingCount: 0,
    underReviewCount: 0,
    resolvedCount: 0,
    escalatedCount: 0,
    reportsByCategory: {},
  }

  const pendingUrgent = stats.pendingCount + stats.escalatedCount

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flag size={20} className="text-violet-400" />
            {variant === 'reported-items' ? 'Reported Items' : 'Abuse Reports'}
          </h2>
          <p className="text-xs text-[#8b8ca8] mt-1">
            {stats.totalReports} reports · users, messages, rooms & content · centralized complaints queue
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

      {banner && (
        <div className="mb-4">
          <AlertBanner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />
        </div>
      )}

      {pendingUrgent > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25">
          <Shield size={16} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-200">
            <span className="font-semibold">{pendingUrgent} report(s)</span> need attention for platform safety
          </p>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className="ml-auto text-[10px] font-semibold text-red-300 hover:text-white shrink-0"
          >
            Review now
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { l: 'Total', v: stats.totalReports, c: 'gray' },
          { l: 'Pending', v: stats.pendingCount, c: 'amber' },
          { l: 'Under review', v: stats.underReviewCount, c: 'blue' },
          { l: 'Resolved', v: stats.resolvedCount, c: 'green' },
          { l: 'Escalated', v: stats.escalatedCount, c: 'red' },
        ].map((s) => (
          <div key={s.l} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{s.v}</p>
            <Pill color={s.c}>{s.l}</Pill>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['all', 'pending', 'under_review', 'resolved', 'escalated'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
              statusFilter === s
                ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200'
                : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
        <div className="w-px h-6 bg-[#2d2e3e] mx-1" />
        {(['all', 'harassment', 'spam', 'fake_profile', 'abusive_language', 'scam_attempt'] as CategoryFilter[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
              categoryFilter === c
                ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200'
                : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {c === 'all' ? 'All types' : c.replace('_', ' ')}
          </button>
        ))}
        <div className="w-px h-6 bg-[#2d2e3e] mx-1" />
        {(['all', 'user', 'post', 'room', 'message'] as TargetTypeFilter[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTargetTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
              targetTypeFilter === t
                ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200'
                : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {t === 'all' ? 'All targets' : t}
          </button>
        ))}
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reports, targets, reporters…"
          className="w-full bg-[#12131c] border border-[#2d2e3e] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#818cf8]"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-12 text-center">
          <Flag size={40} className="mx-auto text-[#2d2e3e] mb-3" />
          <p className="text-sm font-semibold text-white">No reports yet</p>
          <p className="text-xs text-[#5c5d72] mt-2">Restart user-service with local profile to seed demo reports.</p>
        </div>
      ) : (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2d2e3e] bg-[#12131c]">
                {['Report ID', 'Type', 'Target', 'Category', 'Reporter', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1d2a]">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-[#1c1d2a]/50">
                  <td className="px-4 py-3 text-[10px] font-mono text-[#5c5d72]">{r.reportCode}</td>
                  <td className="px-4 py-3">
                    <Pill color={r.targetType === 'user' ? 'blue' : r.targetType === 'post' ? 'purple' : 'gray'}>
                      {r.targetTypeLabel}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-xs text-white max-w-[140px] truncate">{r.targetSummary}</td>
                  <td className="px-4 py-3">
                    <Pill color={REPORT_CATEGORY_COLORS[r.category] ?? 'gray'}>{r.categoryLabel}</Pill>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8b8ca8]">@{r.reporterUsername}</td>
                  <td className="px-4 py-3">
                    <Pill color={REPORT_STATUS_COLORS[r.status] ?? 'gray'}>{r.statusLabel}</Pill>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-[#5c5d72]">{r.dateLabel}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDetail(r)}
                      className="text-[#5c5d72] hover:text-white p-1"
                      title="Review & act"
                    >
                      <Eye size={14} />
                    </button>
                    {(r.status === 'pending' || r.status === 'escalated') && (
                      <AlertTriangle size={12} className="inline ml-1 text-amber-400" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <ReportDetailModal
          report={detail}
          onClose={() => setDetail(null)}
          onDone={(type, msg) => {
            setBanner({ type, message: msg })
            if (type === 'success') refetch()
          }}
        />
      )}
    </div>
  )
}
