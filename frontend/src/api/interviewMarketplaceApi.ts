import { devConnectApi } from './baseApi'

export interface InterviewPackCard {
  id: string
  title: string
  description: string
  thumbnailUrl: string | null
  mentorName: string
  mentorId: string
  mentorRating: number
  difficulty: string
  difficultyLabel: string
  questionCount: number
  durationMinutes: number
  visibility: string
  status: string
  priceCents: number
  currency: string
  priceLabel: string
  validityLabel: string
  avgRating: number
  reviewCount: number
  salesCount: number
  purchased: boolean
  free: boolean
  tags: string[]
}

export interface InterviewPackDetail extends InterviewPackCard {
  instructions: string | null
  validityDays: number | null
  hasAccess: boolean
  sampleQuestions: InterviewQuestionPreview[]
  questions: InterviewQuestionPreview[]
  reviews: InterviewPackReview[]
}

export interface InterviewQuestionPreview {
  id: string
  title: string
  questionText: string
  category: string
  categoryLabel: string
  difficulty: string
  difficultyLabel: string
  estimatedMinutes: number | null
  locked: boolean
}

export interface InterviewPackReview {
  id: string
  learnerName: string
  rating: number
  reviewText: string | null
  createdAtLabel: string
}

export interface InterviewAssignmentCard {
  id: string
  questionSetId: string
  packTitle: string
  mentorName: string
  mentorId: string
  questionCount: number
  dueDateLabel: string
  dueAt: string | null
  status: string
  statusLabel: string
  hasFeedback: boolean
  overallScore: number | null
  assignedAt: string
}

export interface InterviewAssignmentDetail {
  id: string
  questionSetId: string
  packTitle: string
  instructions: string | null
  durationMinutes: number
  status: string
  questions: InterviewQuestionSolve[]
  submissions: InterviewSubmission[]
  feedback: InterviewFeedback | null
}

export interface InterviewQuestionSolve {
  id: string
  index: number
  title: string
  questionText: string
  description: string | null
  category: string
  difficulty: string
  estimatedMinutes: number | null
}

export interface InterviewSubmission {
  questionId: string
  answerType: string
  answerText: string | null
  answerCode: string | null
  codeLanguage: string | null
  fileUrl: string | null
  fileName: string | null
}

export interface InterviewFeedback {
  id: string
  overallScore: number
  strengths: string | null
  improvements: string | null
  recommendations: string | null
  comments: string | null
  reviewedAtLabel: string
}

export interface InterviewPurchase {
  id: string
  questionSetId: string
  packTitle: string
  thumbnailUrl: string | null
  mentorName: string
  amountCents: number
  currency: string
  amountLabel: string
  status: string
  purchasedAtLabel: string
  expiresAtLabel: string
  expired: boolean
  hasAccess: boolean
}

export interface InterviewPage<T> {
  items: T[]
  page: number
  size: number
  total: number
  hasMore: boolean
}

export interface InterviewAnalytics {
  questionSetsCreated: number
  publicFreePacks: number
  publicPaidPacks: number
  privateAssignments: number
  totalPurchases: number
  revenueCents: number
  revenueLabel: string
  pendingReviews: number
  averageRating: number
  completionRatePct: number
}

export interface CreateInterviewPackRequest {
  title: string
  description?: string
  instructions?: string
  durationMinutes: number
  difficulty: string
  thumbnailUrl?: string
  tags?: string
  visibility: 'ASSIGNED_ONLY' | 'PUBLIC_FREE' | 'PUBLIC_PAID'
  priceCents: number
  currency?: string
  validityDays?: number | null
  questionIds: string[]
  assignToLearnerIds?: string[]
  dueAt?: string | null
  publish?: boolean
}

