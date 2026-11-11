import { devConnectApi } from './baseApi'

export interface AdminLearningVideo {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  categoryName: string | null
  tags: string[]
  thumbnailUrl: string | null
  durationSeconds: number
  visibility: string
  viewCount: number
  likeCount: number
  saved: boolean
  createdAt: string
}

export interface LearningVideoAnalytics {
  totalVideos: number
  totalViews: number
  totalWatchSeconds: number
  publicCount: number
  premiumCount: number
  draftCount: number
}

export const adminLearningVideosApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getLearningVideoAnalytics: build.query<LearningVideoAnalytics, void>({
      query: () => '/api/mentors/admin/learning-videos/analytics',
      providesTags: [{ type: 'AdminLearningVideos', id: 'ANALYTICS' }],
    }),
    listLearningVideoCategories: build.query<{ id: string; name: string; sortOrder: number }[], void>({
      query: () => '/api/mentors/admin/learning-videos/categories',
      providesTags: [{ type: 'AdminLearningVideos', id: 'CATEGORIES' }],
    }),
    createLearningVideoCategory: build.mutation<{ id: string; name: string; sortOrder: number }, { name: string; sortOrder: number }>({
      query: (body) => ({
        url: '/api/mentors/admin/learning-videos/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'AdminLearningVideos', id: 'CATEGORIES' }],
    }),
    listAdminLearningVideos: build.query<
      AdminLearningVideo[],
      { visibility?: string; categoryId?: string; q?: string } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        if (params.visibility) search.set('visibility', params.visibility)
        if (params.categoryId) search.set('categoryId', params.categoryId)
        if (params.q?.trim()) search.set('q', params.q.trim())
        const qs = search.toString()
        return `/api/mentors/admin/learning-videos${qs ? `?${qs}` : ''}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminLearningVideos' as const, id })),
              { type: 'AdminLearningVideos', id: 'LIST' },
            ]
          : [{ type: 'AdminLearningVideos', id: 'LIST' }],
    }),
    updateAdminLearningVideo: build.mutation<
      AdminLearningVideo,
      { id: string; title?: string; description?: string; categoryId?: string; tags?: string[]; durationSeconds?: number; visibility?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/mentors/admin/learning-videos/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AdminLearningVideos', id },
        { type: 'AdminLearningVideos', id: 'LIST' },
        { type: 'AdminLearningVideos', id: 'ANALYTICS' },
        { type: 'PlatformVideos', id: 'LIST' },
      ],
    }),
    publishAdminLearningVideo: build.mutation<AdminLearningVideo, string>({
      query: (id) => ({ url: `/api/mentors/admin/learning-videos/${id}/publish`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminLearningVideos', id },
        { type: 'AdminLearningVideos', id: 'LIST' },
        { type: 'AdminLearningVideos', id: 'ANALYTICS' },
        { type: 'PlatformVideos', id: 'LIST' },
      ],
    }),
    unpublishAdminLearningVideo: build.mutation<AdminLearningVideo, string>({
      query: (id) => ({ url: `/api/mentors/admin/learning-videos/${id}/unpublish`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminLearningVideos', id },
        { type: 'AdminLearningVideos', id: 'LIST' },
        { type: 'AdminLearningVideos', id: 'ANALYTICS' },
        { type: 'PlatformVideos', id: 'LIST' },
      ],
    }),
    deleteAdminLearningVideo: build.mutation<void, string>({
      query: (id) => ({ url: `/api/mentors/admin/learning-videos/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminLearningVideos', id: 'LIST' }, { type: 'AdminLearningVideos', id: 'ANALYTICS' }, { type: 'PlatformVideos', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetLearningVideoAnalyticsQuery,
  useListLearningVideoCategoriesQuery,
  useCreateLearningVideoCategoryMutation,
  useListAdminLearningVideosQuery,
  useUpdateAdminLearningVideoMutation,
  usePublishAdminLearningVideoMutation,
  useUnpublishAdminLearningVideoMutation,
  useDeleteAdminLearningVideoMutation,
} = adminLearningVideosApi
