import type { EventRevenueAnalytics, EventWithdrawal } from './types'
import { devConnectApi } from './baseApi'

export interface EventSpeaker {
  userId: string
  displayName: string
  role: string | null
}

export interface AdminCommunityEvent {
  id: string
  hostId: string
  hostDisplayName: string
  hostRole: string | null
  title: string
  description: string
  eventType: string
  category: string
  format: string
  locationOrLink: string | null
  startsAt: string
  endsAt: string
  maxAttendees: number
  attendeeCount: number
  full: boolean
  cancelled: boolean
  speakers: EventSpeaker[]
  tags: string[]
  createdAt: string
  updatedAt: string
  thumbnailUrl?: string | null
  paid?: boolean
  priceInr?: number
  featured?: boolean
  approvalStatus?: string | null
  revenueInr?: number
  mentorShareInr?: number
}

export interface EventRegistration {
  userId: string
  username: string
  displayName: string
  registeredAt: string
  attended: boolean
  attendedAt: string | null
}

export interface EventAnalytics {
  totalEvents: number
  upcomingEvents: number
  pastEvents: number
  cancelledEvents: number
  totalRegistrations: number
}

export const adminEventsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listAdminEvents: build.query<
      AdminCommunityEvent[],
      {
        when?: string
        status?: string
        category?: string
        type?: string
        q?: string
        limit?: number
      } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('when', params.when ?? 'upcoming')
        search.set('status', params.status ?? 'active')
        if (params.category && params.category !== 'all') search.set('category', params.category)
        if (params.type && params.type !== 'all') search.set('type', params.type)
        if (params.q?.trim()) search.set('q', params.q.trim())
        search.set('limit', String(params.limit ?? 100))
        return `/api/users/admin/events?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminEvents' as const, id })),
              { type: 'AdminEvents', id: 'LIST' },
            ]
          : [{ type: 'AdminEvents', id: 'LIST' }],
    }),
    getEventAnalytics: build.query<EventAnalytics, void>({
      query: () => '/api/users/admin/events/analytics',
      providesTags: [{ type: 'AdminEvents', id: 'ANALYTICS' }],
    }),
    getAdminEvent: build.query<AdminCommunityEvent, string>({
      query: (id) => `/api/users/admin/events/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AdminEvents', id }],
    }),
    listEventRegistrations: build.query<EventRegistration[], string>({
      query: (id) => `/api/users/admin/events/${id}/registrations`,
      providesTags: (_r, _e, id) => [{ type: 'AdminEvents', id: `${id}-registrations` }],
    }),
    createAdminEvent: build.mutation<
      AdminCommunityEvent,
      {
        hostId: string
        title: string
        description: string
        eventType?: string
        category?: string
        format?: string
        locationOrLink?: string
        startsAt: string
        endsAt: string
        maxAttendees?: number
        tags?: string[]
        speakerIds?: string[]
      }
    >({
      query: (body) => ({
        url: '/api/users/admin/events',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'AdminEvents', id: 'LIST' },
        { type: 'AdminEvents', id: 'ANALYTICS' },
        { type: 'Events', id: 'LIST' },
      ],
    }),
    updateAdminEvent: build.mutation<
      AdminCommunityEvent,
      {
        id: string
        hostId?: string
        title?: string
        description?: string
        eventType?: string
        category?: string
        format?: string
        locationOrLink?: string
        startsAt?: string
        endsAt?: string
        maxAttendees?: number
        tags?: string[]
        speakerIds?: string[]
        cancelled?: boolean
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/users/admin/events/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AdminEvents', id },
        { type: 'AdminEvents', id: 'LIST' },
        { type: 'AdminEvents', id: 'ANALYTICS' },
        { type: 'AdminEvents', id: `${id}-registrations` },
        { type: 'Events', id: 'LIST' },
      ],
    }),
    cancelAdminEvent: build.mutation<AdminCommunityEvent, string>({
      query: (id) => ({
        url: `/api/users/admin/events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminEvents', id },
        { type: 'AdminEvents', id: 'LIST' },
        { type: 'AdminEvents', id: 'ANALYTICS' },
        { type: 'Events', id: 'LIST' },
      ],
    }),
    restoreAdminEvent: build.mutation<AdminCommunityEvent, string>({
      query: (id) => ({
        url: `/api/users/admin/events/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminEvents', id },
        { type: 'AdminEvents', id: 'LIST' },
        { type: 'AdminEvents', id: 'ANALYTICS' },
        { type: 'Events', id: 'LIST' },
      ],
    }),
    getEventRevenue: build.query<EventRevenueAnalytics, void>({
      query: () => '/api/users/admin/events/revenue',
      providesTags: [{ type: 'AdminEvents', id: 'REVENUE' }],
    }),
    approveEvent: build.mutation<import('./types').CommunityEvent, string>({
      query: (eventId) => ({
        url: `/api/users/admin/events/${eventId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'AdminEvents', id: 'LIST' },
        { type: 'AdminEvents', id: 'REVENUE' },
        { type: 'Events', id: 'LIST' },
      ],
    }),
    rejectEvent: build.mutation<import('./types').CommunityEvent, { eventId: string; note?: string }>({
      query: ({ eventId, note }) => ({
        url: `/api/users/admin/events/${eventId}/reject${note ? `?note=${encodeURIComponent(note)}` : ''}`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'AdminEvents', id: 'LIST' },
        { type: 'AdminEvents', id: 'REVENUE' },
        { type: 'Events', id: 'LIST' },
      ],
    }),
    setEventFeatured: build.mutation<import('./types').CommunityEvent, { eventId: string; featured: boolean }>({
      query: ({ eventId, featured }) => ({
        url: `/api/users/admin/events/${eventId}/featured?featured=${featured}`,
        method: 'PUT',
      }),
      invalidatesTags: [
        { type: 'AdminEvents', id: 'LIST' },
        { type: 'Events', id: 'LIST' },
      ],
    }),
    listEventWithdrawals: build.query<EventWithdrawal[], string | void>({
      query: (status) => `/api/users/admin/events/withdrawals?status=${status ?? 'pending'}`,
      providesTags: [{ type: 'AdminEvents', id: 'WITHDRAWALS' }],
    }),
    approveEventWithdrawal: build.mutation<void, string>({
      query: (withdrawalId) => ({
        url: `/api/users/admin/events/withdrawals/${withdrawalId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'AdminEvents', id: 'WITHDRAWALS' }, { type: 'AdminEvents', id: 'REVENUE' }],
    }),
    rejectEventWithdrawal: build.mutation<void, { withdrawalId: string; note?: string }>({
      query: ({ withdrawalId, note }) => ({
        url: `/api/users/admin/events/withdrawals/${withdrawalId}/reject${note ? `?note=${encodeURIComponent(note)}` : ''}`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'AdminEvents', id: 'WITHDRAWALS' }],
    }),
  }),
})

export const {
  useListAdminEventsQuery,
  useGetEventAnalyticsQuery,
  useGetAdminEventQuery,
  useListEventRegistrationsQuery,
  useCreateAdminEventMutation,
  useUpdateAdminEventMutation,
  useCancelAdminEventMutation,
  useRestoreAdminEventMutation,
  useGetEventRevenueQuery,
  useApproveEventMutation,
  useRejectEventMutation,
  useSetEventFeaturedMutation,
  useListEventWithdrawalsQuery,
  useApproveEventWithdrawalMutation,
  useRejectEventWithdrawalMutation,
} = adminEventsApi
