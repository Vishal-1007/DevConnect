import type { MentorshipBooking } from './adminBookingsApi'
import { devConnectApi } from './baseApi'

export interface MentorDashboard {
  totalEarningsCents: number
  totalEarningsLabel: string
  monthlyEarningsCents: number
  monthlyEarningsLabel: string
  sessionsCompleted: number
  activeStudents: number
  averageRating: number
  ratingCount: number
  completionRatePct: number
  responseTimeMinutes: number
  earningsGrowthPct: number
  sessionsGrowthPct: number
  studentsGrowthPct: number
  pendingBookingCount: number
  mentorRankLabel: string
  todaySchedule: MentorScheduleItem[]
  upcomingSessions: MentorScheduleItem[]
  pendingRequests: MentorPendingRequest[]
  topStudents: MentorStudentSummary[]
  earningsTrend: RevenueTrendPoint[]
  sessionsTrend: RevenueTrendPoint[]
  ratingGrowthPct: number
  responseTimeGrowthPct: number
  aiSuggestions: string[]
  highlightedStudent: MentorStudentProgressHighlight | null
}

export interface MentorPendingRequest {
  bookingId: string
  bookingCode: string
  learnerId: string
  learnerName: string
  requestType: string
  requestTypeLabel: string
  topic: string
  message: string
  premiumLearner: boolean
  priorityScore: number
  requestedAtLabel: string
  requestedAt: string
  scheduledAtLabel: string
  scheduledAt: string
  durationMinutes: number
  amountLabel: string
}

export interface MentorStudentProgressHighlight {
  learnerId: string
  name: string
  overallProgressPct: number
  topics: { topic: string; progressPct: number }[]
}

export interface MentorScheduleItem {
  bookingId: string
  timeLabel: string
  title: string
  studentName: string
  status: string
}

export interface MentorStudentSummary {
  learnerId: string
  name: string
  sessions: number
  rating: number
  progressPct: number
}

export interface MentorStudent {
  learnerId: string
  name: string
  role: string
  sessions: number
  progressPct: number
  weakArea: string
  strongArea: string
  status: string
  lastSessionLabel: string
  lastSessionAt: string | null
  category: string
  categoryLabel: string
  interviewReadinessPct: number
  interviewTarget: string
  notesPreview: string
  assignedTaskCount: number
  pendingTaskCount: number
  improvementPct: number
}

export interface MentorStudentDetail extends MentorStudent {
  notes: string
  sessionHistory: MentorStudentSessionHistoryItem[]
  tasks: MentorStudentTask[]
  roadmap: MentorStudentRoadmapItem[]
  improvementTrend: MentorStudentImprovementPoint[]
}

export interface MentorStudentSessionHistoryItem {
  bookingId: string
  bookingCode: string
  title: string
  requestType: string
  status: string
  dateLabel: string
  durationMinutes: number
  scheduledAt: string
}

export interface MentorStudentTask {
  id: string
  title: string
  description: string
  status: string
  dueDate: string | null
  dueDateLabel: string
  createdAt: string
}

export interface MentorStudentRoadmapItem {
  id: string
  title: string
  milestone: string
  sortOrder: number
  status: string
}

export interface MentorStudentImprovementPoint {
  label: string
  progressPct: number
}

export interface UpdateMentorStudentRequest {
  category?: string
  weakArea?: string
  strongArea?: string
  notes?: string
  interviewReadinessPct?: number
  interviewTarget?: string
}

export interface MentorEarnings {
  totalEarningsCents: number
  totalEarningsLabel: string
  monthlyRevenueCents: number
  monthlyRevenueLabel: string
  sessionRevenueCents: number
  sessionRevenueLabel: string
  pendingPayoutCents: number
  pendingPayoutLabel: string
  platformFeeCents: number
  platformFeeLabel: string
  commissionRatePct: number
  netEarningsCents: number
  netEarningsLabel: string
  revenueGrowthPct: number
  revenueTrend: RevenueTrendPoint[]
  transactions: MentorTransaction[]
  payoutHistory: MentorPayoutHistory[]
  withdrawalRequests: MentorWithdrawal[]
  paymentAnalytics: MentorPaymentAnalytics
}

export interface MentorPayoutHistory {
  id: string
  payoutCode: string
  amountCents: number
  amountLabel: string
  status: string
  method: string
  createdAt: string
  completedAt: string | null
  dateLabel: string
}

