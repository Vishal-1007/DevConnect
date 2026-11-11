import { devConnectApi } from './baseApi'

export interface UserWarning {
  id: string
  accountId: string
  username: string
  message: string
  reason: string
  severity: string
  severityLabel: string
  issuedByUsername: string
  sourceReportId: string | null
  acknowledged: boolean
  acknowledgedAt: string | null
  createdAt: string
}

export interface WarningAnalytics {
  totalWarnings: number
  unacknowledgedWarnings: number
  highSeverityWarnings: number
}

export const DEFAULT_WARNING_MESSAGE = 'Your account violated community guidelines.'

export const adminWarningsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listUserWarnings: build.query<UserWarning[], { status?: string } | undefined>({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('status', params.status ?? 'all')
        return `/api/users/admin/warnings?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminWarnings' as const, id })),
              { type: 'AdminWarnings', id: 'LIST' },
            ]
          : [{ type: 'AdminWarnings', id: 'LIST' }],
    }),
    getWarningAnalytics: build.query<WarningAnalytics, void>({
      query: () => '/api/users/admin/warnings/analytics',
      providesTags: [{ type: 'AdminWarnings', id: 'ANALYTICS' }],
    }),
    createUserWarning: build.mutation<
      UserWarning,
      {
        accountId: string
        username: string
        message?: string
        reason: string
        severity: string
        sourceReportId?: string
      }
    >({
      query: (body) => ({
        url: '/api/users/admin/warnings',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'AdminWarnings', id: 'LIST' },
        { type: 'AdminWarnings', id: 'ANALYTICS' },
      ],
    }),
    acknowledgeUserWarning: build.mutation<UserWarning, string>({
      query: (id) => ({
        url: `/api/users/admin/warnings/${id}/acknowledge`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminWarnings', id },
        { type: 'AdminWarnings', id: 'LIST' },
        { type: 'AdminWarnings', id: 'ANALYTICS' },
      ],
    }),
    deleteUserWarning: build.mutation<void, string>({
      query: (id) => ({
        url: `/api/users/admin/warnings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'AdminWarnings', id: 'LIST' },
        { type: 'AdminWarnings', id: 'ANALYTICS' },
      ],
    }),
  }),
})

export const {
  useListUserWarningsQuery,
  useGetWarningAnalyticsQuery,
  useCreateUserWarningMutation,
  useAcknowledgeUserWarningMutation,
  useDeleteUserWarningMutation,
} = adminWarningsApi
