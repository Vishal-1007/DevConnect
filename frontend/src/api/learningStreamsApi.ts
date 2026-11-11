import { devConnectApi } from './baseApi'

export interface StreamCourseCard {
  id: string
  mentorId: string
  mentorDisplayName: string
  creatorType?: 'ADMIN' | 'MENTOR'
  category?: string | null
  title: string
  description: string | null
  thumbnailUrl: string | null
  pricingType: 'FREE' | 'PAID'
  currency?: string
  priceCents: number
  discountPriceCents: number | null
  difficulty: string
  tags: string[]
  averageRating: number
  ratingCount: number
  enrolledCount: number
  likeCount: number
  totalLessons?: number
  totalDurationSeconds: number
  publishedAt: string | null
  status?: string
  purchased: boolean
  saved: boolean
  liked: boolean
  watchProgressPercent: number
}

export interface StreamAnalytics {
  totalCourses: number
  publishedCourses: number
  totalEnrollments: number
  totalRevenueCents: number
  totalWatchTimeSeconds: number
  totalViews: number
}

export interface StreamLesson {
  id: string
  sectionId: string
  title: string
  description: string | null
  videoUrl: string | null
  thumbnailUrl: string | null
  durationSeconds: number
  sortOrder: number
  previewFree: boolean
  locked: boolean
  progressSeconds: number
  completed: boolean
}

export interface StreamSection {
  id: string
  title: string
  sortOrder: number
  lessons: StreamLesson[]
}

export interface StreamCourseDetail extends StreamCourseCard {
  bannerUrl: string | null
  whatYouLearn: string | null
  requirements: string | null
  followingMentor: boolean
  sections: StreamSection[]
  reviews: { id: string; learnerDisplayName: string; rating: number; comment: string; createdAt: string }[]
  relatedCourses: StreamCourseCard[]
}

export interface StreamPage<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  hasNext: boolean
}

export interface StreamCheckoutInfo {
  courseId: string
  courseTitle: string
  amountCents: number
  currency: string
  description: string
}

export interface CourseProgressInfo {
  courseId: string
  totalLessons: number
  completedLessons: number
  progressPercent: number
  lastLessonId: string | null
  lastLessonTitle: string | null
  lastProgressSeconds: number
  lastWatchedAt: string | null
}

export interface ResumePlaybackInfo {
  courseId: string
  lessonId: string | null
  lessonTitle: string | null
  progressSeconds: number
  completed: boolean
  hasProgress: boolean
}

export interface LessonProgressResponse {
  lessonId: string
  courseId: string
  progressSeconds: number
  watchedDurationSeconds: number
  completed: boolean
  courseProgressPercent: number
}

