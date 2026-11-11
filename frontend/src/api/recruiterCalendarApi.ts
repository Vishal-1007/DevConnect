import { devConnectApi } from './baseApi'

export type InterviewCalendarEventPayload = {
  interviewId: string
  candidateName: string
  candidateEmail?: string | null
  recruiterEmail?: string | null
  jobTitle: string
  interviewType?: string
  company?: string
  notes?: string
  meetingLink?: string
  scheduledAt: string
  durationMinutes: number
}

export type InterviewCalendarEventResult = {
  googleCalendarEventId: string | null
  meetingLink: string | null
  calendarEventCreated: boolean
  candidateInviteSent: boolean
  message: string
}

export const recruiterCalendarApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    createInterviewCalendarEvent: build.mutation<
      InterviewCalendarEventResult,
      InterviewCalendarEventPayload
    >({
      query: (body) => ({
        url: '/api/recruiter/calendar/events',
        method: 'POST',
        body,
      }),
    }),
    updateInterviewCalendarEvent: build.mutation<
      InterviewCalendarEventResult,
      { googleEventId: string; body: InterviewCalendarEventPayload }
    >({
      query: ({ googleEventId, body }) => ({
        url: `/api/recruiter/calendar/events/${encodeURIComponent(googleEventId)}`,
        method: 'PUT',
        body,
      }),
    }),
    deleteInterviewCalendarEvent: build.mutation<
      InterviewCalendarEventResult,
      string
    >({
      query: (googleEventId) => ({
        url: `/api/recruiter/calendar/events/${encodeURIComponent(googleEventId)}`,
        method: 'DELETE',
      }),
    }),
  }),
})

export const {
  useCreateInterviewCalendarEventMutation,
  useUpdateInterviewCalendarEventMutation,
  useDeleteInterviewCalendarEventMutation,
} = recruiterCalendarApi
