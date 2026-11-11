import type { LiveMatchAssignment, LiveMatchStatus, MatchRequest, MatchResult } from './types'
import { devConnectApi } from './baseApi'

export const matchingApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    upsertMatchIndex: build.mutation<
      void,
      { experienceLevel?: string; skills?: string[] }
    >({
      query: (body) => ({
        url: '/api/matching/index',
        method: 'PUT',
        body,
      }),
    }),
    createMatchRequest: build.mutation<
      MatchRequest,
      { criteria: string; experienceLevel?: string; skills?: string[] }
    >({
      query: (body) => ({
        url: '/api/matching/requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MatchRequests', { type: 'UserStats', id: 'ME' }],
    }),
    listMatchRequests: build.query<MatchRequest[], void>({
      query: () => '/api/matching/requests',
      providesTags: ['MatchRequests'],
    }),
    getMatchResults: build.query<MatchResult[], string>({
      query: (requestId) => `/api/matching/requests/${requestId}/results`,
      keepUnusedDataFor: 0,
    }),
    mentorGoLive: build.mutation<LiveMatchStatus, { criteria: string; experienceLevel?: string; skills?: string[] }>({
      query: (body) => ({
        url: '/api/matching/live/mentor/enable',
        method: 'POST',
        body,
      }),
    }),
    mentorGoOffline: build.mutation<LiveMatchStatus, void>({
      query: () => ({
        url: '/api/matching/live/mentor/disable',
        method: 'POST',
      }),
    }),
    learnerSearch: build.mutation<LiveMatchStatus, { criteria: string; experienceLevel?: string; skills?: string[] }>({
      query: (body) => ({
        url: '/api/matching/live/learner/search',
        method: 'POST',
        body,
      }),
    }),
    getLiveMatchStatus: build.query<LiveMatchStatus, void>({
      query: () => '/api/matching/live/status',
      keepUnusedDataFor: 0,
    }),
    acceptLiveMatch: build.mutation<LiveMatchAssignment, string>({
      query: (assignmentId) => ({
        url: `/api/matching/live/assignments/${assignmentId}/accept`,
        method: 'POST',
      }),
    }),
    rejectLiveMatch: build.mutation<LiveMatchAssignment, string>({
      query: (assignmentId) => ({
        url: `/api/matching/live/assignments/${assignmentId}/reject`,
        method: 'POST',
      }),
    }),
    cancelLiveMatch: build.mutation<LiveMatchStatus, void>({
      query: () => ({
        url: '/api/matching/live/cancel',
        method: 'POST',
      }),
    }),
    endLiveSession: build.mutation<LiveMatchStatus, void>({
      query: () => ({
        url: '/api/matching/live/end',
        method: 'POST',
      }),
    }),
  }),
})

export const {
  useUpsertMatchIndexMutation,
  useCreateMatchRequestMutation,
  useListMatchRequestsQuery,
  useGetMatchResultsQuery,
  useLazyGetMatchResultsQuery,
  useMentorGoLiveMutation,
  useMentorGoOfflineMutation,
  useLearnerSearchMutation,
  useGetLiveMatchStatusQuery,
  useLazyGetLiveMatchStatusQuery,
  useAcceptLiveMatchMutation,
  useRejectLiveMatchMutation,
  useCancelLiveMatchMutation,
  useEndLiveSessionMutation,
} = matchingApi
