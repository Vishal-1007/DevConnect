import type {
  CommunityEvent,
  CreateCommunityEvent,
  EventOrder,
  EventStats,
  PopularHost,
} from './types'
import { devConnectApi } from './baseApi'

export const eventsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listEvents: build.query<
      CommunityEvent[],
      { when?: string; category?: string; type?: string; q?: string; limit?: number } | void
    >({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('when', params?.when ?? 'upcoming')
        if (params?.category && params.category !== 'all') search.set('category', params.category)
        if (params?.type && params.type !== 'all') search.set('type', params.type)
        if (params?.q?.trim()) search.set('q', params.q.trim())
        search.set('limit', String(params?.limit ?? 50))
        return `/api/users/events?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Events' as const, id })),
              { type: 'Events', id: 'LIST' },
            ]
          : [{ type: 'Events', id: 'LIST' }],
    }),
    getEvent: build.query<CommunityEvent, string>({
      query: (id) => `/api/users/events/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Events', id }],
    }),
    getEventStats: build.query<EventStats, void>({
      query: () => '/api/users/events/stats',
      providesTags: [{ type: 'Events', id: 'STATS' }],
    }),
    listMyRegistrations: build.query<CommunityEvent[], void>({
      query: () => '/api/users/events/my-registrations',
      providesTags: [{ type: 'Events', id: 'MY_REGISTRATIONS' }],
    }),
    listBookmarkedEvents: build.query<CommunityEvent[], void>({
      query: () => '/api/users/events/bookmarks',
      providesTags: [{ type: 'Events', id: 'BOOKMARKS' }],
    }),
    listPopularHosts: build.query<PopularHost[], number | void>({
      query: (limit) => `/api/users/events/popular-hosts?limit=${limit ?? 6}`,
      providesTags: [{ type: 'Events', id: 'POPULAR_HOSTS' }],
    }),
    createEvent: build.mutation<CommunityEvent, CreateCommunityEvent>({
      query: (body) => ({
        url: '/api/users/events',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Events', id: 'LIST' }, { type: 'Events', id: 'STATS' }],
    }),
    registerForEvent: build.mutation<CommunityEvent, string>({
      query: (eventId) => ({
        url: `/api/users/events/${eventId}/register`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, eventId) => [
        { type: 'Events', id: eventId },
        { type: 'Events', id: 'LIST' },
        { type: 'Events', id: 'STATS' },
        { type: 'Events', id: 'MY_REGISTRATIONS' },
      ],
    }),
    unregisterFromEvent: build.mutation<CommunityEvent, string>({
      query: (eventId) => ({
        url: `/api/users/events/${eventId}/register`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, eventId) => [
        { type: 'Events', id: eventId },
        { type: 'Events', id: 'LIST' },
        { type: 'Events', id: 'STATS' },
        { type: 'Events', id: 'MY_REGISTRATIONS' },
      ],
    }),
    toggleEventBookmark: build.mutation<void, string>({
      query: (eventId) => ({
        url: `/api/users/events/${eventId}/bookmark`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, eventId) => [
        { type: 'Events', id: eventId },
        { type: 'Events', id: 'LIST' },
        { type: 'Events', id: 'BOOKMARKS' },
      ],
    }),
    createEventPaymentOrder: build.mutation<EventOrder, string>({
      query: (eventId) => ({
        url: `/api/users/events/${eventId}/payment/create-order`,
        method: 'POST',
      }),
    }),
    confirmEventPayment: build.mutation<CommunityEvent, { eventId: string; paymentId: string }>({
      query: ({ eventId, paymentId }) => ({
        url: `/api/users/events/${eventId}/payment/confirm`,
        method: 'POST',
        body: { paymentId },
      }),
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: 'Events', id: eventId },
        { type: 'Events', id: 'LIST' },
        { type: 'Events', id: 'STATS' },
        { type: 'Events', id: 'MY_REGISTRATIONS' },
      ],
    }),
  }),
})

export const {
  useListEventsQuery,
  useGetEventQuery,
  useGetEventStatsQuery,
  useListMyRegistrationsQuery,
  useListBookmarkedEventsQuery,
  useListPopularHostsQuery,
  useCreateEventMutation,
  useRegisterForEventMutation,
  useUnregisterFromEventMutation,
  useToggleEventBookmarkMutation,
  useCreateEventPaymentOrderMutation,
  useConfirmEventPaymentMutation,
} = eventsApi
