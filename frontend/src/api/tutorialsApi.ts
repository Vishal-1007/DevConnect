import { devConnectApi } from './baseApi'

export type TutorialBuilderTopic = {
  id: string
  title: string
  orderIndex: number
  htmlContent: string
}

export type TutorialBuilderSection = {
  id: string
  title: string
  orderIndex: number
  topics: TutorialBuilderTopic[]
}

export type TutorialBuilder = {
  id: string
  title: string
  description: string | null
  category: string | null
  difficulty: string
  tags: string[]
  courseType: 'FREE' | 'PAID'
  priceCents: number
  creatorType: 'ADMIN' | 'MENTOR'
  status: string
  publishedAt: string | null
  sections: TutorialBuilderSection[]
}

export type TutorialCard = {
  id: string
  title: string
  description: string | null
  category: string | null
  difficulty: string
  tags: string[]
  courseType: 'FREE' | 'PAID'
  priceCents: number
  creatorType: 'ADMIN' | 'MENTOR'
  creatorName: string | null
  status: string
  topicCount: number
  saved: boolean
  purchased: boolean
  locked: boolean
  publishedAt: string | null
}

export type TutorialTopicSummary = {
  id: string
  title: string
  orderIndex: number
  completed: boolean
  bookmarked: boolean
}

export type TutorialSectionSummary = {
  id: string
  title: string
  orderIndex: number
  topics: TutorialTopicSummary[]
}

export type TutorialTopicDetail = {
  id: string
  title: string
  sectionId: string
  sectionTitle: string
  htmlContent: string
  previousTopicId: string | null
  nextTopicId: string | null
  completed: boolean
  bookmarked: boolean
}

export type TutorialReader = {
  id: string
  title: string
  description: string | null
  category: string | null
  difficulty: string
  tags: string[]
  courseType: 'FREE' | 'PAID'
  priceCents: number
  creatorType: 'ADMIN' | 'MENTOR'
  creatorName: string | null
  locked: boolean
  purchased: boolean
  saved: boolean
  totalTopics: number
  completedTopics: number
  progressPercent: number
  currentTopicId: string | null
  lastViewedTopicId: string | null
  sections: TutorialSectionSummary[]
  topic: TutorialTopicDetail | null
}

export type TutorialSearchResult = {
  tutorialId: string
  tutorialTitle: string
  sectionId: string | null
  sectionTitle: string | null
  topicId: string | null
  topicTitle: string | null
  snippet: string
}

export type CreateTutorialPayload = {
  title: string
  description?: string
  category?: string
  difficulty: string
  tags?: string
  courseType: 'FREE' | 'PAID'
  priceCents?: number
}

