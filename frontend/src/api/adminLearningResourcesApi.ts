import { devConnectApi } from './baseApi'

export interface LearningCategory {
  id: string
  name: string
  sortOrder: number
}

export interface AdminLearningResource {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  categoryName: string | null
  tags: string[]
  difficulty: string
  fileType: string | null
  thumbnailUrl: string | null
  visibility: string
  downloadCount: number
  viewCount: number
  saved: boolean
  createdAt: string
}

export interface LearningResourceAnalytics {
  totalResources: number
  totalDownloads: number
  totalViews: number
  publicCount: number
  premiumCount: number
  draftCount: number
}

export const adminLearningResourcesApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getLearningResourceAnalytics: build.query<LearningResourceAnalytics, void>({
      query: () => '/api/mentors/admin/learning-resources/analytics',
      providesTags: [{ type: 'AdminLearningResources', id: 'ANALYTICS' }],
    }),
    listLearningResourceCategories: build.query<LearningCategory[], void>({
      query: () => '/api/mentors/admin/learning-resources/categories',
      providesTags: [{ type: 'AdminLearningResources', id: 'CATEGORIES' }],
    }),
    createLearningResourceCategory: build.mutation<LearningCategory, { name: string; sortOrder: number }>({
      query: (body) => ({
        url: '/api/mentors/admin/learning-resources/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'AdminLearningResources', id: 'CATEGORIES' }],
    }),
    listAdminLearningResources: build.query<
      AdminLearningResource[],
      { visibility?: string; categoryId?: string; q?: string } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        if (params.visibility) search.set('visibility', params.visibility)
        if (params.categoryId) search.set('categoryId', params.categoryId)
        if (params.q?.trim()) search.set('q', params.q.trim())
        const qs = search.toString()
        return `/api/mentors/admin/learning-resources${qs ? `?${qs}` : ''}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminLearningResources' as const, id })),
              { type: 'AdminLearningResources', id: 'LIST' },
            ]
          : [{ type: 'AdminLearningResources', id: 'LIST' }],
    }),
    updateAdminLearningResource: build.mutation<
      AdminLearningResource,
      { id: string; title?: string; description?: string; categoryId?: string; tags?: string[]; difficulty?: string; visibility?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/mentors/admin/learning-resources/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AdminLearningResources', id },
        { type: 'AdminLearningResources', id: 'LIST' },
        { type: 'AdminLearningResources', id: 'ANALYTICS' },
        { type: 'LearningResources', id: 'LIST' },
      ],
    }),
    publishAdminLearningResource: build.mutation<AdminLearningResource, string>({
      query: (id) => ({ url: `/api/mentors/admin/learning-resources/${id}/publish`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminLearningResources', id },
        { type: 'AdminLearningResources', id: 'LIST' },
        { type: 'AdminLearningResources', id: 'ANALYTICS' },
        { type: 'LearningResources', id: 'LIST' },
      ],
    }),
    unpublishAdminLearningResource: build.mutation<AdminLearningResource, string>({
      query: (id) => ({ url: `/api/mentors/admin/learning-resources/${id}/unpublish`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminLearningResources', id },
        { type: 'AdminLearningResources', id: 'LIST' },
        { type: 'AdminLearningResources', id: 'ANALYTICS' },
        { type: 'LearningResources', id: 'LIST' },
      ],
    }),
    deleteAdminLearningResource: build.mutation<void, string>({
      query: (id) => ({ url: `/api/mentors/admin/learning-resources/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminLearningResources', id: 'LIST' }, { type: 'AdminLearningResources', id: 'ANALYTICS' }, { type: 'LearningResources', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetLearningResourceAnalyticsQuery,
  useListLearningResourceCategoriesQuery,
  useCreateLearningResourceCategoryMutation,
  useListAdminLearningResourcesQuery,
  useUpdateAdminLearningResourceMutation,
  usePublishAdminLearningResourceMutation,
  useUnpublishAdminLearningResourceMutation,
  useDeleteAdminLearningResourceMutation,
} = adminLearningResourcesApi
