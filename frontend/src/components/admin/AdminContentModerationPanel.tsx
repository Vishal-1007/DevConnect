import { useMemo, useState } from 'react'
import {
  Bot,
  CheckCircle2,
  Flag,
  Loader2,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react'
import {
  useListModeratedPostsQuery,
  useGetContentModerationAnalyticsQuery,
  useFlagModeratedPostMutation,
  useUnflagModeratedPostMutation,
  useRemoveModeratedPostMutation,
  useRestoreModeratedPostMutation,
  useScanModeratedPostMutation,
  useScanAllModeratedPostsMutation,
  type AdminModeratedPost,
} from '../../api/adminContentModerationApi'
import {
  MODERATION_CATEGORIES,
  categoryLabels,
  categoryColors,
  statusLabels,
  statusColors,
  type ModerationCategory,
} from '../../data/contentModerationData'
import { extractApiError } from '../../lib/extractApiError'

const PALETTE = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#0891b2']
const avatarColor = (s: string) => PALETTE[s.charCodeAt(0) % PALETTE.length]

type StatusFilter = 'active' | 'flagged' | 'auto_flagged' | 'removed' | 'clear' | 'all'

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
          <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white transition-colors">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${confirmClass}`}>
            {loading && <Loader2 size={12} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function PostRow({
  post,
  onFlag,
  onUnflag,
  onRemove,
  onRestore,
  onScan,
  busyId,
}: {
  post: AdminModeratedPost
  onFlag: (post: AdminModeratedPost) => void
  onUnflag: (post: AdminModeratedPost) => void
  onRemove: (post: AdminModeratedPost) => void
  onRestore: (post: AdminModeratedPost) => void
  onScan: (post: AdminModeratedPost) => void
  busyId: string | null
}) {
  const busy = busyId === post.id
  const statusColor = statusColors[post.moderationStatus] ?? 'gray'

  return (
    <div
      className={`bg-[#161722] border rounded-xl p-4 transition-colors ${
        post.removed
          ? 'border-red-500/20 opacity-80'
          : post.flagged
            ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-[#2d2e3e] hover:border-[#3d3e52]'
      }`}
    >
      <div className="flex items-start gap-3">
        <Av name={post.authorDisplayName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold text-white">{post.authorDisplayName}</span>
            {post.authorRole && <Pill color="gray">{post.authorRole}</Pill>}
            <Pill color="blue">{post.category}</Pill>
            <Pill color={statusColor}>{statusLabels[post.moderationStatus] ?? post.moderationStatus}</Pill>
            {post.autoFlagged && (
              <Pill color="purple">
                <Bot size={10} />
                AI Flagged
              </Pill>
            )}
            {post.flagged && !post.autoFlagged && (
              <Pill color="amber">
                <Flag size={10} />
                Manual Flag
              </Pill>
            )}
            <span className="ml-auto text-[10px] text-[#5c5d72]">{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-xs text-[#a5a6bb] leading-relaxed mb-2">{post.content}</p>
          {post.moderationNote && (
            <p className="text-[10px] text-amber-400/90 mb-2 flex items-start gap-1.5">
              <Sparkles size={11} className="shrink-0 mt-0.5" />
              {post.moderationNote}
            </p>
          )}
          <div className="flex items-center gap-3 flex-wrap text-[10px] text-[#5c5d72]">
            <span className="flex items-center gap-1"><ThumbsUp size={11} /> {post.likeCount}</span>
            <span className="flex items-center gap-1"><MessageCircle size={11} /> {post.commentCount}</span>
            {post.moderationFlags.map((flag) => (
              <Pill key={flag} color={categoryColors[flag as ModerationCategory | 'manual_review'] ?? 'gray'}>
                {categoryLabels[flag as ModerationCategory | 'manual_review'] ?? flag}
              </Pill>
            ))}
            {post.tags.slice(0, 3).map((t) => (
              <span key={t} className="bg-[#2d2e3e] text-[#8b8ca8] px-1.5 py-0.5 rounded">#{t}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!post.removed && (
            <>
              <button
                type="button"
                title="Re-run AI scan"
                disabled={busy}
                onClick={() => onScan(post)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-violet-400 hover:bg-[#2d2e3e] transition-colors disabled:opacity-50"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <ScanLine size={13} />}
              </button>
              <button
                type="button"
                title={post.flagged ? 'Clear flag' : 'Flag post'}
                disabled={busy}
                onClick={() => (post.flagged ? onUnflag(post) : onFlag(post))}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                  post.flagged ? 'text-amber-400 bg-amber-500/15' : 'text-[#5c5d72] hover:text-amber-400 hover:bg-[#2d2e3e]'
                }`}
              >
                <Flag size={13} />
              </button>
            </>
          )}
          {post.removed ? (
            <button
              type="button"
              title="Restore post"
              disabled={busy}
              onClick={() => onRestore(post)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-emerald-400 hover:bg-[#2d2e3e] transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
            </button>
          ) : (
            <button
              type="button"
              title="Remove post"
              disabled={busy}
              onClick={() => onRemove(post)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#5c5d72] hover:text-red-400 hover:bg-[#2d2e3e] transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminContentModerationPanel() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<AdminModeratedPost | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const { data: analytics, refetch: refetchAnalytics } = useGetContentModerationAnalyticsQuery()
  const { data: posts, isLoading, refetch } = useListModeratedPostsQuery({
    status: statusFilter,
    category: categoryFilter,
    q: searchQuery,
    limit: 100,
  })

  const [flagPost] = useFlagModeratedPostMutation()
  const [unflagPost] = useUnflagModeratedPostMutation()
  const [removePost, { isLoading: removing }] = useRemoveModeratedPostMutation()
  const [restorePost] = useRestoreModeratedPostMutation()
  const [scanPost] = useScanModeratedPostMutation()
  const [scanAll, { isLoading: scanningAll }] = useScanAllModeratedPostsMutation()

  const tabs = useMemo(
    () => [
      { id: 'active' as StatusFilter, label: 'Active', count: analytics?.activePosts },
      { id: 'flagged' as StatusFilter, label: 'Flagged', count: analytics?.flaggedPosts },
      { id: 'auto_flagged' as StatusFilter, label: 'AI Detected', count: analytics?.autoFlaggedPosts },
      { id: 'removed' as StatusFilter, label: 'Removed', count: analytics?.removedPosts },
      { id: 'clear' as StatusFilter, label: 'Clear', count: analytics ? analytics.activePosts - analytics.flaggedPosts : undefined },
      { id: 'all' as StatusFilter, label: 'All', count: analytics?.totalPosts },
    ],
    [analytics]
  )

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  async function withBusy<T>(id: string, action: () => Promise<T>) {
    setBusyId(id)
    try {
      return await action()
    } catch (err) {
      showToast('error', extractApiError(err))
    } finally {
      setBusyId(null)
    }
  }

  async function handleScanAll() {
    try {
      const result = await scanAll().unwrap()
      showToast('success', `AI scan complete — ${result.flaggedPosts} flagged post(s) detected.`)
      refetchAnalytics()
    } catch (err) {
      showToast('error', extractApiError(err))
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Content Moderation</h2>
          <p className="text-xs text-[#5c5d72] mt-0.5">
            Monitor posts, detect harmful content with AI, and take action on abuse, spam, scams, and NSFW material.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => { refetch(); refetchAnalytics() }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white transition-colors"
          >
            <RefreshCw size={13} />
          </button>
          <button
            type="button"
            disabled={scanningAll}
            onClick={handleScanAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
          >
            {scanningAll ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
            Run AI Scan
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
        <StatCard label="Active" value={analytics?.activePosts ?? 0} color="#34d399" />
        <StatCard label="Flagged" value={analytics?.flaggedPosts ?? 0} color="#fbbf24" />
        <StatCard label="AI Detected" value={analytics?.autoFlaggedPosts ?? 0} color="#a78bfa" />
        <StatCard label="Removed" value={analytics?.removedPosts ?? 0} color="#f87171" />
        <StatCard label="Spam" value={analytics?.spam ?? 0} color="#fb923c" />
        <StatCard label="Abuse" value={analytics?.abusiveLanguage ?? 0} color="#ef4444" />
        <StatCard label="Scams" value={analytics?.scam ?? 0} color="#f97316" />
        <StatCard label="NSFW" value={analytics?.nsfw ?? 0} color="#c084fc" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(searchInput)}
            placeholder="Search content or author…"
            className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#818cf8]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#818cf8]"
        >
          <option value="all">All detection types</option>
          {MODERATION_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{categoryLabels[cat]}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setSearchQuery(searchInput)}
          className="px-3 py-2 rounded-lg text-xs font-bold bg-[#818cf8] text-white hover:bg-[#6366f1] transition-colors"
        >
          Search
        </button>
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === tab.id
                ? 'bg-[#818cf8] text-white'
                : 'bg-[#161722] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#818cf8]" /></div>
      ) : !posts?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#5c5d72]">
          <ShieldCheck size={40} className="mb-3 opacity-40" />
          <p className="text-sm font-semibold text-[#8b8ca8]">No content matches this filter</p>
          <p className="text-xs mt-1">Try a different status tab or run an AI scan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-wide text-[#5c5d72] font-semibold">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
          {posts.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              busyId={busyId}
              onFlag={(p) => withBusy(p.id, () => flagPost(p.id).unwrap().then(() => showToast('success', 'Post flagged for review.')))}
              onUnflag={(p) => withBusy(p.id, () => unflagPost(p.id).unwrap().then(() => showToast('success', 'Flag cleared.')))}
              onRemove={(p) => setConfirmRemove(p)}
              onRestore={(p) => withBusy(p.id, () => restorePost(p.id).unwrap().then(() => showToast('success', 'Post restored.')))}
              onScan={(p) => withBusy(p.id, () => scanPost(p.id).unwrap().then((r) => showToast('success', r.flagged ? 'AI flagged harmful content.' : 'AI scan clear — no issues detected.')))}
            />
          ))}
        </div>
      )}

      {confirmRemove && (
        <ConfirmDialog
          title="Remove Post"
          message={`Remove "${confirmRemove.content.slice(0, 80)}${confirmRemove.content.length > 80 ? '…' : ''}" from the public feed? This can be restored later.`}
          confirmLabel="Remove"
          confirmClass="bg-red-600 text-white hover:bg-red-500"
          loading={removing}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={async () => {
            try {
              await removePost(confirmRemove.id).unwrap()
              showToast('success', 'Post removed from feed.')
              setConfirmRemove(null)
            } catch (err) {
              showToast('error', extractApiError(err))
            }
          }}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/15 border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
          {toast.msg}
          <button type="button" onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100"><X size={12} /></button>
        </div>
      )}
    </div>
  )
}
