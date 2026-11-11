import { devConnectApi } from './baseApi'

export interface AdminDiscussionThread {
  id: string
  authorId: string
  authorDisplayName: string
  authorRole: string | null
  title: string
  content: string
  topic: string
  tags: string[]
  solved: boolean
  pinned: boolean
  pinnedOrder: number
  removed: boolean
  replyCount: number
  createdAt: string
  updatedAt: string
}

export interface DiscussionAnalytics {
  totalThreads: number
  activeThreads: number
  pinnedThreads: number
  removedThreads: number
  solvedThreads: number
}

export const adminDiscussionsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listAdminDiscussions: build.query<
      AdminDiscussionThread[],
      { status?: string; topic?: string; q?: string; limit?: number } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('status', params.status ?? 'active')
        if (params.topic && params.topic !== 'all') search.set('topic', params.topic)
        if (params.q?.trim()) search.set('q', params.q.trim())
        search.set('limit', String(params.limit ?? 100))
        return `/api/users/admin/discussions?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminDiscussions' as const, id })),
              { type: 'AdminDiscussions', id: 'LIST' },
            ]
          : [{ type: 'AdminDiscussions', id: 'LIST' }],
    }),
    getDiscussionAnalytics: build.query<DiscussionAnalytics, void>({
      query: () => '/api/users/admin/discussions/analytics',
      providesTags: [{ type: 'AdminDiscussions', id: 'ANALYTICS' }],
    }),
    getAdminDiscussion: build.query<AdminDiscussionThread, string>({
      query: (id) => `/api/users/admin/discussions/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AdminDiscussions', id }],
    }),
    updateAdminDiscussion: build.mutation<
      AdminDiscussionThread,
      { id: string; pinned?: boolean; pinnedOrder?: number; removed?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/users/admin/discussions/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AdminDiscussions', id },
        { type: 'AdminDiscussions', id: 'LIST' },
        { type: 'AdminDiscussions', id: 'ANALYTICS' },
        { type: 'Discussions', id: 'LIST' },
      ],
    }),
    toggleDiscussionPin: build.mutation<AdminDiscussionThread, string>({
      query: (id) => ({
        url: `/api/users/admin/discussions/${id}/pin`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminDiscussions', id },
        { type: 'AdminDiscussions', id: 'LIST' },
        { type: 'AdminDiscussions', id: 'ANALYTICS' },
        { type: 'Discussions', id: 'LIST' },
      ],
    }),
    removeAdminDiscussion: build.mutation<AdminDiscussionThread, string>({
      query: (id) => ({
        url: `/api/users/admin/discussions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminDiscussions', id },
        { type: 'AdminDiscussions', id: 'LIST' },
        { type: 'AdminDiscussions', id: 'ANALYTICS' },
        { type: 'Discussions', id: 'LIST' },
      ],
    }),
    restoreAdminDiscussion: build.mutation<AdminDiscussionThread, string>({
      query: (id) => ({
        url: `/api/users/admin/discussions/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminDiscussions', id },
        { type: 'AdminDiscussions', id: 'LIST' },
        { type: 'AdminDiscussions', id: 'ANALYTICS' },
        { type: 'Discussions', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useListAdminDiscussionsQuery,
  useGetDiscussionAnalyticsQuery,
  useGetAdminDiscussionQuery,
  useUpdateAdminDiscussionMutation,
  useToggleDiscussionPinMutation,
  useRemoveAdminDiscussionMutation,
  useRestoreAdminDiscussionMutation,
} = adminDiscussionsApi
