import { Award } from 'lucide-react'
import { useGetSystemHealthQuery } from '../../api/adminDashboardApi'
import type { LiveActivityItem } from '../../lib/adminAnalytics'
import type { MentorApplication } from '../../api/types'

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    amber: 'bg-amber-500/15 text-amber-400',
    green: 'bg-emerald-500/15 text-emerald-400',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[color] ?? map.amber}`}
    >
      {children}
    </span>
  )
}

export function AdminRightPanel({
  liveActivity,
  applications,
  pendingCount,
  onTabChange,
}: {
  liveActivity: LiveActivityItem[]
  applications?: MentorApplication[]
  pendingCount: number
  onTabChange: (tab: string) => void
}) {
  const { data: systemHealth = [], isFetching: healthLoading } = useGetSystemHealthQuery(undefined, {
    pollingInterval: 30_000,
  })

  const allHealthy = systemHealth.length > 0 && systemHealth.every((s) => s.ok)
  const pendingApps = (applications ?? []).filter((a) => a.status === 'PENDING')

  return (
    <div className="w-[240px] shrink-0 border-l border-[#1e1f2e] bg-[#0f1018] overflow-y-auto">
      <div className="p-4 border-b border-[#1e1f2e]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white">Live Activity</h3>
          <button
            type="button"
            onClick={() => onTabChange('system-logs')}
            className="text-[10px] text-violet-400 hover:text-white"
          >
            View All
          </button>
        </div>
        <ul className="space-y-3">
          {liveActivity.slice(0, 6).map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => a.tab && onTabChange(a.tab)}
                className="flex items-start gap-2 w-full text-left hover:opacity-90 transition-opacity"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: a.color }}
                />
                <div>
                  <p className="text-[11px] text-[#a5a6bb] leading-snug">{a.text}</p>
                  <p className="text-[9px] text-[#5c5d72] mt-0.5">{a.time}</p>
                </div>
              </button>
            </li>
          ))}
          {liveActivity.length === 0 && (
            <p className="text-[11px] text-[#5c5d72] text-center py-2">No recent activity</p>
          )}
        </ul>
      </div>

      <div className="p-4 border-b border-[#1e1f2e]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white">System Health</h3>
          <span
            className={`text-[9px] font-semibold ${allHealthy ? 'text-emerald-400' : 'text-amber-400'}`}
          >
            {healthLoading ? 'Checking…' : allHealthy ? 'All OK' : 'Issues'}
          </span>
        </div>
        <ul className="space-y-2">
          {systemHealth.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#8b8ca8] truncate">{s.name}</span>
              <span
                className={`text-[10px] font-semibold shrink-0 ${s.ok ? 'text-emerald-400' : 'text-red-400'}`}
                title={s.detail}
              >
                {s.ok ? 'Operational' : 'Down'}
              </span>
            </li>
          ))}
          {systemHealth.length === 0 && !healthLoading && (
            <p className="text-[11px] text-[#5c5d72]">Health checks unavailable</p>
          )}
        </ul>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white">Pending Reviews</h3>
          <button
            type="button"
            onClick={() => onTabChange('requests')}
            className="text-[10px] text-violet-400 hover:text-white"
          >
            View All
          </button>
        </div>
        {pendingApps.slice(0, 4).map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => onTabChange('requests')}
            className="flex items-center gap-2 py-2 border-b border-[#1e1f2e] last:border-0 w-full text-left hover:bg-[#161722]/50 rounded-lg px-1 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Award size={12} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white truncate">
                {app.headline ?? 'Mentor Application'}
              </p>
              <p className="text-[9px] text-[#5c5d72]">by {app.username}</p>
            </div>
            <Pill color="amber">Pending</Pill>
          </button>
        ))}
        {pendingCount === 0 && (
          <p className="text-[11px] text-[#5c5d72] text-center py-3">No pending reviews</p>
        )}
      </div>
    </div>
  )
}
