import type { CommunityEvent, CreateMentorEvent, MentorEventDashboard } from './types'

export interface MentorEventRegistration {
  userId: string
  username: string
  displayName: string
  registeredAt: string
  paymentStatus: string
  amountPaidInr: number
}

export interface MentorHostedEventManage {
  event: CommunityEvent
  totalRegistrations: number
  revenueInr: number
  mentorEarningsInr: number
}

export interface UpdateMentorEvent {
  title?: string
  description?: string
  eventType?: string
  category?: string
  format?: string
  locationOrLink?: string
  startsAt?: string
  endsAt?: string
  maxAttendees?: number
  thumbnailUrl?: string
  paid?: boolean
  priceInr?: number
  topicsCovered?: string
  requirements?: string
}
import { devConnectApi } from './baseApi'

export interface MentorEventRole {
  role: string
  status: string
  appliedAt: string
}

export interface MentorEvent {
  id: string
  hostId: string
  hostDisplayName: string
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
  registeredByMe: boolean
  full: boolean
  tags: string[]
  speakers: { userId: string; displayName: string; role: string | null }[]
  openRoles: string[]
  myRoles: MentorEventRole[]
}

export interface MentorEventSummary {
  totalUpcoming: number
  hackathons: number
  workshops: number
  networkingEvents: number
  myParticipations: number
  approvedRoles: number
}

export const mentorEventsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listMentorEvents: build.query<
      MentorEvent[],
      { when?: string; type?: string; q?: string; mineOnly?: boolean; limit?: number } | void
    >({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('when', params?.when ?? 'upcoming')
        if (params?.type && params.type !== 'all') search.set('type', params.type)
        if (params?.q?.trim()) search.set('q', params.q.trim())
        if (params?.mineOnly) search.set('mineOnly', 'true')
        search.set('limit', String(params?.limit ?? 50))
        return `/api/users/me/events?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'MentorEvents' as const, id })),
              { type: 'MentorEvents', id: 'LIST' },
            ]
          : [{ type: 'MentorEvents', id: 'LIST' }],
    }),
    getMentorEventsSummary: build.query<MentorEventSummary, void>({
      query: () => '/api/users/me/events/summary',
      providesTags: [{ type: 'MentorEvents', id: 'SUMMARY' }],
    }),
    getMentorEvent: build.query<MentorEvent, string>({
      query: (id) => `/api/users/me/events/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'MentorEvents', id }],
    }),
    applyMentorEventRole: build.mutation<MentorEvent, { eventId: string; role: string }>({
      query: ({ eventId, role }) => ({
        url: `/api/users/me/events/${eventId}/roles`,
        method: 'POST',
        body: { role },
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: 'MentorEvents', id: eventId },
        { type: 'MentorEvents', id: 'LIST' },
        { type: 'MentorEvents', id: 'SUMMARY' },
        { type: 'Events', id: 'LIST' },
      ],
    }),
    withdrawMentorEventRole: build.mutation<MentorEvent, { eventId: string; role: string }>({
      query: ({ eventId, role }) => ({
        url: `/api/users/me/events/${eventId}/roles/${role}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: 'MentorEvents', id: eventId },
        { type: 'MentorEvents', id: 'LIST' },
        { type: 'MentorEvents', id: 'SUMMARY' },
        { type: 'Events', id: 'LIST' },
      ],
    }),
    getMentorEventDashboard: build.query<MentorEventDashboard, void>({
      query: () => '/api/users/me/events/dashboard',
      providesTags: [{ type: 'MentorEvents', id: 'DASHBOARD' }],
    }),
    listHostedEvents: build.query<CommunityEvent[], number | void>({
      query: (limit) => `/api/users/me/events/hosted?limit=${limit ?? 50}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'MentorEvents' as const, id })),
              { type: 'MentorEvents', id: 'HOSTED' },
            ]
          : [{ type: 'MentorEvents', id: 'HOSTED' }],
    }),
    createHostedEvent: build.mutation<CommunityEvent, CreateMentorEvent>({
      query: (body) => ({
        url: '/api/users/me/events/host',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'MentorEvents', id: 'HOSTED' },
        { type: 'MentorEvents', id: 'DASHBOARD' },
        { type: 'AdminEvents', id: 'LIST' },
        { type: 'Events', id: 'LIST' },
      ],
    }),
    requestEventWithdrawal: build.mutation<void, number>({
      query: (amountInr) => ({
        url: `/api/users/me/events/withdraw?amountInr=${amountInr}`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'MentorEvents', id: 'DASHBOARD' }],
    }),
    getHostedEventManage: build.query<MentorHostedEventManage, string>({
      query: (eventId) => `/api/users/me/events/hosted/${eventId}/manage`,
      providesTags: (_result, _error, eventId) => [
        { type: 'MentorEvents', id: eventId },
        { type: 'MentorEvents', id: 'HOSTED' },
      ],
    }),
    listHostedEventRegistrations: build.query<MentorEventRegistration[], string>({
      query: (eventId) => `/api/users/me/events/hosted/${eventId}/registrations`,
      providesTags: (_result, _error, eventId) => [
        { type: 'MentorEvents', id: `${eventId}-regs` },
      ],
    }),
    updateHostedEvent: build.mutation<CommunityEvent, { eventId: string; body: UpdateMentorEvent }>({
      query: ({ eventId, body }) => ({
        url: `/api/users/me/events/hosted/${eventId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: 'MentorEvents', id: eventId },
        { type: 'MentorEvents', id: 'HOSTED' },
        { type: 'MentorEvents', id: 'DASHBOARD' },
        { type: 'Events', id: eventId },
        { type: 'Events', id: 'LIST' },
        { type: 'AdminEvents', id: 'LIST' },
      ],
    }),
    cancelHostedEvent: build.mutation<CommunityEvent, string>({
      query: (eventId) => ({
        url: `/api/users/me/events/hosted/${eventId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, eventId) => [
        { type: 'MentorEvents', id: eventId },
        { type: 'MentorEvents', id: 'HOSTED' },
        { type: 'MentorEvents', id: 'DASHBOARD' },
        { type: 'Events', id: eventId },
        { type: 'Events', id: 'LIST' },
        { type: 'AdminEvents', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useListMentorEventsQuery,
  useGetMentorEventsSummaryQuery,
  useGetMentorEventQuery,
  useApplyMentorEventRoleMutation,
  useWithdrawMentorEventRoleMutation,
  useGetMentorEventDashboardQuery,
  useListHostedEventsQuery,
  useCreateHostedEventMutation,
  useRequestEventWithdrawalMutation,
  useGetHostedEventManageQuery,
  useListHostedEventRegistrationsQuery,
  useUpdateHostedEventMutation,
  useCancelHostedEventMutation,
} = mentorEventsApi
