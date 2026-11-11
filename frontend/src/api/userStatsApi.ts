import type { UserStats } from './types'
import { devConnectApi } from './baseApi'

export const userStatsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getUserStats: build.query<UserStats, void>({
      query: () => '/api/users/me/stats',
      providesTags: [{ type: 'UserStats', id: 'ME' }],
    }),
  }),
})

export const { useGetUserStatsQuery } = userStatsApi
