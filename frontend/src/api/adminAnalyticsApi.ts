import { devConnectApi } from './baseApi'

export interface AnalyticsTrendPoint {
  label: string
  value: number
}

export interface BusinessAnalytics {
  totalUsers: number
  activeUsers: number
  dau: number
  mau: number
  dauMauRatioPct: number
  retentionRatePct: number
  retentionDeltaPct: number
  mentorEngagementScore: number
  activeMentors: number
  mentorSessions: number
  sessionCompletionRatePct: number
  userGrowthMoMPct: number
  engagementScore: number
  approvedMentorProfiles: number
  totalPosts: number
  totalSessions: number
  completedSessions: number
  liveSessions: number
  userGrowthTrend: AnalyticsTrendPoint[]
  postGrowthTrend: AnalyticsTrendPoint[]
  sessionGrowthTrend: AnalyticsTrendPoint[]
  roleDistribution: AnalyticsTrendPoint[]
}

export const adminAnalyticsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getBusinessAnalytics: build.query<BusinessAnalytics, void>({
      query: () => '/api/users/admin/analytics/business',
      providesTags: [{ type: 'AdminAnalytics', id: 'BUSINESS' }],
    }),
  }),
})

export const { useGetBusinessAnalyticsQuery } = adminAnalyticsApi