export interface MentorWithdrawal {
  id: string
  withdrawalCode: string
  amountCents: number
  amountLabel: string
  status: string
  note: string | null
  requestedAt: string
  processedAt: string | null
  dateLabel: string
}

export interface MentorPaymentBreakdown {
  category: string
  amountCents: number
  amountLabel: string
  sessionCount: number
  sharePct: number
}

export interface MentorPaymentAnalytics {
  sessionRevenueCents: number
  sessionRevenueLabel: string
  commissionRatePct: number
  netEarningsCents: number
  netEarningsLabel: string
  availableBalanceCents: number
  availableBalanceLabel: string
  revenueByCategory: MentorPaymentBreakdown[]
}

export interface MentorTransaction {
  bookingId: string
  code: string
  description: string
  amountCents: number
  amountLabel: string
  date: string
  dateLabel: string
  status: string
}

export interface MentorAnalytics {
  sessionsCompleted: number
  sessionsGrowthPct: number
  completionRatePct: number
  completionRateGrowthPct: number
  averageDurationMinutes: number
  durationChangePct: number
  studentRetentionPct: number
  retentionGrowthPct: number
  averageRating: number
  fiveStarSessions: number
  repeatStudents: number
  responseTimeMinutes: number
  noShowRatePct: number
  sessionsByMonth: number[]
  topicPerformance: { topic: string; scorePct: number }[]
  teachingTips: string[]
}

export interface MentorPerformanceInsight {
  id: string
  type: string
  title: string
  body: string
  actionLabel: string
  actionTarget: string
}

export interface MentorPerformanceInsights {
  studentSatisfactionScore: number
  topPerformingTopic: string
  improvementArea: string
  bookingTrend: string
  insights: MentorPerformanceInsight[]
}

export interface MentorLeaderboardEntry {
  rank: number
  mentorId: string
  displayName: string
  headline: string
  averageRating: number
  sessionsCompleted: number
  points: number
  streakDays: number
  retentionPct: number
  currentUser: boolean
}

export interface MentorLeaderboard {
  entries: MentorLeaderboardEntry[]
  currentUser: MentorLeaderboardEntry
  period: string
  totalMentors: number
}

export type MentorSharedNoteType = 'note' | 'pdf' | 'interview_question' | 'roadmap' | 'code_sample'

export interface MentorSharedNote {
  id: string
  title: string
  content: string | null
  materialType: MentorSharedNoteType
  materialTypeLabel: string
  tags: string[]
  fileName: string | null
  fileMimeType: string | null
  fileSizeBytes: number | null
  hasFile: boolean
  sharedWithLearnerIds: string[]
  sharedCount: number
  linkedBookingId: string | null
  published: boolean
  createdAtLabel: string
  updatedAtLabel: string
}

export interface MentorSharedNoteFile {
  id: string
  fileName: string
  fileMimeType: string
  fileSizeBytes: number
  fileDataBase64: string
}

export interface CreateMentorSharedNoteRequest {
  title: string
  content?: string
  materialType: MentorSharedNoteType
  tags?: string[]
  fileName?: string
  fileMimeType?: string
  fileDataBase64?: string
  sharedWithLearnerIds?: string[]
  linkedBookingId?: string
  published?: boolean
}

export type MentorInterviewQuestionCategory =
  | 'dsa' | 'system_design' | 'java' | 'react' | 'spring_boot' | 'hr'

export type MentorInterviewQuestionDifficulty = 'easy' | 'medium' | 'hard'

export interface MentorInterviewQuestion {
  id: string
  category: MentorInterviewQuestionCategory
  categoryLabel: string
  difficulty: MentorInterviewQuestionDifficulty
  difficultyLabel: string
  questionText: string
  followUps: string | null
  evaluationHints: string | null
  aiGenerated: boolean
  template: boolean
  custom: boolean
  saved: boolean
  createdAtLabel: string
}

export interface CreateMentorInterviewQuestionRequest {
  category: MentorInterviewQuestionCategory
  difficulty: MentorInterviewQuestionDifficulty
  questionText: string
  followUps?: string
  evaluationHints?: string
  template?: boolean
}

export interface AvailabilitySlot {
  id: string
  dayOfWeek: number
  dayLabel: string
  startTime: string
  endTime: string
  timezone: string
  active: boolean
}

export interface MentorMyAvailability {
  vacationMode: boolean
  acceptingBookings: boolean
  autoSchedulingEnabled: boolean
  timezone: string
  workingHoursSummary: string
  slots: AvailabilitySlot[]
}

