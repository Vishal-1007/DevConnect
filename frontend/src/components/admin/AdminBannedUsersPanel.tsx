import { useMemo, useState } from 'react'
import {
  Ban,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react'
import {
  useListUserBansQuery,
  useGetBanAnalyticsQuery,
  useCreateUserBanMutation,
  useRestoreUserBanMutation,
} from '../../api/adminBansApi'
import { useListUsersQuery, useToggleUserEnabledMutation } from '../../api/adminApi'
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
    orange: 'bg-orange-500/15 text-orange-400',
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

export function AdminBannedUsersPanel() {
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active')
  const [showForm, setShowForm] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [form, setForm] = useState({
    accountId: '',
    banType: 'temporary' as 'temporary' | 'permanent',
    reason: '',
    durationDays: '7',
  })

  const { data: users } = useListUsersQuery()
  const { data: bans, isLoading, refetch, isFetching } = useListUserBansQuery({ status: statusFilter })
  const { data: analytics } = useGetBanAnalyticsQuery()
  const [createBan, { isLoading: creating }] = useCreateUserBanMutation()
  const [restoreBan] = useRestoreUserBanMutation()
  const [toggleEnabled] = useToggleUserEnabledMutation()

  const userMap = useMemo(() => new Map((users ?? []).map((u) => [u.id, u])), [users])
  const availableUsers = (users ?? []).filter(
    (u) => u.enabled && !(bans ?? []).some((b) => b.active && b.accountId === u.id)
  )

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleCreateBan(e: React.FormEvent) {
    e.preventDefault()
    const user = userMap.get(form.accountId)
    if (!user || !form.reason.trim()) return
    try {
      await createBan({
        accountId: user.id,
        username: user.username,
        banType: form.banType,
        reason: form.reason.trim(),
        durationDays: form.banType === 'temporary' ? Number(form.durationDays) || 7 : undefined,
      }).unwrap()
      if (user.enabled) {
        await toggleEnabled(user.id).unwrap()
      }
      showToast('success', `@${user.username} has been banned.`)
      setShowForm(false)
      setForm({ accountId: '', banType: 'temporary', reason: '', durationDays: '7' })
    } catch (err) {
      showToast('error', extractApiError(err))
    }
  }

  async function handleRestore(banId: string, accountId: string) {
    setBusyId(banId)
    try {
      await restoreBan({ id: banId }).unwrap()
      const user = userMap.get(accountId)
      if (user && !user.enabled) {
        await toggleEnabled(accountId).unwrap()
      }
      showToast('success', 'Account restored successfully.')
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
            <Ban size={20} className="text-red-400" />
            Banned Users
          </h2>
          <p className="text-xs text-[#8b8ca8] mt-1">
            Manage blocked accounts, suspensions, and repeat offenders
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
            <Plus size={12} /> Ban User
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
        <StatCard label="Active Bans" value={analytics?.activeBans ?? 0} color="#f87171" />
        <StatCard label="Permanent" value={analytics?.permanentBans ?? 0} color="#ef4444" />
        <StatCard label="Temporary" value={analytics?.temporaryBans ?? 0} color="#fb923c" />
        <StatCard label="Repeat Offenders" value={analytics?.repeatedOffenders ?? 0} color="#a78bfa" />
      </div>

      <div className="flex gap-2 mb-4">
        {(['active', 'all'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
              statusFilter === s ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200' : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {s === 'active' ? 'Active bans' : 'All history'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleCreateBan} className="bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-md p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Ban User</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
            </div>
            <select
              required
              value={form.accountId}
              onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="">Select user…</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>@{u.username} · {u.email}</option>
              ))}
            </select>
            <select
              value={form.banType}
              onChange={(e) => setForm((f) => ({ ...f, banType: e.target.value as 'temporary' | 'permanent' }))}
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="temporary">Temporary suspension</option>
              <option value="permanent">Permanent ban</option>
            </select>
            {form.banType === 'temporary' && (
              <input
                type="number"
                min={1}
                max={365}
                value={form.durationDays}
                onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
                placeholder="Duration (days)"
                className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white"
              />
            )}
            <textarea
              required
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              rows={3}
              placeholder="Ban reason…"
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white resize-none"
            />
            <button type="submit" disabled={creating} className="w-full py-2.5 rounded-lg bg-red-600 text-white text-xs font-bold disabled:opacity-50">
              {creating ? 'Banning…' : 'Confirm Ban'}
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-violet-400" /></div>
      ) : !bans?.length ? (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-12 text-center">
          <Ban size={40} className="mx-auto text-[#2d2e3e] mb-3" />
          <p className="text-sm font-semibold text-white">No banned users</p>
          <p className="text-xs text-[#5c5d72] mt-2">Active bans and suspension history will appear here.</p>
        </div>
      ) : (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2d2e3e] bg-[#12131c]">
                {['User', 'Ban Type', 'Reason', 'Duration', 'Offenses', 'Banned By', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5d72]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1d2a]">
              {bans.map((ban) => (
                <tr key={ban.id} className={`hover:bg-[#1c1d2a]/50 ${!ban.active ? 'opacity-70' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Av name={ban.username} size={28} />
                      <div>
                        <p className="text-xs font-semibold text-white">@{ban.username}</p>
                        {ban.repeatedOffender && <Pill color="purple">Repeat offender</Pill>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Pill color={ban.banType === 'permanent' ? 'red' : 'orange'}>{ban.banTypeLabel}</Pill>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#a5a6bb] max-w-[180px] truncate">{ban.reason}</td>
                  <td className="px-4 py-3 text-[10px] text-[#8b8ca8]">
                    <span className="inline-flex items-center gap-1"><Clock size={10} /> {ban.durationLabel}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white">{ban.offenseCount}</td>
                  <td className="px-4 py-3 text-[10px] text-[#5c5d72]">@{ban.bannedByUsername}</td>
                  <td className="px-4 py-3">
                    {ban.active ? (
                      <button
                        type="button"
                        disabled={busyId === ban.id}
                        onClick={() => handleRestore(ban.id, ban.accountId)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {busyId === ban.id ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
                        Restore
                      </button>
                    ) : (
                      <Pill color="gray">Restored</Pill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold ${
          toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-red-500/15 border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <UserCheck size={14} /> : <ShieldAlert size={14} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
