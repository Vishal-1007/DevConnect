export type AnalyticsPeriod = 'week' | 'month' | '6months' | 'year'

export const ANALYTICS_PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '6months', label: 'Last 6 Months' },
  { value: 'year', label: 'This Year' },
]

export type FunnelStage = {
  id: string
  label: string
  value: number
  rate: string
  icon: string
}

export const HIRING_FUNNEL: FunnelStage[] = [
  { id: 'views', label: 'Job Views', value: 128, rate: '100%', icon: '👁' },
  { id: 'applications', label: 'Applications', value: 4, rate: '3.13%', icon: '📄' },
  { id: 'shortlisted', label: 'Shortlisted', value: 1, rate: '25%', icon: '⭐' },
  { id: 'interviews', label: 'Interviews', value: 1, rate: '100%', icon: '📅' },
  { id: 'hired', label: 'Hired', value: 0, rate: '0%', icon: '✅' },
]

export const FUNNEL_SUMMARY = {
  overallConversion: '0%',
  avgTimeToHire: '--',
  avgTimeToInterview: '2.5 days',
}

export type DevScoreTier = {
  label: string
  sub: string
  count: number
  percent: number
  color: string
}

export const DEVSCORE_DISTRIBUTION: DevScoreTier[] = [
  { label: '900+', sub: 'Top 5%', count: 2, percent: 50, color: '#10b981' },
  { label: '800–899', sub: '', count: 1, percent: 25, color: '#3b82f6' },
  { label: '600–799', sub: '', count: 1, percent: 25, color: '#8b5cf6' },
  { label: 'Below 600', sub: '', count: 0, percent: 0, color: '#ef4444' },
]

export const DEVSCORE_TOTAL = 4

export type TrendPoint = { date: string; value: number }

export const APPLICATION_TREND_7D: TrendPoint[] = [
  { date: '7 Jun', value: 1 },
  { date: '8 Jun', value: 0 },
  { date: '9 Jun', value: 2 },
  { date: '10 Jun', value: 1 },
  { date: '11 Jun', value: 3 },
  { date: '12 Jun', value: 2 },
  { date: '13 Jun', value: 4 },
]

export const APPLICATION_TREND_30D: TrendPoint[] = [
  { date: '15 May', value: 0 },
  { date: '20 May', value: 1 },
  { date: '25 May', value: 2 },
  { date: '1 Jun', value: 1 },
  { date: '7 Jun', value: 1 },
  { date: '13 Jun', value: 4 },
]

export type SkillDemand = { skill: string; count: number; max: number }

export const TOP_SKILLS_DEMAND: SkillDemand[] = [
  { skill: 'Java', count: 3, max: 3 },
  { skill: 'Spring Boot', count: 3, max: 3 },
  { skill: 'React', count: 2, max: 3 },
  { skill: 'AWS', count: 2, max: 3 },
  { skill: 'MySQL', count: 2, max: 3 },
]

export type TimeToHireStage = { stage: string; days: string }

export const TIME_TO_HIRE_STAGES: TimeToHireStage[] = [
  { stage: 'Application Review', days: '1.5 days' },
  { stage: 'Shortlisting', days: '2.0 days' },
  { stage: 'Interview Scheduling', days: '2.5 days' },
  { stage: 'Offer Sent', days: '--' },
  { stage: 'Total Time to Hire', days: '--' },
]

export type JobPerformanceRow = {
  id: string
  title: string
  views: number
  applications: number
  shortlisted: number
  interviews: number
  hired: number
  conversionRate: number
}

export const JOB_PERFORMANCE: JobPerformanceRow[] = [
  {
    id: 'jp1',
    title: 'Java Backend Developer',
    views: 45,
    applications: 2,
    shortlisted: 1,
    interviews: 1,
    hired: 0,
    conversionRate: 2.22,
  },
  {
    id: 'jp2',
    title: 'React Developer',
    views: 32,
    applications: 1,
    shortlisted: 0,
    interviews: 0,
    hired: 0,
    conversionRate: 0,
  },
  {
    id: 'jp3',
    title: 'DevOps Engineer',
    views: 51,
    applications: 1,
    shortlisted: 0,
    interviews: 0,
    hired: 0,
    conversionRate: 0,
  },
]

export type HiringActivityItem = {
  id: string
  type: 'application' | 'interview' | 'talent-pool' | 'shortlisted'
  title: string
  description: string
  timeAgo: string
}

export const HIRING_ACTIVITIES: HiringActivityItem[] = [
  {
    id: 'ha1',
    type: 'application',
    title: 'New application received',
    description: 'Karthik Reddy applied for Java Backend Developer',
    timeAgo: '1 hour ago',
  },
  {
    id: 'ha2',
    type: 'interview',
    title: 'Interview scheduled',
    description: 'With Vishal Gupta on 15 Jun, 03:00 PM',
    timeAgo: '2 hours ago',
  },
  {
    id: 'ha3',
    type: 'talent-pool',
    title: 'Candidate added to talent pool',
    description: 'Ananya Singh — Full Stack Developer',
    timeAgo: '3 hours ago',
  },
  {
    id: 'ha4',
    type: 'shortlisted',
    title: 'Candidate shortlisted',
    description: 'Priya Sharma moved to shortlist',
    timeAgo: '5 hours ago',
  },
]
