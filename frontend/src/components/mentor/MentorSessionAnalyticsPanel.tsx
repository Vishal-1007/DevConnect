/**
 * MentorSessionAnalyticsPanel — mentorship performance metrics and teaching insights.
 */
import { useMemo } from 'react'
import {
  BarChart3, TrendingUp, Loader2, RefreshCw, AlertTriangle, Star,
  Clock, Users, CheckCircle2, Timer, Lightbulb, Target,
} from 'lucide-react'
import { useGetMentorAnalyticsQuery } from '../../api/mentorWorkspaceApi'
import { MentorPanelShell, MENTOR_STAT_GRID } from './MentorPanelShell'

function StatDelta({ pct, inverse = false }: { pct: number; inverse?: boolean }) {
  const positive = inverse ? pct <= 0 : pct >= 0
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      <TrendingUp size={10} className={positive ? '' : 'rotate-180'} />
      {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

function LineChart({ series, colors, h = 100 }: { series: number[][]; colors: string[]; h?: number }) {
  const max = Math.max(...series.flat(), 1)
  const len = series[0]?.length ?? 1
  return (
    <svg width="100%" height={h} viewBox={`0 0 400 ${h}`} preserveAspectRatio="none">
      <defs>
        {colors.map((c, ci) => (
          <linearGradient key={ci} id={`lg-analytics-${ci}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.2" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {series.map((vals, si) => {
        const pts = vals.map((v, i) => `${(i / Math.max(len - 1, 1)) * 400},${h - 8 - (v / max) * (h - 16)}`)
        return (
          <g key={si}>
            <polygon points={[...pts, `400,${h}`, `0,${h}`].join(' ')} fill={`url(#lg-analytics-${si})`} />
            <polyline points={pts.join(' ')} stroke={colors[si]} strokeWidth="2" fill="none" strokeLinejoin="round" />
          </g>
        )
      })}
    </svg>
  )
}

function ProgressBar({ value, label, color = '#818cf8' }: { value: number; label: string; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-[#8b8ca8]">{label}</span>
        <span className="text-white font-semibold">{value}%</span>
      </div>
      <div className="w-full bg-[#1c1d2a] rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

export function MentorSessionAnalyticsPanel() {
  const { data: analytics, isLoading, isError, refetch, isFetching } = useGetMentorAnalyticsQuery()

  const series = useMemo(
    () => [analytics?.sessionsByMonth ?? Array.from({ length: 12 }, () => 0)],
    [analytics],
  )

  if (isLoading && !analytics) {
    return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
  }

  if (isError || !analytics) {
    return (
      <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
        <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
        <p className="text-sm text-white font-semibold mb-1">Could not load session analytics</p>
        <button type="button" onClick={() => refetch()} className="text-xs text-violet-400 hover:text-violet-300 mt-2">Try again</button>
      </div>
    )
  }

  const rating = analytics.averageRating ?? 0

  return (
    <MentorPanelShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Session Analytics</h2>
          <p className="text-xs text-[#8b8ca8] mt-0.5">Track your mentorship performance metrics</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161722] border border-[#2d2e3e] text-[#5c5d72] hover:text-white"
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className={MENTOR_STAT_GRID}>
        {[
          { l: 'Sessions Completed', v: analytics.sessionsCompleted, delta: analytics.sessionsGrowthPct, icon: <CheckCircle2 size={14} className="text-violet-400" /> },
          { l: 'Completion Rate', v: `${analytics.completionRatePct}%`, delta: analytics.completionRateGrowthPct, icon: <Target size={14} className="text-emerald-400" /> },
          { l: 'Avg Duration', v: `${analytics.averageDurationMinutes}m`, delta: analytics.durationChangePct, inverse: true, icon: <Clock size={14} className="text-amber-400" /> },
          { l: 'Student Retention', v: `${analytics.studentRetentionPct}%`, delta: analytics.retentionGrowthPct, icon: <Users size={14} className="text-cyan-400" /> },
        ].map((s) => (
          <div key={s.l} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-[10px] text-[#8b8ca8]">{s.l}</span></div>
            <p className="text-2xl font-bold text-white mb-1">{s.v}</p>
            <StatDelta pct={s.delta} inverse={'inverse' in s ? s.inverse : false} />
          </div>
        ))}
      </div>

      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 size={14} className="text-violet-400" /> Sessions per Month (12 months)
        </h3>
        <LineChart series={series} colors={['#818cf8']} h={100} />
        <div className="flex justify-between mt-2">
          {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m) => (
            <span key={m} className="text-[9px] text-[#5c5d72]">{m}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full items-stretch">
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5 h-full">
          <h3 className="text-sm font-bold text-white mb-4">Performance by Topic</h3>
          <div className="space-y-3">
            {(analytics.topicPerformance ?? []).map((t) => (
              <ProgressBar key={t.topic} label={t.topic} value={t.scorePct} color="#818cf8" />
            ))}
          </div>
        </div>

        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5 h-full">
          <h3 className="text-sm font-bold text-white mb-4">Session Quality</h3>
          <ul className="space-y-3">
            {[
              { l: 'Average Rating', v: `${rating.toFixed(2)} / 5.00`, icon: <Star size={12} className="text-amber-400" /> },
              { l: '5-star Sessions', v: `${analytics.fiveStarSessions}`, icon: <Star size={12} className="text-amber-400 fill-amber-400" /> },
              { l: 'Repeat Students', v: `${analytics.repeatStudents}`, icon: <Users size={12} className="text-violet-400" /> },
              { l: 'Response Time (avg)', v: `${analytics.responseTimeMinutes} min`, icon: <Timer size={12} className="text-cyan-400" /> },
              { l: 'No-show Rate', v: `${analytics.noShowRatePct}%`, icon: <AlertTriangle size={12} className="text-amber-400" /> },
            ].map((m) => (
              <li key={m.l} className="flex items-center justify-between">
                <span className="text-xs text-[#8b8ca8] flex items-center gap-2">{m.icon}{m.l}</span>
                <span className="text-xs font-bold text-white">{m.v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(analytics.teachingTips ?? []).length > 0 && (
        <div className="bg-gradient-to-br from-violet-600/10 to-indigo-600/5 border border-violet-500/20 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Lightbulb size={14} className="text-violet-400" /> Tips to Improve Teaching Quality
          </h3>
          <ul className="space-y-2">
            {analytics.teachingTips.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-xs text-[#c4c5d6] leading-relaxed">
                <span className="text-violet-400 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </MentorPanelShell>
  )
}
