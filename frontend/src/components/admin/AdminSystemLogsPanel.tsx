import { useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  RefreshCw,
  ScrollText,
  Search,
  Server,
} from 'lucide-react'
import {
  useListSystemLogsQuery,
  useGetSystemLogAnalyticsQuery,
} from '../../api/adminSystemLogsApi'
import {
  LOG_CATEGORIES,
  categoryLabels,
  SERVICES,
  type LogLevel,
} from '../../data/systemLogsData'

type LevelFilter = LogLevel | 'all'

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl px-4 py-3 min-w-[90px]">
      <p className="text-[10px] uppercase tracking-wide text-[#5c5d72] font-semibold">{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
    </div>
  )
}

export function AdminSystemLogsPanel() {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: analytics } = useGetSystemLogAnalyticsQuery(undefined, { pollingInterval: 15000 })
  const { data: logs, isLoading, isFetching, refetch } = useListSystemLogsQuery(
    {
      level: levelFilter,
      category: categoryFilter,
      service: serviceFilter,
      q: searchQuery,
      limit: 200,
    },
    { pollingInterval: 15000 }
  )

  const errorCount = analytics?.errorCount ?? 0
  const warnCount = analytics?.warnCount ?? 0

  const levelIcons = useMemo(
    () => ({
      INFO: <Info size={12} className="text-blue-400" />,
      WARN: <AlertTriangle size={12} className="text-amber-400" />,
      ERROR: <AlertCircle size={12} className="text-red-400" />,
      DEBUG: <Server size={12} className="text-[#5c5d72]" />,
    }),
    []
  )

  const levelColorClass = (level: string) => {
    switch (level) {
      case 'WARN': return 'text-amber-400'
      case 'ERROR': return 'text-red-400'
      case 'DEBUG': return 'text-[#5c5d72]'
      default: return 'text-blue-400'
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ScrollText size={20} className="text-violet-400" />
            System Logs
          </h2>
          <p className="text-xs text-[#8b8ca8] mt-1">
            {errorCount} errors · {warnCount} warnings · backend activity for debugging & security audits
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <div className="flex bg-[#161722] border border-[#2d2e3e] rounded-xl p-0.5 gap-0.5">
            {(['all', 'info', 'warn', 'error', 'debug'] as LevelFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setLevelFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase transition-all ${
                  levelFilter === f ? 'bg-[#2d2e3e] text-white' : 'text-[#5c5d72] hover:text-[#8b8ca8]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
        <StatCard label="Total" value={analytics?.totalLogs ?? 0} color="#818cf8" />
        <StatCard label="Logins" value={analytics?.loginAttempts ?? 0} color="#34d399" />
        <StatCard label="API Errors" value={analytics?.apiErrors ?? 0} color="#f87171" />
        <StatCard label="Payments" value={analytics?.paymentFailures ?? 0} color="#fb923c" />
        <StatCard label="Server" value={analytics?.serverIssues ?? 0} color="#fbbf24" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(searchInput)}
            placeholder="Search logs, services, details…"
            className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#818cf8]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#818cf8]"
        >
          <option value="all">All categories</option>
          {LOG_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{categoryLabels[cat]}</option>
          ))}
        </select>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="bg-[#161722] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#818cf8]"
        >
          <option value="all">All services</option>
          {SERVICES.map((svc) => (
            <option key={svc} value={svc}>{svc}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setSearchQuery(searchInput)}
          className="px-3 py-2 rounded-lg text-xs font-bold bg-[#818cf8] text-white hover:bg-[#6366f1]"
        >
          Search
        </button>
      </div>

      <div className="bg-[#0b0c14] border border-[#2d2e3e] rounded-xl overflow-hidden font-mono">
        <div className="px-4 py-2 border-b border-[#1e1f2e] flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-[#5c5d72] ml-2">
            devconnect — system logs — {new Date().toLocaleString()}
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-violet-400" />
          </div>
        ) : !logs?.length ? (
          <div className="p-12 text-center">
            <ScrollText size={36} className="mx-auto text-[#2d2e3e] mb-3" />
            <p className="text-sm text-[#8b8ca8]">No logs match this filter</p>
            <p className="text-xs text-[#5c5d72] mt-1">Restart user-service with local profile to seed demo logs.</p>
          </div>
        ) : (
          <div className="p-4 space-y-1 max-h-[520px] overflow-y-auto">
            {logs.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-start gap-2 py-1 rounded px-2 ${
                  entry.levelLabel === 'ERROR'
                    ? 'bg-red-500/5'
                    : entry.levelLabel === 'WARN'
                      ? 'bg-amber-500/5'
                      : ''
                }`}
              >
                <span className="text-[10px] text-[#5c5d72] shrink-0 mt-0.5">{entry.timeLabel}</span>
                <span className="shrink-0 mt-0.5">{levelIcons[entry.levelLabel as keyof typeof levelIcons]}</span>
                <span className={`text-[10px] font-bold shrink-0 ${levelColorClass(entry.levelLabel)}`}>
                  [{entry.levelLabel}]
                </span>
                <span className="text-[10px] text-violet-400 shrink-0">[{entry.service}]</span>
                <span className="text-[10px] text-cyan-400/80 shrink-0">[{entry.categoryLabel}]</span>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#a5a6bb]">{entry.message}</span>
                  {entry.details && (
                    <p className="text-[10px] text-[#5c5d72] mt-0.5 truncate" title={entry.details}>
                      ↳ {entry.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
