import { useEffect, useMemo, useState } from 'react'
import {
  Zap,
  RefreshCw,
  Search,
  Loader2,
  Video,
  Users,
  Clock,
  Signal,
  Film,
  Flag,
  Shield,
  Sparkles,
  XCircle,
  Play,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'
import {
  useListAdminSessionsQuery,
  useGetAdminSessionQuery,
  useUpdateAdminSessionMutation,
  useEndAdminSessionMutation,
  useAddSessionReportMutation,
  useRunSessionAiModerationMutation,
  type PlatformSession,
} from '../../api/adminSessionsApi'
import {
  SESSION_TYPES,
  SESSION_TYPE_ICONS,
  sessionTypeMeta,
  MODERATION_STATUS,
  type PlatformSessionTypeId,
} from '../../data/sessionTypes'
import { extractApiError } from '../../lib/extractApiError'
import { useAppSelector } from '../../hooks'
import { hasAdminRole } from '../../lib/roles'

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

function AlertBanner({ type, message, onDismiss }: { type: 'error' | 'success'; message: string; onDismiss?: () => void }) {
  return (
    <div
      className={`flex items-start justify-between gap-3 px-4 py-3 rounded-lg text-xs ${
        type === 'error'
          ? 'bg-red-500/10 border border-red-500/30 text-red-300'
          : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
      }`}
    >
      <p className="leading-relaxed">{message}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-[#8b8ca8] hover:text-white shrink-0">
          ✕
        </button>
      )}
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="p-4 rounded-xl bg-[#12131c] border border-[#2d2e3e]">
      <div className="flex items-center gap-2 text-[#8b8ca8] mb-2">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
      {sub && <p className="text-[10px] text-[#5c5d72] mt-1">{sub}</p>}
    </div>
  )
}