export const learningStreamsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    browseStreamCourses: build.query<
      StreamPage<StreamCourseCard>,
      { search?: string; pricingType?: string; difficulty?: string; sort?: string; page?: number; size?: number }
    >({
      query: (params) => ({
        url: '/api/mentors/streams/courses',
        params,
      }),
      providesTags: ['StreamCourses'],
    }),
    followedStreamCourses: build.query<StreamPage<StreamCourseCard>, { page?: number; size?: number }>({
      query: (params) => ({ url: '/api/mentors/streams/courses/followed', params }),
      providesTags: ['StreamCourses'],
    }),
    recommendedStreamCourses: build.query<StreamPage<StreamCourseCard>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 12 } = {}) => ({
        url: '/api/mentors/streams/courses/recommended',
        params: { page, size },
      }),
      providesTags: ['StreamCourses'],
    }),
    purchasedStreamCourses: build.query<StreamPage<StreamCourseCard>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 12 } = {}) => ({
        url: '/api/mentors/streams/courses/purchased',
        params: { page, size },
      }),
      providesTags: ['StreamCourses'],
    }),
    streamAnalytics: build.query<StreamAnalytics, void>({
      query: () => '/api/mentors/streams/analytics',
    }),
    adminStreamAnalytics: build.query<StreamAnalytics, void>({
      query: () => '/api/mentors/admin/streams/analytics',
    }),
    continueStreamCourses: build.query<StreamCourseCard[], void>({
      query: () => '/api/mentors/streams/courses/continue',
      providesTags: ['StreamCourses'],
    }),
    getStreamCourse: build.query<StreamCourseDetail, string>({
      query: (id) => `/api/mentors/streams/courses/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'StreamCourses', id }],
    }),
    getStreamCourseProgress: build.query<CourseProgressInfo, string>({
      query: (id) => `/api/mentors/streams/courses/${id}/progress`,
      providesTags: (_r, _e, id) => [{ type: 'StreamCourses', id: `${id}-progress` }],
    }),
    getStreamResumePlayback: build.query<ResumePlaybackInfo, string>({
      query: (id) => `/api/mentors/streams/courses/${id}/resume`,
    }),
    getStreamCheckout: build.query<StreamCheckoutInfo, string>({
      query: (id) => `/api/mentors/streams/courses/${id}/checkout`,
    }),
    purchaseStreamCourse: build.mutation<StreamCourseCard, { courseId: string; paymentId: string }>({
      query: ({ courseId, paymentId }) => ({
        url: `/api/mentors/streams/courses/${courseId}/purchase`,
        method: 'POST',
        body: { paymentId },
      }),
      invalidatesTags: ['StreamCourses', 'Payments'],
    }),
    enrollFreeStreamCourse: build.mutation<StreamCourseCard, string>({
      query: (courseId) => ({
        url: `/api/mentors/streams/courses/${courseId}/enroll`,
        method: 'POST',
      }),
      invalidatesTags: ['StreamCourses'],
    }),
    addStreamToCart: build.mutation<void, string>({
      query: (courseId) => ({ url: `/api/mentors/streams/courses/${courseId}/cart`, method: 'POST' }),
    }),
    removeStreamFromCart: build.mutation<void, string>({
      query: (courseId) => ({ url: `/api/mentors/streams/cart/${courseId}`, method: 'DELETE' }),
    }),
    getStreamCart: build.query<StreamCourseCard[], void>({
      query: () => '/api/mentors/streams/cart',
    }),
    saveStreamCourse: build.mutation<void, string>({
      query: (courseId) => ({ url: `/api/mentors/streams/courses/${courseId}/save`, method: 'POST' }),
      invalidatesTags: ['StreamCourses'],
    }),
    unsaveStreamCourse: build.mutation<void, string>({
      query: (courseId) => ({ url: `/api/mentors/streams/courses/${courseId}/save`, method: 'DELETE' }),
      invalidatesTags: ['StreamCourses'],
    }),
    followStreamMentor: build.mutation<void, string>({
      query: (mentorId) => ({ url: `/api/mentors/streams/mentors/${mentorId}/follow`, method: 'POST' }),
      invalidatesTags: ['StreamCourses'],
    }),
    unfollowStreamMentor: build.mutation<void, string>({
      query: (mentorId) => ({ url: `/api/mentors/streams/mentors/${mentorId}/follow`, method: 'DELETE' }),
      invalidatesTags: ['StreamCourses'],
    }),
    saveLessonProgress: build.mutation<LessonProgressResponse, {
      lessonId: string
      progressSeconds: number
      completed: boolean
      watchedDurationSeconds?: number
    }>({
      query: ({ lessonId, ...body }) => ({
        url: `/api/mentors/streams/lessons/${lessonId}/progress`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StreamCourses'],
    }),
    markLessonCompleted: build.mutation<LessonProgressResponse, string>({
      query: (lessonId) => ({
        url: `/api/mentors/streams/lessons/${lessonId}/complete`,
        method: 'POST',
      }),
      invalidatesTags: ['StreamCourses'],
    }),
    listMentorStreamCourses: build.query<StreamCourseCard[], void>({
      query: () => '/api/mentors/me/workspace/streams/courses',
      providesTags: ['StreamCourses'],
    }),
    createMentorStreamCourse: build.mutation<StreamCourseCard, Record<string, unknown>>({
      query: (body) => ({
        url: '/api/mentors/me/workspace/streams/courses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StreamCourses'],
    }),
    createMentorStreamSection: build.mutation<
      StreamSection,
      { courseId: string; title: string; sortOrder: number }
    >({
      query: ({ courseId, ...body }) => ({
        url: `/api/mentors/me/workspace/streams/courses/${courseId}/sections`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StreamCourses'],
    }),
    getMentorStreamCourse: build.query<StreamCourseDetail, string>({
      query: (id) => `/api/mentors/me/workspace/streams/courses/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'StreamCourses', id }],
    }),
    publishMentorStreamCourse: build.mutation<StreamCourseCard, string>({
      query: (id) => ({
        url: `/api/mentors/me/workspace/streams/courses/${id}/publish`,
        method: 'POST',
      }),
      invalidatesTags: ['StreamCourses'],
    }),
    deleteMentorStreamCourse: build.mutation<void, string>({
      query: (id) => ({
        url: `/api/mentors/me/workspace/streams/courses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StreamCourses'],
    }),
    listAdminStreamCourses: build.query<StreamCourseCard[], void>({
      query: () => '/api/mentors/admin/streams/courses',
      providesTags: ['StreamCourses'],
    }),
    createAdminStreamCourse: build.mutation<StreamCourseCard, Record<string, unknown>>({
      query: (body) => ({
        url: '/api/mentors/admin/streams/courses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StreamCourses'],
    }),
    createAdminStreamSection: build.mutation<
      StreamSection,
      { courseId: string; title: string; sortOrder: number }
    >({
      query: ({ courseId, ...body }) => ({
        url: `/api/mentors/admin/streams/courses/${courseId}/sections`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StreamCourses'],
    }),
    publishAdminStreamCourse: build.mutation<StreamCourseCard, string>({
      query: (id) => ({
        url: `/api/mentors/admin/streams/courses/${id}/publish`,
        method: 'POST',
      }),
      invalidatesTags: ['StreamCourses'],
    }),
    deleteAdminStreamCourse: build.mutation<void, string>({
      query: (id) => ({
        url: `/api/mentors/admin/streams/courses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StreamCourses'],
    }),
  }),
})

