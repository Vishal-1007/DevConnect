import { devConnectApi } from './baseApi'

export interface UserBan {
  id: string
  accountId: string
  username: string
  banType: string
  banTypeLabel: string
  reason: string
  bannedByUsername: string
  sourceReportId: string | null
  bannedAt: string
  expiresAt: string | null
  restoredAt: string | null
  restoreNote: string | null
  active: boolean
  offenseCount: number
  repeatedOffender: boolean
  durationLabel: string
}

export interface BanAnalytics {
  activeBans: number
  permanentBans: number
  temporaryBans: number
  repeatedOffenders: number
  totalBanHistory: number
}

export const adminBansApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listUserBans: build.query<UserBan[], { status?: string } | undefined>({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('status', params.status ?? 'active')
        return `/api/users/admin/bans?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminBans' as const, id })),
              { type: 'AdminBans', id: 'LIST' },
            ]
          : [{ type: 'AdminBans', id: 'LIST' }],
    }),
    getBanAnalytics: build.query<BanAnalytics, void>({
      query: () => '/api/users/admin/bans/analytics',
      providesTags: [{ type: 'AdminBans', id: 'ANALYTICS' }],
    }),
    createUserBan: build.mutation<
      UserBan,
      {
        accountId: string
        username: string
        banType: string
        reason: string
        durationDays?: number
        sourceReportId?: string
      }
    >({
      query: (body) => ({
        url: '/api/users/admin/bans',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'AdminBans', id: 'LIST' },
        { type: 'AdminBans', id: 'ANALYTICS' },
        'AdminUsers',
      ],
    }),
    restoreUserBan: build.mutation<UserBan, { id: string; note?: string }>({
      query: ({ id, note }) => ({
        url: `/api/users/admin/bans/${id}/restore`,
        method: 'POST',
        body: note ? { note } : {},
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AdminBans', id },
        { type: 'AdminBans', id: 'LIST' },
        { type: 'AdminBans', id: 'ANALYTICS' },
        'AdminUsers',
      ],
    }),
  }),
})

export const {
  useListUserBansQuery,
  useGetBanAnalyticsQuery,
  useCreateUserBanMutation,
  useRestoreUserBanMutation,
} = adminBansApi
