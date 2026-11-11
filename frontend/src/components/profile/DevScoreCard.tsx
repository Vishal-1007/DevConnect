import {
  BarChart3, Brain, Code2, MessageSquare, Star, Trophy, Users,
} from 'lucide-react'
import { ProfileSectionHeader } from './profileUi'
import type { DevScoreMetrics } from '../../data/candidateProfileData'

type Props = {
  metrics: DevScoreMetrics
}

const METRIC_CARDS = [
  { key: 'aiInterviewScore' as const, label: 'AI Interview', icon: Brain, suffix: '%', color: 'text-violet-300' },
  { key: 'codingScore' as const, label: 'Coding Score', icon: Code2, suffix: '', color: 'text-blue-300' },
  { key: 'mentorRating' as const, label: 'Mentor Rating', icon: Star, suffix: '/5', color: 'text-amber-300' },
  { key: 'codeReviewScore' as const, label: 'Code Review', icon: MessageSquare, suffix: '%', color: 'text-emerald-300' },
  { key: 'projectScore' as const, label: 'Project Score', icon: BarChart3, suffix: '%', color: 'text-cyan-300' },
  { key: 'communityContribution' as const, label: 'Community', icon: Users, suffix: '%', color: 'text-pink-300' },
]

export function DevScoreCard({ metrics }: Props) {
  return (
    <div className="rounded-xl border border-[#2d2e3e] bg-[#161722]/80 p-5 backdrop-blur-sm space-y-4">
      <ProfileSectionHeader
        icon={Trophy}
        title="DevConnect Performance"
        desc="Your verified scores from AI interviews, coding, mentors, and projects"
      />

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-indigo-500/5 p-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#8b8ca8]">DevConnect Score</p>
          <p className="text-4xl font-bold text-white">{metrics.devScore}</p>
        </div>
        <div className="h-10 w-px bg-[#2d2e3e]" />
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#8b8ca8]">Rank</p>
          <p className="text-sm font-semibold text-amber-300">{metrics.rank}</p>
        </div>
        <div className="h-10 w-px bg-[#2d2e3e]" />
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#8b8ca8]">Leaderboard</p>
          <p className="text-sm font-semibold text-white">#{metrics.leaderboardRank}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {METRIC_CARDS.map(({ key, label, icon: Icon, suffix, color }) => {
          const val = metrics[key]
          const display = key === 'mentorRating' ? val.toFixed(1) : val
          return (
            <div
              key={key}
              className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/60 p-3"
            >
              <div className="mb-2 flex items-center gap-1.5">
                <Icon size={14} className={color} />
                <span className="text-[10px] font-medium text-[#8b8ca8]">{label}</span>
              </div>
              <p className={`text-xl font-bold ${color}`}>
                {display}{suffix}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
