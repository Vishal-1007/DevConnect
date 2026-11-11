import { devConnectApi } from './baseApi'

export interface SystemLogEntry {
  id: string
  level: string
  levelLabel: string
  service: string
  category: string
  categoryLabel: string
  message: string
  details: string | null
  createdAt: string
  timeLabel: string
}

export interface SystemLogAnalytics {
  totalLogs: number
  infoCount: number
  warnCount: number
  errorCount: number
  debugCount: number
  loginAttempts: number
  apiErrors: number
  paymentFailures: number
  serverIssues: number
}

export const adminSystemLogsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listSystemLogs: build.query<
      SystemLogEntry[],
      { level?: string; category?: string; service?: string; q?: string; limit?: number } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('level', params.level ?? 'all')
        if (params.category && params.category !== 'all') search.set('category', params.category)
        if (params.service && params.service !== 'all') search.set('service', params.service)
        if (params.q?.trim()) search.set('q', params.q.trim())
        search.set('limit', String(params.limit ?? 200))
        return `/api/users/admin/system-logs?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminSystemLogs' as const, id })),
              { type: 'AdminSystemLogs', id: 'LIST' },
            ]
          : [{ type: 'AdminSystemLogs', id: 'LIST' }],
    }),
    getSystemLogAnalytics: build.query<SystemLogAnalytics, void>({
      query: () => '/api/users/admin/system-logs/analytics',
      providesTags: [{ type: 'AdminSystemLogs', id: 'ANALYTICS' }],
    }),
  }),
})

export const {
  useListSystemLogsQuery,
  useGetSystemLogAnalyticsQuery,
} = adminSystemLogsApi