export interface MentorBookingsOverview {
  confirmedCount: number
  pendingCount: number
  completedCount: number
  cancelledCount: number
  upcomingCount: number
  timezone: string
  reminders: MentorBookingReminder[]
  recurringPlans: MentorRecurringPlan[]
}

export interface MentorBookingReminder {
  bookingId: string
  bookingCode: string
  title: string
  learnerName: string
  scheduledAt: string
  scheduledLabel: string
  reminderLabel: string
  minutesUntil: number
}

export interface MentorRecurringPlan {
  id: string
  learnerId: string
  learnerName: string
  title: string
  frequency: string
  frequencyLabel: string
  dayOfWeek: number
  dayLabel: string
  startTime: string
  durationMinutes: number
  durationLabel: string
  status: string
  nextSessionAt: string | null
  nextSessionLabel: string
}

export interface SaveMentorAvailabilityRequest {
  vacationMode: boolean
  autoSchedulingEnabled: boolean
  timezone: string
  slots: { dayOfWeek: number; startTime: string; endTime: string }[]
}

export interface RevenueTrendPoint {
  label: string
  amountCents: number
}

export interface MentorMentorshipPlan {
  id: string
  title: string
  description: string
  planType: string
  planTypeLabel: string
  billingType: string
  billingTypeLabel: string
  priceCents: number
  priceLabel: string
  sessionLimit: number
  sessionLimitLabel: string
  durationMinutes: number
  durationLabel: string
  premiumSupport: boolean
  popular: boolean
  active: boolean
  sortOrder: number
  features: string[]
}

export interface MentorReview {
  id: string
  learnerId: string | null
  learnerName: string
  rating: number
  reviewText: string
  topic: string
  improvementSuggestion: string
  mentorReply: string
  showcased: boolean
  createdAtLabel: string
  createdAt: string
  repliedAtLabel: string
}

export interface MentorFeedbackTestimonial {
  studentName: string
  rating: number
  comment: string
  createdAt: string
}

export interface MentorReviewsSummary {
  averageRating: number
  totalReviews: number
  totalTestimonials: number
  trustScorePct: number
  visibilityBoostPct: number
  ratingDistribution: Record<string, number>
  improvementSuggestions: string[]
  testimonials: MentorFeedbackTestimonial[]
  reviews: MentorReview[]
}

export interface CreateMentorPlanRequest {
  title: string
  description?: string
  planType: string
  billingType: string
  priceCents: number
  sessionLimit: number
  durationMinutes: number
  durationLabel?: string
  premiumSupport: boolean
  popular: boolean
  active: boolean
  sortOrder?: number
  features: string[]
}

