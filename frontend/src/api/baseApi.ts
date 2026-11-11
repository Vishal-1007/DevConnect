import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { API_BASE_URL, apiUrl } from '../config'
import { logout, setTokens } from '../store/authSlice'
import type { RootState } from '../store'
import type { LoginResponse } from './types'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
  // Spring often returns 204/empty bodies — default RTK JSON parsing throws PARSING_ERROR
  responseHandler: async (response) => {
    const text = await response.text()
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  },
})

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    const state = api.getState() as RootState
    const refreshToken = state.auth.refreshToken
    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: apiUrl('/api/auth/refresh'),
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      )

      if (refreshResult.data) {
        const data = refreshResult.data as LoginResponse
        api.dispatch(setTokens(data))
        result = await rawBaseQuery(args, api, extraOptions)
      } else {
        api.dispatch(logout())
      }
    } else {
      api.dispatch(logout())
    }
  }

  return result
}

export const devConnectApi = createApi({
  reducerPath: 'devConnectApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Account', 'Profile', 'UserStats', 'MatchRequests', 'Mentors', 'MentorApplications', 'MentorProfileSettings', 'MentorWorkspace', 'MentorAvailability', 'MentorshipRequests', 'AcceptedMentors', 'MockInterviews', 'MockInterviewRequests', 'MockInterviewSessions', 'MockInterviewFeedback', 'AiInterview', 'AiReviewUsage', 'AdminUsers', 'Conversations', 'Messages', 'Feed', 'Discussions', 'Leaderboard', 'Events', 'MentorEvents', 'VideoRooms', 'VideoRoomUsage', 'AdminSessions', 'AdminBookings', 'AdminPayments', 'AdminReports', 'AdminCommunityRooms', 'AdminDiscussions', 'AdminEvents', 'AdminWebinars', 'AdminContentModeration', 'AdminBans', 'AdminWarnings', 'AdminSystemLogs', 'AdminAnalytics', 'AdminFeatures', 'AdminNotifications', 'AdminPlatformHealth', 'AdminLearningResources', 'AdminLearningVideos', 'AdminCodingProblems', 'LearningResources', 'PlatformVideos', 'PlatformFeatures', 'Notifications', 'Payments', 'RecruiterSubscription', 'RecruiterIntegrations', 'StreamCourses', 'Tutorials', 'MentorTutorials', 'TutorialCatalog', 'TutorialReader', 'InterviewMarketplace', 'InterviewPurchases', 'InterviewAssignments', 'InterviewFeedback', 'MentorInterviewPacks', 'MentorInterviewReviews', 'Wallet', 'WalletHistory', 'PaidCalls', 'MarketplaceMentors', 'MentorPricing', 'CodingProblems', 'MentorCodingProblems', 'PairSessions', 'PairChat', 'PairInvitations'],
  endpoints: () => ({}),
})
