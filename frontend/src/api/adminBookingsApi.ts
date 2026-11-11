import { devConnectApi } from './baseApi'

export interface MentorshipBooking {
  id: string
  bookingCode: string
  mentorId: string
  learnerId: string
  mentorDisplayName: string
  learnerDisplayName: string
  scheduledAt: string
  scheduledDateLabel: string
  scheduledTimeLabel?: string
  timezone?: string
  durationMinutes: number
  durationLabel: string
  hourlyRateCents: number
  rateLabel: string
  amountCents: number
  amountLabel: string
  status: string
  refundStatus: string
  notes: string | null
  requestType?: string
  requestTypeLabel?: string
  requestMessage?: string
  upcoming?: boolean
  createdAt: string
  cancelledAt: string | null
  completedAt: string | null
}

export interface BookingAnalytics {
  totalBookings: number
  confirmedCount: number
  pendingCount: number
  scheduledCount: number
  completedCount: number
  cancelledCount: number
  refundRequestedCount: number
  refundedCount: number
  revenueCents: number
  revenueLabel: string
  refundedCents: number
  refundedLabel: string
  pendingRefundCents: number
  pendingRefundLabel: string
  bookingsByStatus: Record<string, number>
  revenueTrend: { label: string; amountCents: number }[]
}

export interface MentorAvailability {
  mentorId: string
  mentorDisplayName: string
  mentorAvailable: boolean
  activeSlotCount: number
  slots: {
    id: string
    dayOfWeek: number
    dayLabel: string
    startTime: string
    endTime: string
    timezone: string
    active: boolean
  }[]
}

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: 'amber',
  confirmed: 'blue',
  completed: 'green',
  cancelled: 'red',
  refund_requested: 'amber',
  refunded: 'gray',
}

export function bookingStatusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export const adminBookingsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listAdminBookings: build.query<
      MentorshipBooking[],
      { status?: string; filter?: string; q?: string; limit?: number } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('status', params.status ?? 'all')
        if (params.filter) search.set('filter', params.filter)
        if (params.q?.trim()) search.set('q', params.q.trim())
        search.set('limit', String(params.limit ?? 100))
        return `/api/mentors/admin/bookings?${search.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminBookings' as const, id })),
              { type: 'AdminBookings', id: 'LIST' },
            ]
          : [{ type: 'AdminBookings', id: 'LIST' }],
    }),
    getBookingAnalytics: build.query<BookingAnalytics, void>({
      query: () => '/api/mentors/admin/bookings/analytics',
      providesTags: [{ type: 'AdminBookings', id: 'ANALYTICS' }],
    }),
    getMentorAvailability: build.query<MentorAvailability[], void>({
      query: () => '/api/mentors/admin/bookings/availability',
      providesTags: [{ type: 'AdminBookings', id: 'AVAILABILITY' }],
    }),
    getAdminBooking: build.query<MentorshipBooking, string>({
      query: (id) => `/api/mentors/admin/bookings/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AdminBookings', id }],
    }),
    confirmAdminBooking: build.mutation<MentorshipBooking, string>({
      query: (id) => ({ url: `/api/mentors/admin/bookings/${id}/confirm`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminBookings', id },
        { type: 'AdminBookings', id: 'LIST' },
        { type: 'AdminBookings', id: 'ANALYTICS' },
      ],
    }),
    completeAdminBooking: build.mutation<MentorshipBooking, string>({
      query: (id) => ({ url: `/api/mentors/admin/bookings/${id}/complete`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminBookings', id },
        { type: 'AdminBookings', id: 'LIST' },
        { type: 'AdminBookings', id: 'ANALYTICS' },
      ],
    }),
    cancelAdminBooking: build.mutation<MentorshipBooking, string>({
      query: (id) => ({ url: `/api/mentors/admin/bookings/${id}/cancel`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminBookings', id },
        { type: 'AdminBookings', id: 'LIST' },
        { type: 'AdminBookings', id: 'ANALYTICS' },
      ],
    }),
    requestBookingRefund: build.mutation<MentorshipBooking, string>({
      query: (id) => ({ url: `/api/mentors/admin/bookings/${id}/refund-request`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminBookings', id },
        { type: 'AdminBookings', id: 'LIST' },
        { type: 'AdminBookings', id: 'ANALYTICS' },
      ],
    }),
    approveBookingRefund: build.mutation<MentorshipBooking, string>({
      query: (id) => ({ url: `/api/mentors/admin/bookings/${id}/refund-approve`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminBookings', id },
        { type: 'AdminBookings', id: 'LIST' },
        { type: 'AdminBookings', id: 'ANALYTICS' },
      ],
    }),
    rejectBookingRefund: build.mutation<MentorshipBooking, string>({
      query: (id) => ({ url: `/api/mentors/admin/bookings/${id}/refund-reject`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminBookings', id },
        { type: 'AdminBookings', id: 'LIST' },
        { type: 'AdminBookings', id: 'ANALYTICS' },
      ],
    }),
  }),
})

export const {
  useListAdminBookingsQuery,
  useGetBookingAnalyticsQuery,
  useGetMentorAvailabilityQuery,
  useGetAdminBookingQuery,
  useConfirmAdminBookingMutation,
  useCompleteAdminBookingMutation,
  useCancelAdminBookingMutation,
  useRequestBookingRefundMutation,
  useApproveBookingRefundMutation,
  useRejectBookingRefundMutation,
} = adminBookingsApi
