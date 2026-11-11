import { useState } from 'react'
import { Award, ChevronRight, RefreshCw } from 'lucide-react'
import { useListAdminMentorApplicationsQuery } from '../../../api/adminMentorApplicationsApi'
import { avatarUrl } from '../../../lib/avatar'
import { MentorApplicationReviewDashboard } from './MentorApplicationReviewDashboard'

type ReqFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED' | 'SUSPENDED' | 'ALL'

function statusColor(status: string) {
  const map: Record<string, { dot: string; pill: string }> = {
    PENDING: { dot: '#f59e0b', pill: 'amber' },
    APPROVED: { dot: '#10b981', pill: 'green' },
    REJECTED: { dot: '#ef4444', pill: 'red' },
    INFO_REQUESTED: { dot: '#3b82f6', pill: 'blue' },
    SUSPENDED: { dot: '#6b7280', pill: 'gray' },
  }
  return map[status] ?? map.PENDING
}

function Loading() {
  return <div className="flex justify-center py-16 text-[#5c5d72] text-sm">Loading applications…</div>
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-[#5c5d72]">
      <Award size={36} className="mb-3 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

export function AdminMentorRequestsView() {
  const { data: apps, isLoading, refetch } = useListAdminMentorApplicationsQuery()
  const [filter, setFilter] = useState<ReqFilter>('PENDING')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (selectedId) {
    return (
      <MentorApplicationReviewDashboard
        applicationId={selectedId}
        onBack={() => setSelectedId(null)}
        onActionComplete={() => {
          void refetch()
          setSelectedId(null)
        }}
      />
    )
  }

  const counts: Record<string, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    INFO_REQUESTED: 0,
    SUSPENDED: 0,
    ALL: apps?.length ?? 0,
  }
  apps?.forEach((a) => {
    if (a.status in counts) counts[a.status]++
  })

  const filtered = (apps ?? []).filter((a) => filter === 'ALL' || a.status === filter)
  const tabs: { id: ReqFilter; color: string }[] = [
    { id: 'PENDING', color: '#f59e0b' },
    { id: 'APPROVED', color: '#10b981' },
    { id: 'REJECTED', color: '#ef4444' },
    { id: 'INFO_REQUESTED', color: '#3b82f6' },
    { id: 'ALL', color: '#818cf8' },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Mentor Applications</h2>
          <p className="text-xs text-[#5c5d72] mt-0.5">{counts.PENDING} pending review</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white transition-colors"
          >
            <RefreshCw size={13} />
          </button>
          <div className="flex bg-[#161722] border border-[#2d2e3e] rounded-xl p-0.5 gap-0.5 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  filter === t.id ? 'bg-[#2d2e3e] text-white' : 'text-[#5c5d72] hover:text-[#8b8ca8]'
                }`}
              >
                {t.id.replace('_', ' ')}
                {(counts[t.id] ?? 0) > 0 && (
                  <span
                    className="text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1"
                    style={
                      filter === t.id
                        ? { background: `${t.color}30`, color: t.color }
                        : { background: '#2d2e3e', color: '#5c5d72' }
                    }
                  >
                    {counts[t.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty text={`No ${filter !== 'ALL' ? filter.toLowerCase().replace('_', ' ') : ''} applications`} />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const d = app.applicationData
            const name = d?.fullName ?? app.username ?? 'Unknown'
            const s = statusColor(app.status)
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedId(app.id)}
                className="w-full text-left bg-[#161722]/80 border border-[#2d2e3e] rounded-2xl overflow-hidden hover:border-[#6366f1]/40 hover:bg-[#161722] transition-all group"
              >
                <div className="h-0.5" style={{ background: s.dot }} />
                <div className="p-5 flex items-center gap-4">
                  <img
                    src={d?.profilePictureUrl || avatarUrl(name, 48)}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#6366f1]/20"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-white">{name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#2d2e3e] text-[#8b8ca8]">
                        {app.status.replace('_', ' ')}
                      </span>
                      <span className="ml-auto text-[10px] text-[#5c5d72] font-mono">{app.applicationCode}</span>
                    </div>
                    <p className="text-sm text-[#a5b4fc] truncate">{d?.headline ?? app.headline ?? '—'}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(d?.skills ?? []).slice(0, 4).map((skill) => (
                        <span key={skill} className="text-[9px] px-1.5 py-0.5 rounded bg-[#6366f1]/10 text-[#c7d2fe]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#5c5d72] group-hover:text-[#818cf8] shrink-0 transition-colors" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