export const interviewMarketplaceApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    browseInterviewPacks: build.query<
      InterviewPage<InterviewPackCard>,
      { search?: string; category?: string; difficulty?: string; mentorId?: string; minPrice?: number; maxPrice?: number; minRating?: number; page?: number; size?: number }
    >({
      query: (params) => ({ url: '/api/mentors/interview-marketplace/packs', params }),
      providesTags: ['InterviewMarketplace'],
    }),
    getInterviewPack: build.query<InterviewPackDetail, { id: string; preview?: boolean }>({
      query: ({ id, preview }) => ({ url: `/api/mentors/interview-marketplace/packs/${id}`, params: preview ? { preview: true } : undefined }),
      providesTags: (_r, _e, { id }) => [{ type: 'InterviewMarketplace', id }],
    }),
    purchaseInterviewPack: build.mutation<InterviewPackCard, { id: string; paymentId: string }>({
      query: ({ id, paymentId }) => ({
        url: `/api/mentors/interview-marketplace/packs/${id}/purchase`,
        method: 'POST',
        body: { paymentId },
      }),
      invalidatesTags: ['InterviewMarketplace', 'InterviewPurchases'],
    }),
    enrollFreeInterviewPack: build.mutation<InterviewPackCard, string>({
      query: (id) => ({ url: `/api/mentors/interview-marketplace/packs/${id}/enroll`, method: 'POST' }),
      invalidatesTags: ['InterviewMarketplace', 'InterviewPurchases'],
    }),
    myInterviewPurchases: build.query<InterviewPage<InterviewPurchase>, { page?: number; size?: number }>({
      query: (params) => ({ url: '/api/mentors/interview-marketplace/purchases', params }),
      providesTags: ['InterviewPurchases'],
    }),
    myInterviewAssignments: build.query<InterviewAssignmentCard[], void>({
      query: () => '/api/mentors/interview-marketplace/assignments',
      providesTags: ['InterviewAssignments'],
    }),
    getInterviewAssignment: build.query<InterviewAssignmentDetail, string>({
      query: (id) => `/api/mentors/interview-marketplace/assignments/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'InterviewAssignments', id }],
    }),
    submitInterviewAnswers: build.mutation<
      InterviewAssignmentDetail,
      { id: string; answers: { questionId: string; answerType: string; answerText?: string; answerCode?: string; codeLanguage?: string; fileUrl?: string; fileName?: string }[] }
    >({
      query: ({ id, answers }) => ({
        url: `/api/mentors/interview-marketplace/assignments/${id}/submit`,
        method: 'POST',
        body: { answers },
      }),
      invalidatesTags: ['InterviewAssignments'],
    }),
    myInterviewFeedback: build.query<InterviewFeedback[], void>({
      query: () => '/api/mentors/interview-marketplace/feedback',
      providesTags: ['InterviewFeedback'],
    }),
    mentorInterviewPacks: build.query<InterviewPackCard[], void>({
      query: () => '/api/mentors/me/workspace/interview-packs',
      providesTags: ['MentorInterviewPacks'],
    }),
    createInterviewPack: build.mutation<InterviewPackCard, CreateInterviewPackRequest>({
      query: (body) => ({ url: '/api/mentors/me/workspace/interview-packs', method: 'POST', body }),
      invalidatesTags: ['MentorInterviewPacks', 'InterviewMarketplace'],
    }),
    updateInterviewPack: build.mutation<InterviewPackCard, { id: string; body: Partial<CreateInterviewPackRequest> }>({
      query: ({ id, body }) => ({ url: `/api/mentors/me/workspace/interview-packs/${id}`, method: 'PUT', body }),
      invalidatesTags: ['MentorInterviewPacks', 'InterviewMarketplace'],
    }),
    deleteInterviewPack: build.mutation<void, string>({
      query: (id) => ({ url: `/api/mentors/me/workspace/interview-packs/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MentorInterviewPacks', 'InterviewMarketplace'],
    }),
    duplicateInterviewPack: build.mutation<void, string>({
      query: (id) => ({ url: `/api/mentors/me/workspace/interview-packs/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: ['MentorInterviewPacks'],
    }),
    publishInterviewPack: build.mutation<InterviewPackCard, string>({
      query: (id) => ({ url: `/api/mentors/me/workspace/interview-packs/${id}/publish`, method: 'POST' }),
      invalidatesTags: ['MentorInterviewPacks', 'InterviewMarketplace'],
    }),
    mentorInterviewAssignments: build.query<InterviewAssignmentCard[], { status?: string } | void>({
      query: (params) => ({ url: '/api/mentors/me/workspace/interview-packs/assignments', params: params ?? undefined }),
      providesTags: ['MentorInterviewReviews'],
    }),
    mentorInterviewAssignmentDetail: build.query<InterviewAssignmentDetail, string>({
      query: (id) => `/api/mentors/me/workspace/interview-packs/assignments/${id}`,
    }),
    submitMentorInterviewFeedback: build.mutation<
      InterviewFeedback,
      { id: string; overallScore: number; strengths?: string; improvements?: string; recommendations?: string; comments?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/mentors/me/workspace/interview-packs/assignments/${id}/feedback`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MentorInterviewReviews', 'InterviewAssignments', 'InterviewFeedback'],
    }),
    mentorInterviewAnalytics: build.query<InterviewAnalytics, void>({
      query: () => '/api/mentors/me/workspace/interview-packs/analytics',
    }),
  }),
})

export const {
  useBrowseInterviewPacksQuery,
  useGetInterviewPackQuery,
  usePurchaseInterviewPackMutation,
  useEnrollFreeInterviewPackMutation,
  useMyInterviewPurchasesQuery,
  useMyInterviewAssignmentsQuery,
  useGetInterviewAssignmentQuery,
  useSubmitInterviewAnswersMutation,
  useMyInterviewFeedbackQuery,
  useMentorInterviewPacksQuery,
  useCreateInterviewPackMutation,
  useUpdateInterviewPackMutation,
  useDeleteInterviewPackMutation,
  useDuplicateInterviewPackMutation,
  usePublishInterviewPackMutation,
  useMentorInterviewAssignmentsQuery,
  useMentorInterviewAssignmentDetailQuery,
  useSubmitMentorInterviewFeedbackMutation,
  useMentorInterviewAnalyticsQuery,
} = interviewMarketplaceApi