export const {
  useBrowseStreamCoursesQuery,
  useFollowedStreamCoursesQuery,
  useRecommendedStreamCoursesQuery,
  usePurchasedStreamCoursesQuery,
  useStreamAnalyticsQuery,
  useAdminStreamAnalyticsQuery,
  useContinueStreamCoursesQuery,
  useGetStreamCourseQuery,
  useGetStreamCourseProgressQuery,
  useGetStreamResumePlaybackQuery,
  useGetStreamCheckoutQuery,
  usePurchaseStreamCourseMutation,
  useEnrollFreeStreamCourseMutation,
  useAddStreamToCartMutation,
  useSaveStreamCourseMutation,
  useUnsaveStreamCourseMutation,
  useFollowStreamMentorMutation,
  useUnfollowStreamMentorMutation,
  useSaveLessonProgressMutation,
  useMarkLessonCompletedMutation,
  useListMentorStreamCoursesQuery,
  useCreateMentorStreamCourseMutation,
  useCreateMentorStreamSectionMutation,
  useGetMentorStreamCourseQuery,
  usePublishMentorStreamCourseMutation,
  useDeleteMentorStreamCourseMutation,
  useListAdminStreamCoursesQuery,
  useCreateAdminStreamCourseMutation,
  useCreateAdminStreamSectionMutation,
  usePublishAdminStreamCourseMutation,
  useDeleteAdminStreamCourseMutation,
} = learningStreamsApi
