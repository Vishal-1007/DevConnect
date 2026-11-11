import { devConnectApi } from './baseApi'

export interface AdminModeratedPost {
  id: string
  authorId: string
  authorDisplayName: string
  authorRole: string | null
  content: string
  category: string
  tags: string[]
  likeCount: number
  commentCount: number
  removed: boolean
  flagged: boolean
  autoFlagged: boolean
  moderationStatus: string
  moderationFlags: string[]
  moderationNote: string | null
  flaggedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ContentModerationAnalytics {
  totalPosts: number
  activePosts: number
  flaggedPosts: number
  autoFlaggedPosts: number
  removedPosts: number
  abusiveLanguage: number
  hateSpeech: number
  spam: number
  scam: number
  nsfw: number
}

export const adminContentModerationApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listModeratedPosts: build.query<
      AdminModeratedPost[],
      { status?: string; category?: string; q?: string; limit?: number } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('status', params.status ?? 'active')
        if (params.category && params.category !== 'all') search.set('category', params.category)
        if (params.q?.trim()) search.set('q', params.q.trim())
        search.set('limit', String(params.limit ?? 100))
        return `/api/users/admin/content-moderation?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminContentModeration' as const, id })),
              { type: 'AdminContentModeration', id: 'LIST' },
            ]
          : [{ type: 'AdminContentModeration', id: 'LIST' }],
    }),
    getContentModerationAnalytics: build.query<ContentModerationAnalytics, void>({
      query: () => '/api/users/admin/content-moderation/analytics',
      providesTags: [{ type: 'AdminContentModeration', id: 'ANALYTICS' }],
    }),
    flagModeratedPost: build.mutation<AdminModeratedPost, string>({
      query: (id) => ({
        url: `/api/users/admin/content-moderation/${id}/flag`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminContentModeration', id },
        { type: 'AdminContentModeration', id: 'LIST' },
        { type: 'AdminContentModeration', id: 'ANALYTICS' },
        { type: 'Feed', id: 'LIST' },
      ],
    }),
    unflagModeratedPost: build.mutation<AdminModeratedPost, string>({
      query: (id) => ({
        url: `/api/users/admin/content-moderation/${id}/unflag`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminContentModeration', id },
        { type: 'AdminContentModeration', id: 'LIST' },
        { type: 'AdminContentModeration', id: 'ANALYTICS' },
        { type: 'Feed', id: 'LIST' },
      ],
    }),
    removeModeratedPost: build.mutation<AdminModeratedPost, string>({
      query: (id) => ({
        url: `/api/users/admin/content-moderation/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminContentModeration', id },
        { type: 'AdminContentModeration', id: 'LIST' },
        { type: 'AdminContentModeration', id: 'ANALYTICS' },
        { type: 'Feed', id: 'LIST' },
      ],
    }),
    restoreModeratedPost: build.mutation<AdminModeratedPost, string>({
      query: (id) => ({
        url: `/api/users/admin/content-moderation/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminContentModeration', id },
        { type: 'AdminContentModeration', id: 'LIST' },
        { type: 'AdminContentModeration', id: 'ANALYTICS' },
        { type: 'Feed', id: 'LIST' },
      ],
    }),
    scanModeratedPost: build.mutation<AdminModeratedPost, string>({
      query: (id) => ({
        url: `/api/users/admin/content-moderation/${id}/scan`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminContentModeration', id },
        { type: 'AdminContentModeration', id: 'LIST' },
        { type: 'AdminContentModeration', id: 'ANALYTICS' },
      ],
    }),
    scanAllModeratedPosts: build.mutation<ContentModerationAnalytics, void>({
      query: () => ({
        url: '/api/users/admin/content-moderation/scan-all',
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'AdminContentModeration', id: 'LIST' },
        { type: 'AdminContentModeration', id: 'ANALYTICS' },
        { type: 'Feed', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useListModeratedPostsQuery,
  useGetContentModerationAnalyticsQuery,
  useFlagModeratedPostMutation,
  useUnflagModeratedPostMutation,
  useRemoveModeratedPostMutation,
  useRestoreModeratedPostMutation,
  useScanModeratedPostMutation,
  useScanAllModeratedPostsMutation,
} = adminContentModerationApi
