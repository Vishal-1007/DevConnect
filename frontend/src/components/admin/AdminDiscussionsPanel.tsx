import { useMemo, useState } from 'react'
import {
  MessageSquare,
  RefreshCw,
  Search,
  Loader2,
  Pin,
  PinOff,
  Trash2,
  RotateCcw,
  CheckCheck,
  MessageCircle,
  ShieldAlert,
} from 'lucide-react'
import {
  useListAdminDiscussionsQuery,
  useGetDiscussionAnalyticsQuery,
  useToggleDiscussionPinMutation,
  useRemoveAdminDiscussionMutation,
  useRestoreAdminDiscussionMutation,
  type AdminDiscussionThread,
} from '../../api/adminDiscussionsApi'
import { DISCUSSION_TOPICS, topicLabels } from '../../data/discussionsData'
import { extractApiError } from '../../lib/extractApiError'

const PALETTE = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#0891b2']
const avatarColor = (s: string) => PALETTE[s.charCodeAt(0) % PALETTE.length]

type StatusFilter = 'active' | 'pinned' | 'removed' | 'all'

function Av({ name, size = 36 }: { name: string; size?: number }) {
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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl px-4 py-3 min-w-[120px]">
      <p className="text-[10px] uppercase tracking-wide text-[#5c5d72] font-semibold">{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
    </div>
  )
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmClass: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-md p-5 shadow-2xl">
        <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
        <p className="text-xs text-[#8b8ca8] mb-5 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${confirmClass}`}
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function DiscussionRow({
  thread,
  onPin,
  onRemove,
  onRestore,
  busyId,
}: {
  thread: AdminDiscussionThread
  onPin: (thread: AdminDiscussionThread) => void
  onRemove: (thread: AdminDiscussionThread) => void
  onRestore: (thread: AdminDiscussionThread) => void
  busyId: string | null
}) {
  const topicLabel = topicLabels[thread.topic] ?? thread.topic
  const busy = busyId === thread.id

  return (
    <div
      className={`bg-[#161722] border rounded-xl p-4 transition-colors ${
        thread.removed
          ? 'border-red-500/20 opacity-75'
          : thread.pinned
            ? 'border-amber-500/30 hover:border-amber-500/50'
            : 'border-[#2d2e3e] hover:border-[#3d3e52]'
      }`}
    >
      <div className="flex items-start gap-3">
        <Av name={thread.authorDisplayName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {thread.pinned && !thread.removed && (
              <Pill color="amber">
                <Pin size={10} />
                Pinned
              </Pill>
            )}
            {thread.solved && (
              <Pill color="green">
                <CheckCheck size={10} />
                Solved
              </Pill>
            )}
            {thread.removed && (
              <Pill color="red">
                <ShieldAlert size={10} />
                Removed
              </Pill>
            )}
            <p className="text-sm font-semibold text-white">{thread.title}</p>
            <Pill color="gray">{topicLabel}</Pill>
            <span className="ml-auto text-[10px] text-[#5c5d72]">
              {new Date(thread.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-[#8b8ca8] line-clamp-2 mb-2">{thread.content}</p>
          <div className="flex items-center gap-4 text-[10px] text-[#5c5d72] flex-wrap">
            <span className="flex items-center gap-1">
              <MessageCircle size={11} />
              {thread.replyCount} replies
            </span>
            <span>by {thread.authorDisplayName}</span>
            {thread.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="bg-[#2d2e3e] text-[#8b8ca8] px-1.5 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!thread.removed && (
            <button
              type="button"
              title={thread.pinned ? 'Unpin discussion' : 'Pin important discussion'}
              disabled={busy}
              onClick={() => onPin(thread)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                thread.pinned
                  ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                  : 'text-[#5c5d72] hover:text-amber-400 hover:bg-[#2d2e3e]'
              }`}
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : thread.pinned ? <PinOff size={13} /> : <Pin size={13} />}
            </button>
          )}
          {thread.removed ? (
            <button
              type="button"
              title="Restore discussion"
              disabled={busy}
              onClick={() => onRestore(thread)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-emerald-400 hover:bg-[#2d2e3e] transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
            </button>
          ) : (
            <button
              type="button"
              title="Remove spam / moderate"
              disabled={busy}
              onClick={() => onRemove(thread)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-red-400 hover:bg-[#2d2e3e] transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminDiscussionsPanel() {
  const [status, setStatus] = useState<StatusFilter>('active')
  const [topic, setTopic] = useState('all')
  const [query, setQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [confirm, setConfirm] = useState<{ action: 'remove' | 'restore'; thread: AdminDiscussionThread } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data: analytics } = useGetDiscussionAnalyticsQuery()
  const { data: threads, isLoading, isFetching, refetch } = useListAdminDiscussionsQuery({
    status,
    topic,
    q: query,
    limit: 100,
  })

  const [togglePin] = useToggleDiscussionPinMutation()
  const [removeDiscussion, { isLoading: removing }] = useRemoveAdminDiscussionMutation()
  const [restoreDiscussion, { isLoading: restoring }] = useRestoreAdminDiscussionMutation()

  const visible = useMemo(() => threads ?? [], [threads])

  const statusTabs: { id: StatusFilter; label: string; count?: number }[] = [
    { id: 'active', label: 'Active', count: analytics?.activeThreads },
    { id: 'pinned', label: 'Pinned', count: analytics?.pinnedThreads },
    { id: 'removed', label: 'Removed', count: analytics?.removedThreads },
    { id: 'all', label: 'All', count: analytics?.totalThreads },
  ]

  async function handlePin(thread: AdminDiscussionThread) {
    setBusyId(thread.id)
    setBanner(null)
    try {
      const updated = await togglePin(thread.id).unwrap()
      setBanner({
        type: 'success',
        message: updated.pinned
          ? `"${thread.title}" pinned to the top of the forum.`
          : `"${thread.title}" unpinned.`,
      })
    } catch (err) {
      setBanner({ type: 'error', message: extractApiError(err) })
    } finally {
      setBusyId(null)
    }
  }

  async function handleConfirm() {
    if (!confirm) return
    setBusyId(confirm.thread.id)
    setBanner(null)
    try {
      if (confirm.action === 'remove') {
        await removeDiscussion(confirm.thread.id).unwrap()
        setBanner({
          type: 'success',
          message: `"${confirm.thread.title}" removed from public view.`,
        })
      } else {
        await restoreDiscussion(confirm.thread.id).unwrap()
        setBanner({
          type: 'success',
          message: `"${confirm.thread.title}" restored and visible again.`,
        })
      }
      setConfirm(null)
    } catch (err) {
      setBanner({
        type: 'error',
        message: extractApiError(err),
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Discussions</h2>
          <p className="text-xs text-[#5c5d72] mt-0.5">
            Moderate forum threads — pin important posts and remove spam
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white transition-colors"
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {banner && (
        <div
          className={`mb-4 flex items-start justify-between gap-3 px-4 py-3 rounded-lg text-xs border ${
            banner.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <p>{banner.message}</p>
          <button type="button" onClick={() => setBanner(null)} className="text-[#8b8ca8] hover:text-white shrink-0">
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
        <StatCard label="Active" value={analytics?.activeThreads ?? 0} color="#34d399" />
        <StatCard label="Pinned" value={analytics?.pinnedThreads ?? 0} color="#fbbf24" />
        <StatCard label="Removed" value={analytics?.removedThreads ?? 0} color="#f87171" />
        <StatCard label="Solved" value={analytics?.solvedThreads ?? 0} color="#818cf8" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setQuery(searchInput.trim())}
            placeholder="Search discussions by title or content…"
            className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#818cf8]"
          />
        </div>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#818cf8]"
        >
          {DISCUSSION_TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setQuery(searchInput.trim())}
          className="px-4 py-2.5 rounded-lg bg-[#818cf8] hover:bg-[#6366f1] text-white text-xs font-bold transition-colors"
        >
          Search
        </button>
      </div>

      <div className="flex gap-1 mb-5 bg-[#161722] border border-[#2d2e3e] rounded-lg p-1 w-fit">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatus(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              status === tab.id
                ? 'bg-[#818cf8] text-white'
                : 'text-[#8b8ca8] hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#818cf8]" />
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl flex flex-col items-center py-20 gap-3">
          <MessageSquare size={40} className="text-[#2d2e3e]" />
          <p className="text-sm text-[#5c5d72]">No discussions match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] text-[#5c5d72] uppercase tracking-wide font-semibold">
            {visible.length} discussion{visible.length === 1 ? '' : 's'}
          </p>
          {visible.map((thread) => (
            <DiscussionRow
              key={thread.id}
              thread={thread}
              onPin={handlePin}
              onRemove={(t) => setConfirm({ action: 'remove', thread: t })}
              onRestore={(t) => setConfirm({ action: 'restore', thread: t })}
              busyId={busyId}
            />
          ))}
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.action === 'remove' ? 'Remove discussion?' : 'Restore discussion?'}
          message={
            confirm.action === 'remove'
              ? `"${confirm.thread.title}" will be hidden from the public forum. You can restore it later from the Removed tab.`
              : `"${confirm.thread.title}" will become visible again in the public forum.`
          }
          confirmLabel={confirm.action === 'remove' ? 'Remove' : 'Restore'}
          confirmClass={
            confirm.action === 'remove'
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
          loading={removing || restoring}
        />
      )}
    </div>
  )
}
