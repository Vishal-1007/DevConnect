import type { LeaderboardData } from './types'
import { devConnectApi } from './baseApi'

export const leaderboardApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getLeaderboard: build.query<
      LeaderboardData,
      { period?: string; category?: string; limit?: number } | void
    >({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('period', params?.period ?? 'all')
        search.set('category', params?.category ?? 'overall')
        search.set('limit', String(params?.limit ?? 50))
        return `/api/users/leaderboard?${search.toString()}`
      },
      providesTags: [{ type: 'Leaderboard', id: 'LIST' }],
    }),
  }),
})

export const { useGetLeaderboardQuery } = leaderboardApi