export const tutorialsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listAdminTutorials: build.query<TutorialBuilder[], void>({
      query: () => '/api/mentors/admin/tutorials',
      providesTags: ['Tutorials'],
    }),
    getAdminTutorial: build.query<TutorialBuilder, string>({
      query: (id) => `/api/mentors/admin/tutorials/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Tutorials', id }],
    }),
    createAdminTutorial: build.mutation<TutorialBuilder, CreateTutorialPayload>({
      query: (body) => ({ url: '/api/mentors/admin/tutorials', method: 'POST', body }),
      invalidatesTags: ['Tutorials'],
    }),
    updateAdminTutorial: build.mutation<TutorialBuilder, { id: string; body: CreateTutorialPayload }>({
      query: ({ id, body }) => ({ url: `/api/mentors/admin/tutorials/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Tutorials', id }, 'Tutorials'],
    }),
    publishAdminTutorial: build.mutation<TutorialBuilder, string>({
      query: (id) => ({ url: `/api/mentors/admin/tutorials/${id}/publish`, method: 'POST' }),
      invalidatesTags: ['Tutorials'],
    }),
    unpublishAdminTutorial: build.mutation<TutorialBuilder, string>({
      query: (id) => ({ url: `/api/mentors/admin/tutorials/${id}/unpublish`, method: 'POST' }),
      invalidatesTags: ['Tutorials'],
    }),
    deleteAdminTutorial: build.mutation<void, string>({
      query: (id) => ({ url: `/api/mentors/admin/tutorials/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Tutorials'],
    }),
    createAdminSection: build.mutation<TutorialBuilder, { tutorialId: string; title: string }>({
      query: ({ tutorialId, title }) => ({
        url: `/api/mentors/admin/tutorials/${tutorialId}/sections`,
        method: 'POST',
        body: { title },
      }),
      invalidatesTags: (_r, _e, { tutorialId }) => [{ type: 'Tutorials', id: tutorialId }],
    }),
    createAdminTopic: build.mutation<TutorialBuilder, { tutorialId: string; sectionId: string; title: string }>({
      query: ({ tutorialId, sectionId, title }) => ({
        url: `/api/mentors/admin/tutorials/${tutorialId}/sections/${sectionId}/topics`,
        method: 'POST',
        body: { title },
      }),
      invalidatesTags: (_r, _e, { tutorialId }) => [{ type: 'Tutorials', id: tutorialId }],
    }),
    saveAdminTopicContent: build.mutation<TutorialBuilder, { tutorialId: string; topicId: string; htmlContent: string }>({
      query: ({ tutorialId, topicId, htmlContent }) => ({
        url: `/api/mentors/admin/tutorials/${tutorialId}/topics/${topicId}/content`,
        method: 'PUT',
        body: { htmlContent },
      }),
      invalidatesTags: (_r, _e, { tutorialId }) => [{ type: 'Tutorials', id: tutorialId }],
    }),
    listMentorTutorials: build.query<TutorialBuilder[], void>({
      query: () => '/api/mentors/me/workspace/tutorials',
      providesTags: ['MentorTutorials'],
    }),
    getMentorTutorial: build.query<TutorialBuilder, string>({
      query: (id) => `/api/mentors/me/workspace/tutorials/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'MentorTutorials', id }],
    }),
    createMentorTutorial: build.mutation<TutorialBuilder, CreateTutorialPayload>({
      query: (body) => ({ url: '/api/mentors/me/workspace/tutorials', method: 'POST', body }),
      invalidatesTags: ['MentorTutorials'],
    }),
    updateMentorTutorial: build.mutation<TutorialBuilder, { id: string; body: CreateTutorialPayload }>({
      query: ({ id, body }) => ({ url: `/api/mentors/me/workspace/tutorials/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'MentorTutorials', id }, 'MentorTutorials'],
    }),
    publishMentorTutorial: build.mutation<TutorialBuilder, string>({
      query: (id) => ({ url: `/api/mentors/me/workspace/tutorials/${id}/publish`, method: 'POST' }),
      invalidatesTags: ['MentorTutorials'],
    }),
    createMentorSection: build.mutation<TutorialBuilder, { tutorialId: string; title: string }>({
      query: ({ tutorialId, title }) => ({
        url: `/api/mentors/me/workspace/tutorials/${tutorialId}/sections`,
        method: 'POST',
        body: { title },
      }),
      invalidatesTags: (_r, _e, { tutorialId }) => [{ type: 'MentorTutorials', id: tutorialId }],
    }),
    createMentorTopic: build.mutation<TutorialBuilder, { tutorialId: string; sectionId: string; title: string }>({
      query: ({ tutorialId, sectionId, title }) => ({
        url: `/api/mentors/me/workspace/tutorials/${tutorialId}/sections/${sectionId}/topics`,
        method: 'POST',
        body: { title },
      }),
      invalidatesTags: (_r, _e, { tutorialId }) => [{ type: 'MentorTutorials', id: tutorialId }],
    }),
    saveMentorTopicContent: build.mutation<TutorialBuilder, { tutorialId: string; topicId: string; htmlContent: string }>({
      query: ({ tutorialId, topicId, htmlContent }) => ({
        url: `/api/mentors/me/workspace/tutorials/${tutorialId}/topics/${topicId}/content`,
        method: 'PUT',
        body: { htmlContent },
      }),
      invalidatesTags: (_r, _e, { tutorialId }) => [{ type: 'MentorTutorials', id: tutorialId }],
    }),
    browseTutorials: build.query<TutorialCard[], { creatorType?: string; category?: string; q?: string }>({
      query: (params) => {
        const search = new URLSearchParams()
        if (params.creatorType) search.set('creatorType', params.creatorType)
        if (params.category) search.set('category', params.category)
        if (params.q) search.set('q', params.q)
        const qs = search.toString()
        return `/api/mentors/tutorials${qs ? `?${qs}` : ''}`
      },
      providesTags: ['TutorialCatalog'],
    }),
    searchTutorials: build.query<TutorialSearchResult[], string>({
      query: (q) => `/api/mentors/tutorials/search?q=${encodeURIComponent(q)}`,
    }),
    readTutorial: build.query<TutorialReader, { tutorialId: string; topicId?: string }>({
      query: ({ tutorialId, topicId }) => {
        const qs = topicId ? `?topicId=${topicId}` : ''
        return `/api/mentors/tutorials/${tutorialId}${qs}`
      },
      providesTags: (_r, _e, { tutorialId }) => [{ type: 'TutorialReader', id: tutorialId }],
    }),
    completeTutorialTopic: build.mutation<TutorialReader, { tutorialId: string; topicId: string }>({
      query: ({ tutorialId, topicId }) => ({
        url: `/api/mentors/tutorials/${tutorialId}/topics/${topicId}/complete`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { tutorialId }) => [{ type: 'TutorialReader', id: tutorialId }],
    }),
    saveTutorial: build.mutation<void, string>({
      query: (tutorialId) => ({ url: `/api/mentors/tutorials/${tutorialId}/save`, method: 'POST' }),
      invalidatesTags: ['TutorialCatalog'],
    }),
    unsaveTutorial: build.mutation<void, string>({
      query: (tutorialId) => ({ url: `/api/mentors/tutorials/${tutorialId}/unsave`, method: 'POST' }),
      invalidatesTags: ['TutorialCatalog'],
    }),
    bookmarkTutorialTopic: build.mutation<void, { tutorialId: string; topicId: string }>({
      query: ({ tutorialId, topicId }) => ({
        url: `/api/mentors/tutorials/${tutorialId}/topics/${topicId}/bookmark`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { tutorialId }) => [{ type: 'TutorialReader', id: tutorialId }],
    }),
    purchaseTutorial: build.mutation<void, { tutorialId: string; paymentId: string }>({
      query: ({ tutorialId, paymentId }) => ({
        url: `/api/mentors/tutorials/${tutorialId}/purchase`,
        method: 'POST',
        body: { paymentId },
      }),
      invalidatesTags: (_r, _e, { tutorialId }) => [{ type: 'TutorialReader', id: tutorialId }, 'TutorialCatalog'],
    }),
    addTutorialToCart: build.mutation<void, string>({
      query: (tutorialId) => ({ url: `/api/mentors/tutorials/${tutorialId}/cart`, method: 'POST' }),
    }),
  }),
})

export const {
  useListAdminTutorialsQuery,
  useGetAdminTutorialQuery,
  useCreateAdminTutorialMutation,
  useUpdateAdminTutorialMutation,
  usePublishAdminTutorialMutation,
  useCreateAdminSectionMutation,
  useCreateAdminTopicMutation,
  useSaveAdminTopicContentMutation,
  useListMentorTutorialsQuery,
  useGetMentorTutorialQuery,
  useCreateMentorTutorialMutation,
  useUpdateMentorTutorialMutation,
  usePublishMentorTutorialMutation,
  useCreateMentorSectionMutation,
  useCreateMentorTopicMutation,
  useSaveMentorTopicContentMutation,
  useBrowseTutorialsQuery,
  useSearchTutorialsQuery,
  useReadTutorialQuery,
  useCompleteTutorialTopicMutation,
  useSaveTutorialMutation,
  useUnsaveTutorialMutation,
  useBookmarkTutorialTopicMutation,
  usePurchaseTutorialMutation,
  useAddTutorialToCartMutation,
} = tutorialsApi
