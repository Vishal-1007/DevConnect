import { useState } from 'react'
import { Briefcase, Calendar, FileText, Star } from 'lucide-react'
import type { AnalyticsPeriod } from '../../../data/recruiterAnalyticsData'
import type { RecruiterAnalyticsStats } from '../../../lib/recruiterPortalState'
import type { RecruiterTab } from '../RecruiterSidebar'
import { FeatureGuard } from '../subscription/FeatureGuard'
import { AnalyticsCard } from './AnalyticsCard'
import { HiringFunnel } from './HiringFunnel'
import { DevScoreChart } from './DevScoreChart'
import { ApplicationTrend } from './ApplicationTrend'
import { SkillsDemand } from './SkillsDemand'
import { TimeToHire } from './TimeToHire'
import { JobPerformance } from './JobPerformance'
import { HiringActivity } from './HiringActivity'

type Props = {
  stats: RecruiterAnalyticsStats
  onNavigate: (tab: RecruiterTab, filter?: string) => void
}

const KPI_CARDS = [
  {
    key: 'activeJobs' as const,
    label: 'Active Jobs',
    icon: Briefcase,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    spark: '#3b82f6',
    tab: 'jobs' as RecruiterTab,
  },
  {
    key: 'applications' as const,
    label: 'Applications',
    icon: FileText,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    spark: '#10b981',
    tab: 'applications' as RecruiterTab,
  },
  {
    key: 'shortlisted' as const,
    label: 'Shortlisted',
    icon: Star,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    spark: '#8b5cf6',
    tab: 'applications' as RecruiterTab,
  },
  {
    key: 'interviews' as const,
    label: 'Interviews',
    icon: Calendar,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    spark: '#f59e0b',
    tab: 'interviews' as RecruiterTab,
  },
]

export function RecruiterAnalyticsPage({ stats, onNavigate }: Props) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map(({ key, label, icon, color, bg, spark, tab }) => (
          <AnalyticsCard
            key={key}
            label={label}
            value={stats[key].value}
            delta={stats[key].delta}
            icon={icon}
            color={color}
            bg={bg}
            spark={spark}
            onClick={() => onNavigate(tab, key)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <FeatureGuard feature="advancedAnalytics">
          <HiringFunnel period={period} onPeriodChange={setPeriod} />
        </FeatureGuard>
        <FeatureGuard feature="advancedAnalytics">
          <DevScoreChart
            period={period}
            onPeriodChange={setPeriod}
            onViewCandidates={() => onNavigate('candidates')}
          />
        </FeatureGuard>
      </div>

      <FeatureGuard feature="advancedAnalytics">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ApplicationTrend />
        <SkillsDemand onViewReport={() => onNavigate('jobs')} />
        <TimeToHire onViewDetails={() => onNavigate('interviews')} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <JobPerformance onViewAll={() => onNavigate('jobs')} />
        <HiringActivity
          period={period}
          onPeriodChange={setPeriod}
          onViewAll={() => onNavigate('dashboard')}
        />
      </div>
      </FeatureGuard>
    </div>
  )
}
