import { devConnectApi } from './baseApi'
import type { MockInterviewSlot } from './mockInterviewApi'

export interface MentorWeeklySlot {
  dayOfWeek: number
  day: string
  startTime: string
  endTime: string
}

export interface MentorDailySlots {
  date: string
  times: string[]
}

export interface MentorPublicAvailability {
  mentorId: string
  mentor: string
  vacationMode: boolean
  acceptingBookings: boolean
  autoSchedulingEnabled: boolean
  timezone: string
  weeklySlots: MentorWeeklySlot[]
  availableSlots: MentorDailySlots[]
  slots: MockInterviewSlot[]
}

export const mentorAvailabilityApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getMentorPublicAvailability: build.query<
      MentorPublicAvailability,
      {
        mentorId: string
        date?: string
        fromDate?: string
        toDate?: string
        durationMinutes?: number
      }
    >({
      query: ({ mentorId, date, fromDate, toDate, durationMinutes = 30 }) => ({
        url: `/api/mentor/${mentorId}/availability`,
        params: { date, fromDate, toDate, durationMinutes },
      }),
      providesTags: (_r, _e, { mentorId }) => [{ type: 'MentorAvailability', id: mentorId }],
    }),
  }),
})

export const { useGetMentorPublicAvailabilityQuery, useLazyGetMentorPublicAvailabilityQuery } =
  mentorAvailabilityApi
