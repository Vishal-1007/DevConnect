import { useState } from 'react'
import {
  AlertTriangle,
  CheckCheck,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import {
  useListUserWarningsQuery,
  useGetWarningAnalyticsQuery,
  useCreateUserWarningMutation,
  useAcknowledgeUserWarningMutation,
  useDeleteUserWarningMutation,
  DEFAULT_WARNING_MESSAGE,
} from '../../api/adminWarningsApi'
import { useListUsersQuery } from '../../api/adminApi'
import { extractApiError } from '../../lib/extractApiError'

const SEV_COLOR: Record<string, string> = { low: 'blue', medium: 'amber', high: 'red' }

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    green: 'bg-emerald-500/15 text-emerald-400',
    red: 'bg-red-500/15 text-red-400',
    amber: 'bg-amber-500/15 text-amber-400',
    blue: 'bg-blue-500/15 text-blue-400',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[color] ?? map.gray}`}>
      {children}
    </span>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl px-4 py-3 min-w-[100px]">
      <p className="text-[10px] uppercase tracking-wide text-[#5c5d72] font-semibold">{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
    </div>
  )
}

export function AdminWarningsPanel() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'unacknowledged' | 'acknowledged'>('all')
  const [showForm, setShowForm] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [form, setForm] = useState({
    accountId: '',
    message: DEFAULT_WARNING_MESSAGE,
    reason: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
  })

  const { data: users } = useListUsersQuery()
  const { data: warnings, isLoading, refetch, isFetching } = useListUserWarningsQuery({ status: statusFilter })
  const { data: analytics } = useGetWarningAnalyticsQuery()
  const [createWarning, { isLoading: creating }] = useCreateUserWarningMutation()
  const [acknowledge] = useAcknowledgeUserWarningMutation()
  const [deleteWarning] = useDeleteUserWarningMutation()

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const user = (users ?? []).find((u) => u.id === form.accountId)
    if (!user || !form.reason.trim()) return
    try {
      await createWarning({
        accountId: user.id,
        username: user.username,
        message: form.message.trim() || DEFAULT_WARNING_MESSAGE,
        reason: form.reason.trim(),
        severity: form.severity,
      }).unwrap()
      showToast('success', `Warning issued to @${user.username}.`)
      setShowForm(false)
      setForm({ accountId: '', message: DEFAULT_WARNING_MESSAGE, reason: '', severity: 'medium' })
    } catch (err) {
      showToast('error', extractApiError(err))
    }
  }

  async function handleAck(id: string) {
    setBusyId(id)
    try {
      await acknowledge(id).unwrap()
      showToast('success', 'Warning marked acknowledged.')
    } catch (err) {
      showToast('error', extractApiError(err))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id)
    try {
      await deleteWarning(id).unwrap()
      showToast('success', 'Warning removed.')
    } catch (err) {
      showToast('error', extractApiError(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-400" />
            Warnings
          </h2>
          <p className="text-xs text-[#8b8ca8] mt-1">
            Soft moderation — notify users before escalating to bans
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => refetch()} className="p-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white">
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-500"
          >
            <Plus size={12} /> Issue Warning
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
        <StatCard label="Total" value={analytics?.totalWarnings ?? 0} color="#818cf8" />
        <StatCard label="Unacknowledged" value={analytics?.unacknowledgedWarnings ?? 0} color="#fbbf24" />
        <StatCard label="High Severity" value={analytics?.highSeverityWarnings ?? 0} color="#f87171" />
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'unacknowledged', 'acknowledged'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
              statusFilter === s ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200' : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Issue Warning</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
            </div>
            <select
              required
              value={form.accountId}
              onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="">Select user…</option>
              {(users ?? []).map((u) => (
                <option key={u.id} value={u.id}>@{u.username}</option>
              ))}
            </select>
            <select
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as 'low' | 'medium' | 'high' }))}
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="low">Low severity</option>
              <option value="medium">Medium severity</option>
              <option value="high">High severity</option>
            </select>
            <input
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white"
            />
            <textarea
              required
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              rows={3}
              placeholder="Specific violation reason…"
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white resize-none"
            />
            <button type="submit" disabled={creating} className="w-full py-2.5 rounded-lg bg-amber-600 text-white text-xs font-bold disabled:opacity-50">
              {creating ? 'Sending…' : 'Send Warning Notice'}
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-violet-400" /></div>
      ) : !warnings?.length ? (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-12 text-center">
          <AlertTriangle size={40} className="mx-auto text-[#2d2e3e] mb-3" />
          <p className="text-sm font-semibold text-white">No warnings issued</p>
          <p className="text-xs text-[#5c5d72] mt-2">Issue a soft notice before banning a user.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {warnings.map((w) => (
            <div
              key={w.id}
              className={`bg-[#161722] border rounded-xl p-4 transition-colors ${
                w.acknowledged ? 'border-[#1e1f2e] opacity-75' : 'border-amber-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  w.severity === 'high' ? 'bg-red-500/15' : w.severity === 'medium' ? 'bg-amber-500/15' : 'bg-blue-500/15'
                }`}>
                  <AlertTriangle size={16} className={w.severity === 'high' ? 'text-red-400' : w.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-white">@{w.username}</span>
                    <Pill color={SEV_COLOR[w.severity] ?? 'gray'}>{w.severityLabel} severity</Pill>
                    {w.acknowledged && <Pill color="green">Acknowledged</Pill>}
                    <span className="ml-auto text-[10px] text-[#5c5d72]">{new Date(w.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-amber-200/90 mb-1">{w.message}</p>
                  <p className="text-xs text-[#8b8ca8]">{w.reason}</p>
                  <p className="text-[10px] text-[#5c5d72] mt-1">Issued by @{w.issuedByUsername}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!w.acknowledged && (
                    <button
                      type="button"
                      disabled={busyId === w.id}
                      onClick={() => handleAck(w.id)}
                      title="Mark acknowledged"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-emerald-400 hover:bg-[#2d2e3e] disabled:opacity-50"
                    >
                      {busyId === w.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === w.id}
                    onClick={() => handleDelete(w.id)}
                    title="Delete"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-red-400 hover:bg-[#2d2e3e] disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold ${
          toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-red-500/15 border-red-500/30 text-red-400'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