export const mentorWorkspaceApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getMentorSessionRequests: build.query<MentorPendingRequest[], void>({
      query: () => '/api/mentors/me/workspace/requests',
      providesTags: ['MentorWorkspace'],
    }),
    rescheduleMentorBooking: build.mutation<
      MentorshipBooking,
      { bookingId: string; scheduledAt: string; confirmImmediately: boolean }
    >({
      query: ({ bookingId, scheduledAt, confirmImmediately }) => ({
        url: `/api/mentors/me/workspace/bookings/${bookingId}/reschedule`,
        method: 'POST',
        body: { scheduledAt, confirmImmediately },
      }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    getMentorDashboard: build.query<MentorDashboard, void>({
      query: () => '/api/mentors/me/workspace/dashboard',
      providesTags: ['MentorWorkspace'],
      keepUnusedDataFor: 30,
    }),
    getMentorStudents: build.query<MentorStudent[], { category?: string } | void>({
      query: (params) => {
        const category = params?.category ?? 'all'
        return `/api/mentor/my-students?category=${encodeURIComponent(category)}`
      },
      providesTags: ['MentorWorkspace'],
    }),
    getMentorStudentDetail: build.query<MentorStudentDetail, string>({
      query: (learnerId) => `/api/mentors/me/workspace/students/${learnerId}`,
      providesTags: (_r, _e, learnerId) => [{ type: 'MentorWorkspace', id: `student-${learnerId}` }],
    }),
    updateMentorStudent: build.mutation<MentorStudentDetail, { learnerId: string; body: UpdateMentorStudentRequest }>({
      query: ({ learnerId, body }) => ({
        url: `/api/mentors/me/workspace/students/${learnerId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { learnerId }) => [
        'MentorWorkspace',
        { type: 'MentorWorkspace', id: `student-${learnerId}` },
      ],
    }),
    createMentorStudentTask: build.mutation<
      MentorStudentTask,
      { learnerId: string; title: string; description?: string; dueDate?: string }
    >({
      query: ({ learnerId, ...body }) => ({
        url: `/api/mentors/me/workspace/students/${learnerId}/tasks`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { learnerId }) => [
        'MentorWorkspace',
        { type: 'MentorWorkspace', id: `student-${learnerId}` },
      ],
    }),
    updateMentorStudentTask: build.mutation<
      MentorStudentTask,
      { learnerId: string; taskId: string; title?: string; description?: string; status?: string; dueDate?: string }
    >({
      query: ({ learnerId, taskId, ...body }) => ({
        url: `/api/mentors/me/workspace/students/${learnerId}/tasks/${taskId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { learnerId }) => [
        'MentorWorkspace',
        { type: 'MentorWorkspace', id: `student-${learnerId}` },
      ],
    }),
    deleteMentorStudentTask: build.mutation<void, { learnerId: string; taskId: string }>({
      query: ({ learnerId, taskId }) => ({
        url: `/api/mentors/me/workspace/students/${learnerId}/tasks/${taskId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { learnerId }) => [
        'MentorWorkspace',
        { type: 'MentorWorkspace', id: `student-${learnerId}` },
      ],
    }),
    createMentorStudentRoadmapItem: build.mutation<
      MentorStudentRoadmapItem,
      { learnerId: string; title: string; milestone?: string; sortOrder?: number }
    >({
      query: ({ learnerId, ...body }) => ({
        url: `/api/mentors/me/workspace/students/${learnerId}/roadmap`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { learnerId }) => [
        'MentorWorkspace',
        { type: 'MentorWorkspace', id: `student-${learnerId}` },
      ],
    }),
    updateMentorStudentRoadmapItem: build.mutation<
      MentorStudentRoadmapItem,
      { learnerId: string; itemId: string; title?: string; milestone?: string; sortOrder?: number; status?: string }
    >({
      query: ({ learnerId, itemId, ...body }) => ({
        url: `/api/mentors/me/workspace/students/${learnerId}/roadmap/${itemId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { learnerId }) => [
        'MentorWorkspace',
        { type: 'MentorWorkspace', id: `student-${learnerId}` },
      ],
    }),
    deleteMentorStudentRoadmapItem: build.mutation<void, { learnerId: string; itemId: string }>({
      query: ({ learnerId, itemId }) => ({
        url: `/api/mentors/me/workspace/students/${learnerId}/roadmap/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { learnerId }) => [
        'MentorWorkspace',
        { type: 'MentorWorkspace', id: `student-${learnerId}` },
      ],
    }),
    getMentorBookingsOverview: build.query<MentorBookingsOverview, void>({
      query: () => '/api/mentors/me/workspace/bookings/overview',
      providesTags: ['MentorWorkspace'],
    }),
    getMentorBookings: build.query<MentorshipBooking[], { status?: string; limit?: number } | void>({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('status', params?.status ?? 'all')
        search.set('limit', String(params?.limit ?? 100))
        return `/api/mentors/me/workspace/bookings?${search.toString()}`
      },
      providesTags: ['MentorWorkspace'],
    }),
    confirmMentorBooking: build.mutation<MentorshipBooking, string>({
      query: (id) => ({ url: `/api/mentors/me/workspace/bookings/${id}/confirm`, method: 'POST' }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    completeMentorBooking: build.mutation<MentorshipBooking, string>({
      query: (id) => ({ url: `/api/mentors/me/workspace/bookings/${id}/complete`, method: 'POST' }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    cancelMentorBooking: build.mutation<MentorshipBooking, string>({
      query: (id) => ({ url: `/api/mentors/me/workspace/bookings/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    getMentorAvailability: build.query<MentorMyAvailability, void>({
      query: () => '/api/mentors/me/workspace/availability',
      providesTags: ['MentorWorkspace'],
    }),
    saveMentorAvailability: build.mutation<MentorMyAvailability, SaveMentorAvailabilityRequest>({
      query: (body) => ({ url: '/api/mentors/me/workspace/availability', method: 'PUT', body }),
      invalidatesTags: ['MentorWorkspace', 'MentorAvailability', 'MockInterviews'],
    }),
    getMentorEarnings: build.query<MentorEarnings, void>({
      query: () => '/api/mentors/me/workspace/earnings',
      providesTags: ['MentorWorkspace'],
    }),
    requestMentorWithdrawal: build.mutation<MentorWithdrawal, { amountCents: number; note?: string }>({
      query: (body) => ({
        url: '/api/mentors/me/workspace/earnings/withdrawals',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    getMentorAnalytics: build.query<MentorAnalytics, void>({
      query: () => '/api/mentors/me/workspace/analytics',
      providesTags: ['MentorWorkspace'],
    }),
    getMentorInsights: build.query<MentorPerformanceInsights, void>({
      query: () => '/api/mentors/me/workspace/insights',
      providesTags: ['MentorWorkspace'],
    }),
    getMentorLeaderboard: build.query<
      MentorLeaderboard,
      { period?: string; limit?: number } | void
    >({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('period', params?.period ?? 'all')
        search.set('limit', String(params?.limit ?? 50))
        return `/api/mentors/me/workspace/leaderboard?${search.toString()}`
      },
      providesTags: ['MentorWorkspace'],
    }),
    getMentorPlans: build.query<MentorMentorshipPlan[], void>({
      query: () => '/api/mentors/me/workspace/plans',
      providesTags: ['MentorWorkspace'],
    }),
    createMentorPlan: build.mutation<MentorMentorshipPlan, CreateMentorPlanRequest>({
      query: (body) => ({ url: '/api/mentors/me/workspace/plans', method: 'POST', body }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    updateMentorPlan: build.mutation<
      MentorMentorshipPlan,
      { planId: string; body: Partial<CreateMentorPlanRequest> }
    >({
      query: ({ planId, body }) => ({ url: `/api/mentors/me/workspace/plans/${planId}`, method: 'PUT', body }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    deleteMentorPlan: build.mutation<void, string>({
      query: (planId) => ({ url: `/api/mentors/me/workspace/plans/${planId}`, method: 'DELETE' }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    getMentorReviewsSummary: build.query<MentorReviewsSummary, void>({
      query: () => '/api/mentors/me/feedback-summary',
      providesTags: ['MentorWorkspace'],
    }),
    replyToMentorReview: build.mutation<MentorReview, { reviewId: string; reply: string }>({
      query: ({ reviewId, reply }) => ({
        url: `/api/mentors/me/workspace/reviews/${reviewId}/reply`,
        method: 'POST',
        body: { reply },
      }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    toggleMentorReviewShowcase: build.mutation<MentorReview, { reviewId: string; showcased: boolean }>({
      query: ({ reviewId, showcased }) => ({
        url: `/api/mentors/me/workspace/reviews/${reviewId}/showcase?showcased=${showcased}`,
        method: 'PUT',
      }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    getMentorSharedNotes: build.query<
      MentorSharedNote[],
      { type?: string; search?: string } | void
    >({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('type', params?.type ?? 'all')
        search.set('search', params?.search ?? '')
        return `/api/mentors/me/workspace/notes?${search.toString()}`
      },
      providesTags: ['MentorWorkspace'],
    }),
    getMentorSharedNote: build.query<MentorSharedNote, string>({
      query: (noteId) => `/api/mentors/me/workspace/notes/${noteId}`,
      providesTags: ['MentorWorkspace'],
    }),
    getMentorSharedNoteFile: build.query<MentorSharedNoteFile, string>({
      query: (noteId) => `/api/mentors/me/workspace/notes/${noteId}/file`,
    }),
    createMentorSharedNote: build.mutation<MentorSharedNote, CreateMentorSharedNoteRequest>({
      query: (body) => ({ url: '/api/mentors/me/workspace/notes', method: 'POST', body }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    updateMentorSharedNote: build.mutation<
      MentorSharedNote,
      { noteId: string; body: Partial<CreateMentorSharedNoteRequest> & { clearFile?: boolean } }
    >({
      query: ({ noteId, body }) => ({ url: `/api/mentors/me/workspace/notes/${noteId}`, method: 'PUT', body }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    shareMentorSharedNote: build.mutation<
      MentorSharedNote,
      { noteId: string; learnerIds: string[]; message?: string }
    >({
      query: ({ noteId, learnerIds, message }) => ({
        url: `/api/mentors/me/workspace/notes/${noteId}/share`,
        method: 'POST',
        body: { learnerIds, message },
      }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    deleteMentorSharedNote: build.mutation<void, string>({
      query: (noteId) => ({ url: `/api/mentors/me/workspace/notes/${noteId}`, method: 'DELETE' }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    getMentorInterviewQuestions: build.query<
      MentorInterviewQuestion[],
      { category?: string; difficulty?: string; search?: string; view?: string } | void
    >({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('category', params?.category ?? 'all')
        search.set('difficulty', params?.difficulty ?? 'all')
        search.set('search', params?.search ?? '')
        search.set('view', params?.view ?? 'all')
        return `/api/mentors/me/workspace/questions?${search.toString()}`
      },
      providesTags: ['MentorWorkspace'],
    }),
    createMentorInterviewQuestion: build.mutation<MentorInterviewQuestion, CreateMentorInterviewQuestionRequest>({
      query: (body) => ({ url: '/api/mentors/me/workspace/questions', method: 'POST', body }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    updateMentorInterviewQuestion: build.mutation<
      MentorInterviewQuestion,
      { questionId: string; body: Partial<CreateMentorInterviewQuestionRequest> & { template?: boolean } }
    >({
      query: ({ questionId, body }) => ({
        url: `/api/mentors/me/workspace/questions/${questionId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    toggleMentorInterviewQuestionSave: build.mutation<MentorInterviewQuestion, string>({
      query: (questionId) => ({
        url: `/api/mentors/me/workspace/questions/${questionId}/save`,
        method: 'POST',
      }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    generateMentorInterviewQuestion: build.mutation<
      MentorInterviewQuestion,
      { category: MentorInterviewQuestionCategory; difficulty: MentorInterviewQuestionDifficulty; topic?: string; saveAsTemplate?: boolean }
    >({
      query: (body) => ({ url: '/api/mentors/me/workspace/questions/generate', method: 'POST', body }),
      invalidatesTags: ['MentorWorkspace'],
    }),
    deleteMentorInterviewQuestion: build.mutation<void, string>({
      query: (questionId) => ({ url: `/api/mentors/me/workspace/questions/${questionId}`, method: 'DELETE' }),
      invalidatesTags: ['MentorWorkspace'],
    }),
  }),
})

export const {
  useGetMentorSessionRequestsQuery,
  useRescheduleMentorBookingMutation,
  useGetMentorDashboardQuery,
  useGetMentorStudentsQuery,
  useGetMentorStudentDetailQuery,
  useUpdateMentorStudentMutation,
  useCreateMentorStudentTaskMutation,
  useUpdateMentorStudentTaskMutation,
  useDeleteMentorStudentTaskMutation,
  useCreateMentorStudentRoadmapItemMutation,
  useUpdateMentorStudentRoadmapItemMutation,
  useDeleteMentorStudentRoadmapItemMutation,
  useGetMentorBookingsOverviewQuery,
  useGetMentorBookingsQuery,
  useConfirmMentorBookingMutation,
  useCompleteMentorBookingMutation,
  useCancelMentorBookingMutation,
  useGetMentorAvailabilityQuery,
  useSaveMentorAvailabilityMutation,
  useGetMentorEarningsQuery,
  useRequestMentorWithdrawalMutation,
  useGetMentorAnalyticsQuery,
  useGetMentorInsightsQuery,
  useGetMentorLeaderboardQuery,
  useGetMentorPlansQuery,
  useCreateMentorPlanMutation,
  useUpdateMentorPlanMutation,
  useDeleteMentorPlanMutation,
  useGetMentorReviewsSummaryQuery,
  useReplyToMentorReviewMutation,
  useToggleMentorReviewShowcaseMutation,
  useGetMentorSharedNotesQuery,
  useGetMentorSharedNoteQuery,
  useGetMentorSharedNoteFileQuery,
  useLazyGetMentorSharedNoteFileQuery,
  useCreateMentorSharedNoteMutation,
  useUpdateMentorSharedNoteMutation,
  useShareMentorSharedNoteMutation,
  useDeleteMentorSharedNoteMutation,
  useGetMentorInterviewQuestionsQuery,
  useCreateMentorInterviewQuestionMutation,
  useUpdateMentorInterviewQuestionMutation,
  useToggleMentorInterviewQuestionSaveMutation,
  useGenerateMentorInterviewQuestionMutation,
  useDeleteMentorInterviewQuestionMutation,
} = mentorWorkspaceApi
