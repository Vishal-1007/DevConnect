import { devConnectApi } from './baseApi'

export interface AdminCommunityRoom {
  id: string
  title: string
  description: string
  category: string
  categoryLabel: string
  status: string
  visibility: string
  visibilityLabel: string
  featured: boolean
  featuredOrder: number
  hostId: string
  hostDisplayName: string
  moderatorId: string | null
  moderatorDisplayName: string | null
  maxParticipants: number
  participantCount: number
  tags: string[]
  createdAt: string
}

export interface CommunityRoomCategory {
  id: string
  slug: string
  label: string
  description: string | null
  displayOrder: number
  active: boolean
  roomCount: number
}

export interface CommunityRoomAnalytics {
  totalRooms: number
  liveRooms: number
  featuredCount: number
  publicCount: number
  unlistedCount: number
  privateCount: number
  withModeratorCount: number
  roomsByCategory: Record<string, number>
}

export const VISIBILITY_COLORS: Record<string, string> = {
  public: 'green',
  unlisted: 'amber',
  private: 'red',
}

export const adminCommunityRoomsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listAdminCommunityRooms: build.query<
      AdminCommunityRoom[],
      { status?: string; category?: string; visibility?: string; q?: string; limit?: number } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('status', params.status ?? 'all')
        if (params.category && params.category !== 'all') search.set('category', params.category)
        if (params.visibility && params.visibility !== 'all') search.set('visibility', params.visibility)
        if (params.q?.trim()) search.set('q', params.q.trim())
        search.set('limit', String(params.limit ?? 100))
        return `/api/users/admin/community-rooms?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminCommunityRooms' as const, id })),
              { type: 'AdminCommunityRooms', id: 'LIST' },
            ]
          : [{ type: 'AdminCommunityRooms', id: 'LIST' }],
    }),
    listFeaturedCommunityRooms: build.query<AdminCommunityRoom[], { status?: string; limit?: number } | undefined>({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('status', params.status ?? 'live')
        search.set('limit', String(params.limit ?? 10))
        return `/api/users/admin/community-rooms/featured?${search.toString()}`
      },
      providesTags: [{ type: 'AdminCommunityRooms', id: 'FEATURED' }],
    }),
    getCommunityRoomAnalytics: build.query<CommunityRoomAnalytics, void>({
      query: () => '/api/users/admin/community-rooms/analytics',
      providesTags: [{ type: 'AdminCommunityRooms', id: 'ANALYTICS' }],
    }),
    getAdminCommunityRoom: build.query<AdminCommunityRoom, string>({
      query: (id) => `/api/users/admin/community-rooms/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AdminCommunityRooms', id }],
    }),
    updateAdminCommunityRoom: build.mutation<
      AdminCommunityRoom,
      {
        id: string
        featured?: boolean
        featuredOrder?: number
        visibility?: string
        category?: string
        moderatorId?: string
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/users/admin/community-rooms/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AdminCommunityRooms', id },
        { type: 'AdminCommunityRooms', id: 'LIST' },
        { type: 'AdminCommunityRooms', id: 'FEATURED' },
        { type: 'AdminCommunityRooms', id: 'ANALYTICS' },
        { type: 'VideoRooms', id: 'LIST' },
      ],
    }),
    clearCommunityRoomModerator: build.mutation<AdminCommunityRoom, string>({
      query: (id) => ({
        url: `/api/users/admin/community-rooms/${id}/moderator`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminCommunityRooms', id },
        { type: 'AdminCommunityRooms', id: 'LIST' },
      ],
    }),
    listCommunityCategories: build.query<CommunityRoomCategory[], void>({
      query: () => '/api/users/admin/community-rooms/categories',
      providesTags: [{ type: 'AdminCommunityRooms', id: 'CATEGORIES' }],
    }),
    createCommunityCategory: build.mutation<
      CommunityRoomCategory,
      { slug: string; label: string; description?: string; displayOrder?: number; active?: boolean }
    >({
      query: (body) => ({
        url: '/api/users/admin/community-rooms/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'AdminCommunityRooms', id: 'CATEGORIES' }],
    }),
    updateCommunityCategory: build.mutation<
      CommunityRoomCategory,
      { id: string; slug: string; label: string; description?: string; displayOrder?: number; active?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/users/admin/community-rooms/categories/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'AdminCommunityRooms', id: 'CATEGORIES' }],
    }),
    deleteCommunityCategory: build.mutation<void, string>({
      query: (id) => ({
        url: `/api/users/admin/community-rooms/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'AdminCommunityRooms', id: 'CATEGORIES' }],
    }),
  }),
})

export const {
  useListAdminCommunityRoomsQuery,
  useListFeaturedCommunityRoomsQuery,
  useGetCommunityRoomAnalyticsQuery,
  useGetAdminCommunityRoomQuery,
  useUpdateAdminCommunityRoomMutation,
  useClearCommunityRoomModeratorMutation,
  useListCommunityCategoriesQuery,
  useCreateCommunityCategoryMutation,
  useUpdateCommunityCategoryMutation,
  useDeleteCommunityCategoryMutation,
} = adminCommunityRoomsApi
