import { devConnectApi } from './baseApi'

export interface MockInterviewStats {
  interviewerCount: number
  interviewsConducted: number
  averageRating: number
  satisfactionRate: number
}

export interface MockInterviewCategory {
  id: string
  label: string
  mentorCount: number
  averageRating: number
}

export interface MockInterviewerCard {
  id: string
  userId: string
  name: string
  headline: string
  company: string | null
  experience: string | null
  skills: string[]
  rating: number
  totalReviews: number
  totalInterviews: number
  pricePerInterviewCents: number
  priceLabel: string
  profilePicture: string | null
  online: boolean
  favorited: boolean
  requestStatus: string
}

export interface MockInterviewerDetail extends MockInterviewerCard {
  designation: string | null
  bio: string | null
  recentReviews: { reviewerName: string; rating: number; comment: string; createdAt: string }[]
}

export interface MockInterviewRequestItem {
  id: string
  learnerId: string
  learnerName: string
  interviewerId: string
  interviewerName: string
  interviewerPicture: string | null
  interviewType: string
  difficulty: string
  focusTopic: string
  message: string | null
  status: string
  scheduledAt: string | null
  slotEndAt: string | null
  durationMinutes: number | null
  amountCents: number | null
  platformFeeCents: number | null
  paymentStatus: string | null
  sessionCode: string | null
  createdAt: string
  updatedAt: string
}

export interface MockInterviewSession {
  id: string
  requestId: string
  sessionCode: string
  roomId: string
  status: string
  startedAt: string | null
  endedAt: string | null
  request: MockInterviewRequestItem
}

export interface MockInterviewFeedback {
  id: string
  sessionId: string
  learnerId: string
  interviewerId: string
  interviewerName: string
  technicalScore: number
  communicationScore: number
  problemSolvingScore: number
  systemDesignScore: number
  strengths: string | null
  weaknesses: string | null
  recommendations: string | null
  overallRating: number
  createdAt: string
}

export interface UpcomingMockInterview {
  requestId: string
  sessionId: string | null
  sessionCode: string | null
  interviewerId: string
  interviewerName: string
  interviewerPicture: string | null
  interviewType: string
  scheduledAt: string
  status: string
  canJoin: boolean
  joinMessage: string
}

export interface MockInterviewSlot {
  startAt: string
  endAt: string
  date: string
  time: string
  durationMinutes: number
  available: boolean
}

export interface MockInterviewBookingSummary {
  interviewPriceCents: number
  platformFeeCents: number
  totalCents: number
  currency: string
}

