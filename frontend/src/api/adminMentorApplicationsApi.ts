import type { MentorApplicationFormData } from '../components/mentor-onboarding/types'
import { devConnectApi } from './baseApi'

export interface ApplicationTimelineEvent {
  type: string
  label: string
  occurredAt: string
  actor: string | null
}

export interface AdminMentorApplicationDetail {
  id: string
  applicationCode: string
  userId: string
  username: string | null
  headline: string | null
  bio: string | null
  hourlyRateCents: number | null
  motivation: string | null
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED' | 'SUSPENDED'
  reviewedBy: string | null
  reviewNote: string | null
  currentStep: number | null
  applicationData: MentorApplicationFormData | null
  adminInternalNotes: string | null
  infoRequestMessage: string | null
  timeline: ApplicationTimelineEvent[]
  createdAt: string
  updatedAt: string
}

export const adminMentorApplicationsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listAdminMentorApplications: build.query<AdminMentorApplicationDetail[], void>({
      query: () => '/api/admin/mentor-applications',
      providesTags: ['MentorApplications'],
    }),
    getAdminMentorApplication: build.query<AdminMentorApplicationDetail, string>({
      query: (id) => `/api/admin/mentor-applications/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'MentorApplications', id }],
    }),
    approveAdminMentorApplication: build.mutation<
      unknown,
      { id: string; reviewNote?: string }
    >({
      query: ({ id, reviewNote }) => ({
        url: `/api/admin/mentor-applications/${id}/approve`,
        method: 'POST',
        body: reviewNote ? { reviewNote } : undefined,
      }),
      invalidatesTags: ['MentorApplications', 'Mentors'],
    }),
    rejectAdminMentorApplication: build.mutation<
      unknown,
      { id: string; reason: string; reviewNote?: string }
    >({
      query: ({ id, reason, reviewNote }) => ({
        url: `/api/admin/mentor-applications/${id}/reject`,
        method: 'POST',
        body: { reason, reviewNote },
      }),
      invalidatesTags: ['MentorApplications'],
    }),
    requestInfoAdminMentorApplication: build.mutation<
      AdminMentorApplicationDetail,
      { id: string; message: string }
    >({
      query: ({ id, message }) => ({
        url: `/api/admin/mentor-applications/${id}/request-info`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: ['MentorApplications'],
    }),
    suspendAdminMentorApplication: build.mutation<AdminMentorApplicationDetail, string>({
      query: (id) => ({
        url: `/api/admin/mentor-applications/${id}/suspend`,
        method: 'POST',
      }),
      invalidatesTags: ['MentorApplications'],
    }),
    saveAdminMentorApplicationNotes: build.mutation<
      AdminMentorApplicationDetail,
      { id: string; notes: string }
    >({
      query: ({ id, notes }) => ({
        url: `/api/admin/mentor-applications/${id}/notes`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: ['MentorApplications'],
    }),
  }),
})

export const {
  useListAdminMentorApplicationsQuery,
  useGetAdminMentorApplicationQuery,
  useApproveAdminMentorApplicationMutation,
  useRejectAdminMentorApplicationMutation,
  useRequestInfoAdminMentorApplicationMutation,
  useSuspendAdminMentorApplicationMutation,
  useSaveAdminMentorApplicationNotesMutation,
} = adminMentorApplicationsApi
