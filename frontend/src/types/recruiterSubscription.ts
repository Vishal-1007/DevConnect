export type RecruiterPlanType = 'FREE' | 'PRO' | 'ENTERPRISE'

export type RecruiterUsageAction =
  | 'JOB_POST'
  | 'DECREMENT_JOB_POST'
  | 'CANDIDATE_SEARCH'
  | 'MESSAGE'
  | 'AI_REPORT'

export type RecruiterFeatureKey =
  | 'basicProfile'
  | 'fullProfile'
  | 'devScore'
  | 'aiMatch'
  | 'mentorReviews'
  | 'resumeDownload'
  | 'talentPool'
  | 'interviewScheduling'
  | 'analytics'
  | 'advancedAnalytics'
  | 'priorityCandidates'
  | 'aiReports'
  | 'apiAccess'
  | 'companyBranding'
  | 'customPipeline'
  | 'bulkExport'
  | 'dedicatedSupport'

export type RecruiterUsageMetric = {
  id: string
  label: string
  used: number
  limit: number
  displayLimit: string
}

export type RecruiterSubscription = {
  planType: RecruiterPlanType
  planName: string
  status: string
  startDate: string
  expiryDate: string | null
  renewalLabel: string
  usage: {
    metrics: RecruiterUsageMetric[]
  }
  features: Record<RecruiterFeatureKey, boolean>
}

export const DEFAULT_FREE_SUBSCRIPTION: RecruiterSubscription = {
  planType: 'FREE',
  planName: 'Free',
  status: 'ACTIVE',
  startDate: new Date().toISOString(),
  expiryDate: null,
  renewalLabel: 'No expiry',
  usage: {
    metrics: [
      { id: 'searches', label: 'Candidate Searches', used: 0, limit: 20, displayLimit: '20' },
      { id: 'messages', label: 'Messages Sent', used: 0, limit: 20, displayLimit: '20' },
      { id: 'jobs', label: 'Job Posts', used: 0, limit: 2, displayLimit: '2' },
      { id: 'ai-reports', label: 'AI Match Reports', used: 0, limit: 0, displayLimit: '0' },
    ],
  },
  features: {
    basicProfile: true,
    fullProfile: false,
    devScore: false,
    aiMatch: false,
    mentorReviews: false,
    resumeDownload: false,
    talentPool: false,
    interviewScheduling: false,
    analytics: false,
    advancedAnalytics: false,
    priorityCandidates: false,
    aiReports: false,
    apiAccess: false,
    companyBranding: false,
    customPipeline: false,
    bulkExport: false,
    dedicatedSupport: false,
  },
}

export const FEATURE_LABELS: Record<RecruiterFeatureKey, string> = {
  basicProfile: 'Basic Candidate Profiles',
  fullProfile: 'Full Candidate Profiles',
  devScore: 'DevScore Breakdown',
  aiMatch: 'AI Match Analysis',
  mentorReviews: 'Mentor Review Details',
  resumeDownload: 'Resume Download',
  talentPool: 'Talent Pool',
  interviewScheduling: 'Interview Scheduling',
  analytics: 'Analytics Dashboard',
  advancedAnalytics: 'Advanced Analytics',
  priorityCandidates: 'Priority Candidate Search',
  aiReports: 'AI Match Reports',
  apiAccess: 'API Access',
  companyBranding: 'Company Branding',
  customPipeline: 'Custom Hiring Pipeline',
  bulkExport: 'Bulk Candidate Export',
  dedicatedSupport: 'Dedicated Support',
}
