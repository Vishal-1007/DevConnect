import { devConnectApi } from './baseApi'

export interface LearningResourceCard {
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

export interface LearningResourceDetail extends LearningResourceCard {
  fileUrl: string | null
  downloadUrl: string | null
  related: LearningResourceCard[]
}

export interface PlatformVideoCard {
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

export interface PlatformVideoDetail extends PlatformVideoCard {
  videoUrl: string | null
  related: PlatformVideoCard[]
}

export const learningContentApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listResourceCategories: build.query<{ id: string; name: string; sortOrder: number }[], void>({
      query: () => '/api/mentors/learning/resource-categories',
    }),
    listLearningResources: build.query<LearningResourceCard[], { categoryId?: string; q?: string } | undefined>({
      query: (params = {}) => {
        const search = new URLSearchParams()
        if (params.categoryId) search.set('categoryId', params.categoryId)
        if (params.q?.trim()) search.set('q', params.q.trim())
        const qs = search.toString()
        return `/api/mentors/learning/resources${qs ? `?${qs}` : ''}`
      },
      providesTags: [{ type: 'LearningResources', id: 'LIST' }],
    }),
    getLearningResource: build.query<LearningResourceDetail, string>({
      query: (id) => `/api/mentors/learning/resources/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'LearningResources', id }],
    }),
    saveLearningResource: build.mutation<void, string>({
      query: (id) => ({ url: `/api/mentors/learning/resources/${id}/save`, method: 'POST' }),
      invalidatesTags: [{ type: 'LearningResources', id: 'LIST' }],
    }),
    unsaveLearningResource: build.mutation<void, string>({
      query: (id) => ({ url: `/api/mentors/learning/resources/${id}/unsave`, method: 'POST' }),
      invalidatesTags: [{ type: 'LearningResources', id: 'LIST' }],
    }),
    listVideoCategories: build.query<{ id: string; name: string; sortOrder: number }[], void>({
      query: () => '/api/mentors/learning/video-categories',
    }),
    listPlatformVideos: build.query<PlatformVideoCard[], { categoryId?: string; q?: string; sort?: string } | undefined>({
      query: (params = {}) => {
        const search = new URLSearchParams()
        if (params.categoryId) search.set('categoryId', params.categoryId)
        if (params.q?.trim()) search.set('q', params.q.trim())
        if (params.sort) search.set('sort', params.sort)
        const qs = search.toString()
        return `/api/mentors/learning/videos${qs ? `?${qs}` : ''}`
      },
      providesTags: [{ type: 'PlatformVideos', id: 'LIST' }],
    }),
    getPlatformVideo: build.query<PlatformVideoDetail, string>({
      query: (id) => `/api/mentors/learning/videos/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'PlatformVideos', id }],
    }),
    savePlatformVideo: build.mutation<void, string>({
      query: (id) => ({ url: `/api/mentors/learning/videos/${id}/save`, method: 'POST' }),
      invalidatesTags: [{ type: 'PlatformVideos', id: 'LIST' }],
    }),
    unsavePlatformVideo: build.mutation<void, string>({
      query: (id) => ({ url: `/api/mentors/learning/videos/${id}/unsave`, method: 'POST' }),
      invalidatesTags: [{ type: 'PlatformVideos', id: 'LIST' }],
    }),
  }),
})

export const {
  useListResourceCategoriesQuery,
  useListLearningResourcesQuery,
  useGetLearningResourceQuery,
  useSaveLearningResourceMutation,
  useUnsaveLearningResourceMutation,
  useListVideoCategoriesQuery,
  useListPlatformVideosQuery,
  useGetPlatformVideoQuery,
  useSavePlatformVideoMutation,
  useUnsavePlatformVideoMutation,
} = learningContentApi