function SessionDetail({
  sessionId,
  onError,
  onSuccess,
}: {
  sessionId: string
  onError: (m: string) => void
  onSuccess: (m: string) => void
}) {
  const account = useAppSelector((s) => s.auth.account)
  const isAdmin = hasAdminRole(account?.roles)
  const { data: session, isLoading, refetch } = useGetAdminSessionQuery(sessionId, {
    pollingInterval: 8000,
  })
  const [updateSession, { isLoading: updating }] = useUpdateAdminSessionMutation()
  const [endSession, { isLoading: ending }] = useEndAdminSessionMutation()
  const [addReport, { isLoading: reporting }] = useAddSessionReportMutation()
  const [runAi, { isLoading: moderating }] = useRunSessionAiModerationMutation()

  const [reportReason, setReportReason] = useState('inappropriate_behavior')
  const [reportDetails, setReportDetails] = useState('')

  if (isLoading || !session) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#5c5d72]">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    )
  }

  const current = session
  const typeMeta = sessionTypeMeta(current.sessionType)
  const modMeta = MODERATION_STATUS[current.moderationStatus] ?? MODERATION_STATUS.review
  const TypeIcon = SESSION_TYPE_ICONS[current.sessionType] ?? Video
  const isLive = current.status === 'live'
  const qualityColor =
    current.qualityScore >= 80 ? 'green' : current.qualityScore >= 60 ? 'amber' : 'red'

  async function toggleAiModeration() {
    try {
      await updateSession({
        id: current.id,
        body: { aiModerationEnabled: !current.aiModerationEnabled },
      }).unwrap()
      onSuccess(current.aiModerationEnabled ? 'AI moderation disabled' : 'AI moderation enabled')
      refetch()
    } catch (err) {
      onError(extractApiError(err))
    }
  }

  async function handleRunAi() {
    try {
      const updated = await runAi(current.id).unwrap()
      onSuccess(
        updated.moderationStatus === 'flagged'
          ? 'AI flagged potential issues'
          : 'AI moderation scan complete — session clear'
      )
      refetch()
    } catch (err) {
      onError(extractApiError(err))
    }
  }

  async function handleEnd() {
    if (!confirm('End this session for all participants?')) return
    try {
      await endSession(current.id).unwrap()
      onSuccess('Session ended')
      refetch()
    } catch (err) {
      onError(extractApiError(err))
    }
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault()
    try {
      await addReport({
        id: current.id,
        body: { reason: reportReason, details: reportDetails.trim() || undefined },
      }).unwrap()
      setReportDetails('')
      onSuccess('Report submitted')
      refetch()
    } catch (err) {
      onError(extractApiError(err))
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2d2e3e] flex items-start justify-between gap-4 shrink-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 shrink-0">
            <TypeIcon size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white truncate">{current.title}</h3>
            <p className="text-xs text-[#8b8ca8] mt-0.5 line-clamp-2">{current.description ?? 'No description'}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Pill color={typeMeta.color}>{typeMeta.label}</Pill>
              <Pill color={isLive ? 'green' : 'gray'}>{isLive ? 'Live' : 'Ended'}</Pill>
              <Pill color={modMeta.color}>{modMeta.label}</Pill>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:border-[#818cf8]/40"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          {isLive && (
            <button
              type="button"
              onClick={handleEnd}
              disabled={ending}
              className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/25 disabled:opacity-50 flex items-center gap-1.5"
            >
              {ending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
              End session
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#12131c] border border-[#2d2e3e]">
          <Av name={current.hostDisplayName} size={40} />
          <div>
            <p className="text-sm font-semibold text-white">{current.hostDisplayName}</p>
            <p className="text-[10px] text-[#5c5d72] font-mono">Host · {current.hostId.slice(0, 8)}…</p>
          </div>
          {current.linkedRoomId && (
            <span className="ml-auto text-[10px] text-[#5c5d72] font-mono">
              Room {current.linkedRoomId.slice(0, 8)}…
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            icon={<Clock size={14} />}
            label="Duration"
            value={current.durationLabel}
            sub={`Started ${new Date(current.startedAt).toLocaleString()}`}
          />
          <MetricCard
            icon={<Signal size={14} />}
            label="Quality"
            value={`${current.qualityScore}%`}
            sub="Network & A/V score"
          />
          <MetricCard
            icon={<Users size={14} />}
            label="Participants"
            value={`${current.participantCount} / ${current.maxParticipants}`}
          />
          <MetricCard
            icon={<Flag size={14} />}
            label="Reports"
            value={String(current.reportCount)}
            sub="During session"
          />
        </div>

        <div className="flex items-center gap-2">
          <Pill color={qualityColor}>
            <BarChart3 size={10} /> Quality {current.qualityScore}%
          </Pill>
          {current.recordingAvailable && (
            <Pill color="blue">
              <Film size={10} /> Recording available
            </Pill>
          )}
        </div>

        {current.recordingAvailable && current.recordingUrl && (
          <div className="p-4 rounded-xl bg-[#12131c] border border-[#2d2e3e]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-white font-semibold">
                <Film size={16} className="text-blue-400" />
                Session recording
              </div>
              <a
                href={current.recordingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                <Play size={12} /> Open
              </a>
            </div>
            <p className="text-[10px] text-[#5c5d72] mt-2 font-mono truncate">{current.recordingUrl}</p>
          </div>
        )}

        <div className="p-4 rounded-xl bg-[#12131c] border border-[#2d2e3e] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-violet-400" />
              <span className="text-sm font-semibold text-white">AI moderation</span>
            </div>
            <button
              type="button"
              onClick={toggleAiModeration}
              disabled={!isAdmin || updating}
              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                current.aiModerationEnabled
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-[#2d2e3e] text-[#8b8ca8]'
              }`}
            >
              {current.aiModerationEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <p className="text-xs text-[#8b8ca8] leading-relaxed">
            Scans session metadata and reports for inappropriate behavior, spam, and harassment patterns.
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={handleRunAi}
              disabled={!current.aiModerationEnabled || moderating}
              className="w-full py-2.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {moderating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Run AI moderation scan
            </button>
          )}
        </div>

        <div className="p-4 rounded-xl bg-[#12131c] border border-[#2d2e3e]">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-amber-400" />
            Session reports
          </h4>
          {current.reports.length === 0 ? (
            <p className="text-xs text-[#5c5d72]">No reports filed during this session.</p>
          ) : (
            <ul className="space-y-2">
              {current.reports.map((r) => (
                <li key={r.id} className="p-3 rounded-lg bg-[#161722] border border-[#2d2e3e] text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <Pill color="amber">{r.reason}</Pill>
                    <span className="text-[10px] text-[#5c5d72]">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  {r.details && <p className="text-[#a5a6bb] mt-2">{r.details}</p>}
                  <p className="text-[10px] text-[#5c5d72] mt-1">{r.reporterLabel}</p>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleReport} className="mt-4 pt-4 border-t border-[#2d2e3e] space-y-3">
            <p className="text-[10px] text-[#8b8ca8] uppercase tracking-wider font-semibold">File report (admin test)</p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="inappropriate_behavior">Inappropriate behavior</option>
              <option value="harassment">Harassment</option>
              <option value="spam">Spam</option>
              <option value="technical_issue">Technical issue</option>
            </select>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={2}
              placeholder="Optional details…"
              className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white resize-none"
            />
            <button
              type="submit"
              disabled={reporting}
              className="px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 disabled:opacity-50"
            >
              Submit report
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function SessionListItem({
  session,
  selected,
  onSelect,
}: {
  session: PlatformSession
  selected: boolean
  onSelect: () => void
}) {
  const meta = sessionTypeMeta(session.sessionType)
  const Icon = SESSION_TYPE_ICONS[session.sessionType] ?? Video
  const isLive = session.status === 'live'

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 border-b border-[#1c1d2a] transition-colors ${
        selected ? 'bg-violet-500/10 border-l-2 border-l-violet-500' : 'hover:bg-[#1c1d2a]/60 border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isLive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#2d2e3e] text-[#8b8ca8]'}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{session.title}</p>
          <p className="text-[10px] text-[#5c5d72] mt-0.5">{meta.label} · {session.durationLabel}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
            <span className="text-[10px] text-[#5c5d72]">
              <Users size={10} className="inline mr-0.5" />
              {session.participantCount}
            </span>
            {session.reportCount > 0 && (
              <span className="text-[10px] text-amber-400">
                <Flag size={10} className="inline mr-0.5" />
                {session.reportCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

export function AdminSessionsPanel() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'ended'>('all')
  const [typeFilter, setTypeFilter] = useState<PlatformSessionTypeId | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const { data: sessions = [], isLoading, isFetching, refetch } = useListAdminSessionsQuery(
    {
      status: statusFilter,
      sessionType: typeFilter,
      q: search,
      limit: 100,
    },
    { pollingInterval: 12000 }
  )

  const liveCount = useMemo(() => sessions.filter((s) => s.status === 'live').length, [sessions])
  const endedCount = sessions.length - liveCount

  useEffect(() => {
    if (!selectedId && sessions.length > 0) {
      setSelectedId(sessions[0].id)
    }
    if (selectedId && !sessions.find((s) => s.id === selectedId)) {
      setSelectedId(sessions[0]?.id ?? null)
    }
  }, [sessions, selectedId])

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-[#2d2e3e] shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap size={20} className="text-violet-400" />
              Live Sessions
            </h2>
            <p className="text-xs text-[#8b8ca8] mt-1">
              {sessions.length} total · {liveCount} live · {endedCount} ended — video calls, mentorship, interviews & coding
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
          <div className="mt-3">
            <AlertBanner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {(['all', 'live', 'ended'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                statusFilter === s
                  ? 'bg-violet-600 text-white'
                  : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
          <div className="w-px h-6 bg-[#2d2e3e] mx-1" />
          {SESSION_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id as PlatformSessionTypeId | 'all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                typeFilter === t.id
                  ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200'
                  : 'bg-[#12131c] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative mt-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions by title or description…"
            className="w-full max-w-md bg-[#12131c] border border-[#2d2e3e] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-[#5c5d72] focus:border-[#818cf8] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-full max-w-sm border-r border-[#2d2e3e] flex flex-col min-h-0 bg-[#161722]">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-violet-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Zap size={40} className="text-[#2d2e3e] mb-3" />
              <p className="text-sm font-semibold text-white">No sessions yet</p>
              <p className="text-xs text-[#5c5d72] mt-2 max-w-[220px]">
                Sessions sync from live video rooms. Create a room under Video Rooms to see activity here.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {sessions.map((s) => (
                <SessionListItem
                  key={s.id}
                  session={s}
                  selected={selectedId === s.id}
                  onSelect={() => setSelectedId(s.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0 bg-[#12131c]">
          {selectedId ? (
            <SessionDetail
              sessionId={selectedId}
              onError={(m) => setBanner({ type: 'error', message: m })}
              onSuccess={(m) => setBanner({ type: 'success', message: m })}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#5c5d72] p-8">
              <Zap size={48} className="mb-4 opacity-30" />
              <p className="text-sm">Select a session to monitor</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