export const mockInterviewApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getMockInterviewStats: build.query<MockInterviewStats, void>({
      query: () => '/api/mock-interviews/stats',
      providesTags: ['MockInterviews'],
    }),
    getMockInterviewCategories: build.query<MockInterviewCategory[], void>({
      query: () => '/api/mock-interviews/categories',
      providesTags: ['MockInterviews'],
    }),
    listMockInterviewers: build.query<
      MockInterviewerCard[],
      {
        search?: string
        category?: string
        onlineOnly?: boolean
        minRating?: number
        minPrice?: number
        maxPrice?: number
      }
    >({
      query: (params) => ({ url: '/api/mock-interviews/interviewers', params }),
      providesTags: ['MockInterviews'],
    }),
    getMockInterviewer: build.query<MockInterviewerDetail, string>({
      query: (id) => `/api/mock-interviews/interviewers/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'MockInterviews', id }],
    }),
    createMockInterviewRequest: build.mutation<
      MockInterviewRequestItem,
      {
        interviewerId: string
        interviewType: string
        difficulty: string
        focusTopic: string
        message?: string
        preferredDate?: string
      }
    >({
      query: (body) => ({ url: '/api/mock-interviews/request', method: 'POST', body }),
      invalidatesTags: ['MockInterviewRequests', 'MockInterviews'],
    }),
    listMyMockInterviewRequests: build.query<MockInterviewRequestItem[], string | void>({
      query: (status) => ({
        url: '/api/mock-interviews/my-requests',
        params: status && status !== 'ALL' ? { status } : undefined,
      }),
      providesTags: ['MockInterviewRequests'],
    }),
    listIncomingMockInterviewRequests: build.query<MockInterviewRequestItem[], void>({
      query: () => '/api/mock-interviews/incoming',
      providesTags: ['MockInterviewRequests'],
    }),
    acceptMockInterviewRequest: build.mutation<MockInterviewRequestItem, { requestId: string }>({
      query: (body) => ({ url: '/api/mock-interviews/accept', method: 'POST', body }),
      invalidatesTags: ['MockInterviewRequests', 'MockInterviews'],
    }),
    rejectMockInterviewRequest: build.mutation<MockInterviewRequestItem, { requestId: string }>({
      query: (body) => ({ url: '/api/mock-interviews/reject', method: 'POST', body }),
      invalidatesTags: ['MockInterviewRequests'],
    }),
    cancelMockInterviewRequest: build.mutation<MockInterviewRequestItem, { requestId: string }>({
      query: (body) => ({ url: '/api/mock-interviews/cancel', method: 'POST', body }),
      invalidatesTags: ['MockInterviewRequests', 'MockInterviews'],
    }),
    getUpcomingMockInterview: build.query<UpcomingMockInterview | null, void>({
      query: () => '/api/mock-interviews/upcoming',
      providesTags: ['MockInterviewRequests'],
    }),
    getMockInterviewSession: build.query<MockInterviewSession, string>({
      query: (code) => `/api/mock-interviews/session/${encodeURIComponent(code)}`,
      providesTags: (_r, _e, code) => [{ type: 'MockInterviewSessions', id: code }],
    }),
    startMockInterviewSession: build.mutation<MockInterviewSession, { sessionCode: string }>({
      query: (body) => ({ url: '/api/mock-interviews/start', method: 'POST', body }),
      invalidatesTags: ['MockInterviewSessions', 'MockInterviewRequests'],
    }),
    endMockInterviewSession: build.mutation<MockInterviewSession, { sessionId: string }>({
      query: (body) => ({ url: '/api/mock-interviews/end', method: 'POST', body }),
      invalidatesTags: ['MockInterviewSessions', 'MockInterviewRequests'],
    }),
    submitMockInterviewFeedback: build.mutation<
      MockInterviewFeedback,
      {
        sessionId: string
        technicalScore: number
        communicationScore: number
        problemSolvingScore: number
        systemDesignScore: number
        strengths?: string
        weaknesses?: string
        recommendations?: string
        overallRating: number
      }
    >({
      query: (body) => ({ url: '/api/mock-interviews/feedback', method: 'POST', body }),
      invalidatesTags: ['MockInterviewFeedback', 'MockInterviewRequests'],
    }),
    getMockInterviewFeedback: build.query<MockInterviewFeedback, string>({
      query: (sessionId) => `/api/mock-interviews/feedback/${sessionId}`,
      providesTags: (_r, _e, id) => [{ type: 'MockInterviewFeedback', id }],
    }),
    toggleMockInterviewerFavorite: build.mutation<{ favorited: boolean }, string>({
      query: (interviewerUserId) => ({
        url: `/api/mock-interviews/favorites/${interviewerUserId}`,
        method: 'POST',
      }),
      invalidatesTags: ['MockInterviews'],
    }),
    getMockInterviewSlots: build.query<
      MockInterviewSlot[],
      {
        interviewerId: string
        from?: string
        to?: string
        fromDate?: string
        toDate?: string
        date?: string
        durationMinutes: number
      }
    >({
      query: ({ interviewerId, from, to, fromDate, toDate, date, durationMinutes }) => ({
        url: `/api/mock-interviews/interviewers/${interviewerId}/slots`,
        params: { from, to, fromDate, toDate, date, durationMinutes },
      }),
      providesTags: (_r, _e, { interviewerId }) => [
        { type: 'MockInterviews', id: `slots-${interviewerId}` },
      ],
    }),
    getMockInterviewBookingSummary: build.query<
      MockInterviewBookingSummary,
      { interviewerId: string; durationMinutes: number }
    >({
      query: ({ interviewerId, durationMinutes }) => ({
        url: `/api/mock-interviews/interviewers/${interviewerId}/booking-summary`,
        params: { durationMinutes },
      }),
    }),
    bookMockInterview: build.mutation<
      MockInterviewRequestItem,
      {
        interviewerId: string
        paymentId: string
        interviewType: string
        scheduledAt: string
        durationMinutes: number
        message?: string
      }
    >({
      query: (body) => ({ url: '/api/mock-interviews/book', method: 'POST', body }),
      invalidatesTags: ['MockInterviewRequests', 'MockInterviews'],
    }),
  }),
})

export const {
  useGetMockInterviewStatsQuery,
  useGetMockInterviewCategoriesQuery,
  useListMockInterviewersQuery,
  useGetMockInterviewerQuery,
  useLazyGetMockInterviewerQuery,
  useCreateMockInterviewRequestMutation,
  useListMyMockInterviewRequestsQuery,
  useListIncomingMockInterviewRequestsQuery,
  useAcceptMockInterviewRequestMutation,
  useRejectMockInterviewRequestMutation,
  useCancelMockInterviewRequestMutation,
  useGetUpcomingMockInterviewQuery,
  useGetMockInterviewSessionQuery,
  useStartMockInterviewSessionMutation,
  useEndMockInterviewSessionMutation,
  useSubmitMockInterviewFeedbackMutation,
  useGetMockInterviewFeedbackQuery,
  useToggleMockInterviewerFavoriteMutation,
  useGetMockInterviewSlotsQuery,
  useGetMockInterviewBookingSummaryQuery,
  useBookMockInterviewMutation,
} = mockInterviewApi
