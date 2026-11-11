import { devConnectApi } from './baseApi'

export interface PlatformReport {
  id: string
  reportCode: string
  category: string
  categoryLabel: string
  targetType: string
  targetTypeLabel: string
  targetId: string | null
  targetSummary: string
  targetAccountId: string | null
  reporterId: string
  reporterUsername: string
  details: string | null
  status: string
  statusLabel: string
  adminAction: string | null
  adminActionLabel: string | null
  adminNote: string | null
  reviewedByUsername: string | null
  createdAt: string
  dateLabel: string
  resolvedAt: string | null
  banTargetAccountId: string | null
}

export interface ReportAnalytics {
  totalReports: number
  pendingCount: number
  underReviewCount: number
  resolvedCount: number
  escalatedCount: number
  reportsByCategory: Record<string, number>
}

export const REPORT_CATEGORY_COLORS: Record<string, string> = {
  harassment: 'red',
  spam: 'amber',
  fake_profile: 'purple',
  abusive_language: 'red',
  scam_attempt: 'amber',
}

export const REPORT_STATUS_COLORS: Record<string, string> = {
  pending: 'amber',
  under_review: 'blue',
  resolved: 'green',
  escalated: 'red',
}

export const adminReportsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listAdminReports: build.query<
      PlatformReport[],
      { status?: string; category?: string; targetType?: string; q?: string; limit?: number } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('status', params.status ?? 'all')
        if (params.category && params.category !== 'all') search.set('category', params.category)
        if (params.targetType && params.targetType !== 'all') search.set('targetType', params.targetType)
        if (params.q?.trim()) search.set('q', params.q.trim())
        search.set('limit', String(params.limit ?? 100))
        return `/api/users/admin/reports?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminReports' as const, id })),
              { type: 'AdminReports', id: 'LIST' },
            ]
          : [{ type: 'AdminReports', id: 'LIST' }],
    }),
    getReportAnalytics: build.query<ReportAnalytics, void>({
      query: () => '/api/users/admin/reports/analytics',
      providesTags: [{ type: 'AdminReports', id: 'ANALYTICS' }],
    }),
    getAdminReport: build.query<PlatformReport, string>({
      query: (id) => `/api/users/admin/reports/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AdminReports', id }],
    }),
    markReportUnderReview: build.mutation<PlatformReport, string>({
      query: (id) => ({ url: `/api/users/admin/reports/${id}/review`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminReports', id },
        { type: 'AdminReports', id: 'LIST' },
        { type: 'AdminReports', id: 'ANALYTICS' },
      ],
    }),
    escalateReport: build.mutation<PlatformReport, string>({
      query: (id) => ({ url: `/api/users/admin/reports/${id}/escalate`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminReports', id },
        { type: 'AdminReports', id: 'LIST' },
        { type: 'AdminReports', id: 'ANALYTICS' },
      ],
    }),
    applyReportAction: build.mutation<PlatformReport, { id: string; action: string; note?: string }>({
      query: ({ id, action, note }) => ({
        url: `/api/users/admin/reports/${id}/action`,
        method: 'POST',
        body: { action, note },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AdminReports', id },
        { type: 'AdminReports', id: 'LIST' },
        { type: 'AdminReports', id: 'ANALYTICS' },
        { type: 'Feed', id: 'LIST' },
        { type: 'AdminUsers', id: 'LIST' },
        { type: 'AdminBans', id: 'LIST' },
        { type: 'AdminBans', id: 'ANALYTICS' },
        { type: 'AdminWarnings', id: 'LIST' },
        { type: 'AdminWarnings', id: 'ANALYTICS' },
      ],
    }),
  }),
})

export const {
  useListAdminReportsQuery,
  useGetReportAnalyticsQuery,
  useGetAdminReportQuery,
  useMarkReportUnderReviewMutation,
  useEscalateReportMutation,
  useApplyReportActionMutation,
} = adminReportsApi
