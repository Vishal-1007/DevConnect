/**
 * MentorPerformanceInsightsPanel — AI-powered mentor insights and actionable recommendations.
 */
import type { ReactNode } from 'react'
import {
  Sparkles, TrendingUp, Clock, AlertTriangle, Star, Target,
  Loader2, RefreshCw, Heart, BookOpen, BarChart3, ChevronRight,
} from 'lucide-react'
import { useGetMentorInsightsQuery } from '../../api/mentorWorkspaceApi'
import { MentorPanelShell, MENTOR_STAT_GRID } from './MentorPanelShell'

export type MentorInsightTab =
  | 'plans' | 'availability' | 'host-webinar' | 'session-requests'
  | 'earnings' | 'bookings' | 'my-students' | 'session-analytics'

const TYPE_CONFIG = {
  positive: {
    card: 'border-l-emerald-500 border-emerald-500/25 bg-emerald-500/5',
    icon: 'text-emerald-400 bg-emerald-500/15',
    btn: 'border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600',
  },
  tip: {
    card: 'border-l-violet-500 border-violet-500/25 bg-violet-500/5',
    icon: 'text-violet-400 bg-violet-500/15',
    btn: 'border border-violet-500/30 text-violet-400 hover:bg-violet-600 hover:text-white hover:border-violet-600',
  },
  warning: {
    card: 'border-l-amber-500 border-amber-500/25 bg-amber-500/5',
    icon: 'text-amber-400 bg-amber-500/15',
    btn: 'border border-amber-500/30 text-amber-400 hover:bg-amber-600 hover:text-white hover:border-amber-600',
  },
} as const

const INSIGHT_ICONS: Record<string, ReactNode> = {
  'top-topic': <TrendingUp size={14} />,
  'evening-slots': <Clock size={14} />,
  'webinar-visibility': <Sparkles size={14} />,
  'response-time': <AlertTriangle size={14} />,
  'revenue-trend': <Star size={14} />,
  retention: <Heart size={14} />,
  improvement: <Target size={14} />,
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full border bg-violet-500/15 text-violet-300 border-violet-500/25 shrink-0">
      {children}
    </span>
  )
}

export function MentorPerformanceInsightsPanel({
  onNavigate,
}: {
  onNavigate: (tab: MentorInsightTab) => void
}) {
  const { data, isLoading, isError, refetch, isFetching } = useGetMentorInsightsQuery()

  if (isLoading && !data) {
    return (
      <MentorPanelShell>
        <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      </MentorPanelShell>
    )
  }

  if (isError || !data) {
    return (
      <MentorPanelShell>
        <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
        <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
        <p className="text-sm text-white font-semibold mb-1">Could not load performance insights</p>
        <button type="button" onClick={() => refetch()} className="text-xs text-violet-400 hover:text-violet-300 mt-2">
          Try again
        </button>
      </div>
      </MentorPanelShell>
    )
  }

  return (
    <MentorPanelShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Performance Insights</h2>
          <p className="text-xs text-[#8b8ca8] mt-0.5">
            AI-powered recommendations to grow your mentorship business
          </p>
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
          {
            label: 'Student Satisfaction',
            value: `${data.studentSatisfactionScore.toFixed(0)}%`,
            sub: 'Based on ratings & feedback',
            icon: <Heart size={14} className="text-rose-400" />,
          },
          {
            label: 'Best Topic',
            value: data.topPerformingTopic,
            sub: 'Highest-rated sessions',
            icon: <BookOpen size={14} className="text-emerald-400" />,
          },
          {
            label: 'Improvement Area',
            value: data.improvementArea,
            sub: 'Focus for growth',
            icon: <Target size={14} className="text-amber-400" />,
          },
          {
            label: 'Booking Trend',
            value: data.bookingTrend.split(' — ')[0] ?? data.bookingTrend,
            sub: data.bookingTrend.includes(' — ') ? data.bookingTrend.split(' — ')[1] : 'This month',
            icon: <BarChart3 size={14} className="text-cyan-400" />,
          },
        ].map((m) => (
          <div key={m.label} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              {m.icon}
              <span className="text-[10px] text-[#8b8ca8]">{m.label}</span>
            </div>
            <p className="text-sm font-bold text-white truncate" title={m.value}>{m.value}</p>
            <p className="text-[10px] text-[#5c5d72] mt-1 line-clamp-2">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/10 border border-violet-500/20 rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-violet-600/30 flex items-center justify-center shrink-0">
          <Sparkles size={22} className="text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">AI Mentor Assistant</p>
          <p className="text-xs text-[#8b8ca8]">
            Analyzing session data, student feedback, and booking patterns to generate personalized insights.
          </p>
        </div>
        <Pill>BETA</Pill>
      </div>

      <div className="space-y-3 w-full">
        {data.insights.map((ins) => {
          const cfg = TYPE_CONFIG[ins.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.tip
          const icon = INSIGHT_ICONS[ins.id] ?? <Sparkles size={14} />
          return (
            <div
              key={ins.id}
              className={`w-full border border-[#2d2e3e] border-l-4 rounded-xl p-5 ${cfg.card}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.icon}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white mb-1">{ins.title}</p>
                  <p className="text-xs text-[#a5a6bb] leading-relaxed">{ins.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(ins.actionTarget as MentorInsightTab)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1 ${cfg.btn}`}
                >
                  {ins.actionLabel}
                  <ChevronRight size={10} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {data.insights.length === 0 && (
        <div className="text-center py-10 bg-[#161722] border border-[#2d2e3e] rounded-xl">
          <Sparkles size={28} className="text-violet-400 mx-auto mb-2" />
          <p className="text-sm text-white font-semibold">Insights are being generated</p>
          <p className="text-xs text-[#8b8ca8] mt-1">Complete a few sessions to unlock AI recommendations.</p>
        </div>
      )}
    </MentorPanelShell>
  )
}
