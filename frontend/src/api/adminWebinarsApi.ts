import { devConnectApi } from './baseApi'

export interface WebinarSpeaker {
  userId: string
  displayName: string
  role: string | null
}

export interface AdminWebinar {
  id: string
  hostId: string
  hostDisplayName: string
  hostRole: string | null
  title: string
  description: string
  webinarSubtype: string
  category: string
  format: string
  streamUrl: string | null
  recordingUrl: string | null
  hostApprovalStatus: string
  streamStatus: string
  startsAt: string
  endsAt: string
  maxAttendees: number
  registeredCount: number
  attendedCount: number
  full: boolean
  cancelled: boolean
  speakers: WebinarSpeaker[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface WebinarAttendance {
  userId: string
  username: string
  displayName: string
  registeredAt: string
  attended: boolean
  attendedAt: string | null
}

export interface WebinarAnalytics {
  totalWebinars: number
  upcomingWebinars: number
  liveWebinars: number
  pendingHostApprovals: number
  totalRegistrations: number
  totalAttended: number
  cancelledWebinars: number
}

export const adminWebinarsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listAdminWebinars: build.query<
      AdminWebinar[],
      {
        when?: string
        status?: string
        subtype?: string
        hostApproval?: string
        streamStatus?: string
        q?: string
        limit?: number
      } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('when', params.when ?? 'upcoming')
        search.set('status', params.status ?? 'active')
        if (params.subtype && params.subtype !== 'all') search.set('subtype', params.subtype)
        if (params.hostApproval && params.hostApproval !== 'all') search.set('hostApproval', params.hostApproval)
        if (params.streamStatus && params.streamStatus !== 'all') search.set('streamStatus', params.streamStatus)
        if (params.q?.trim()) search.set('q', params.q.trim())
        search.set('limit', String(params.limit ?? 100))
        return `/api/users/admin/webinars?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminWebinars' as const, id })),
              { type: 'AdminWebinars', id: 'LIST' },
            ]
          : [{ type: 'AdminWebinars', id: 'LIST' }],
    }),
    getWebinarAnalytics: build.query<WebinarAnalytics, void>({
      query: () => '/api/users/admin/webinars/analytics',
      providesTags: [{ type: 'AdminWebinars', id: 'ANALYTICS' }],
    }),
    listWebinarAttendance: build.query<WebinarAttendance[], string>({
      query: (id) => `/api/users/admin/webinars/${id}/attendance`,
      providesTags: (_r, _e, id) => [{ type: 'AdminWebinars', id: `${id}-attendance` }],
    }),
    createAdminWebinar: build.mutation<
      AdminWebinar,
      {
        hostId: string
        title: string
        description: string
        webinarSubtype?: string
        category?: string
        format?: string
        streamUrl?: string
        startsAt: string
        endsAt: string
        maxAttendees?: number
        tags?: string[]
        speakerIds?: string[]
      }
    >({
      query: (body) => ({ url: '/api/users/admin/webinars', method: 'POST', body }),
      invalidatesTags: [
        { type: 'AdminWebinars', id: 'LIST' },
        { type: 'AdminWebinars', id: 'ANALYTICS' },
        { type: 'Events', id: 'LIST' },
      ],
    }),
    updateAdminWebinar: build.mutation<
      AdminWebinar,
      {
        id: string
        hostId?: string
        title?: string
        description?: string
        webinarSubtype?: string
        category?: string
        streamUrl?: string
        recordingUrl?: string
        startsAt?: string
        endsAt?: string
        maxAttendees?: number
        tags?: string[]
        speakerIds?: string[]
        cancelled?: boolean
      }
    >({
      query: ({ id, ...body }) => ({ url: `/api/users/admin/webinars/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AdminWebinars', id },
        { type: 'AdminWebinars', id: 'LIST' },
        { type: 'AdminWebinars', id: 'ANALYTICS' },
        { type: 'AdminWebinars', id: `${id}-attendance` },
        { type: 'Events', id: 'LIST' },
      ],
    }),
    approveWebinarHost: build.mutation<AdminWebinar, string>({
      query: (id) => ({ url: `/api/users/admin/webinars/${id}/approve-host`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminWebinars', id },
        { type: 'AdminWebinars', id: 'LIST' },
        { type: 'AdminWebinars', id: 'ANALYTICS' },
      ],
    }),
    rejectWebinarHost: build.mutation<AdminWebinar, string>({
      query: (id) => ({ url: `/api/users/admin/webinars/${id}/reject-host`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminWebinars', id },
        { type: 'AdminWebinars', id: 'LIST' },
        { type: 'AdminWebinars', id: 'ANALYTICS' },
      ],
    }),
    goLiveWebinar: build.mutation<AdminWebinar, string>({
      query: (id) => ({ url: `/api/users/admin/webinars/${id}/go-live`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminWebinars', id },
        { type: 'AdminWebinars', id: 'LIST' },
        { type: 'AdminWebinars', id: 'ANALYTICS' },
      ],
    }),
    endWebinarStream: build.mutation<AdminWebinar, string>({
      query: (id) => ({ url: `/api/users/admin/webinars/${id}/end-stream`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminWebinars', id },
        { type: 'AdminWebinars', id: 'LIST' },
        { type: 'AdminWebinars', id: 'ANALYTICS' },
      ],
    }),
    updateWebinarStream: build.mutation<AdminWebinar, { id: string; streamUrl?: string; recordingUrl?: string }>({
      query: ({ id, ...body }) => ({ url: `/api/users/admin/webinars/${id}/stream`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AdminWebinars', id },
        { type: 'AdminWebinars', id: 'LIST' },
      ],
    }),
    checkInWebinarAttendee: build.mutation<WebinarAttendance, { webinarId: string; userId: string }>({
      query: ({ webinarId, userId }) => ({
        url: `/api/users/admin/webinars/${webinarId}/attendance/${userId}/check-in`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { webinarId }) => [
        { type: 'AdminWebinars', id: webinarId },
        { type: 'AdminWebinars', id: `${webinarId}-attendance` },
        { type: 'AdminWebinars', id: 'ANALYTICS' },
      ],
    }),
    cancelAdminWebinar: build.mutation<AdminWebinar, string>({
      query: (id) => ({ url: `/api/users/admin/webinars/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminWebinars', id },
        { type: 'AdminWebinars', id: 'LIST' },
        { type: 'AdminWebinars', id: 'ANALYTICS' },
        { type: 'Events', id: 'LIST' },
      ],
    }),
    restoreAdminWebinar: build.mutation<AdminWebinar, string>({
      query: (id) => ({ url: `/api/users/admin/webinars/${id}/restore`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminWebinars', id },
        { type: 'AdminWebinars', id: 'LIST' },
        { type: 'AdminWebinars', id: 'ANALYTICS' },
      ],
    }),
  }),
})

export const {
  useListAdminWebinarsQuery,
  useGetWebinarAnalyticsQuery,
  useListWebinarAttendanceQuery,
  useCreateAdminWebinarMutation,
  useUpdateAdminWebinarMutation,
  useApproveWebinarHostMutation,
  useRejectWebinarHostMutation,
  useGoLiveWebinarMutation,
  useEndWebinarStreamMutation,
  useUpdateWebinarStreamMutation,
  useCheckInWebinarAttendeeMutation,
  useCancelAdminWebinarMutation,
  useRestoreAdminWebinarMutation,
} = adminWebinarsApi
