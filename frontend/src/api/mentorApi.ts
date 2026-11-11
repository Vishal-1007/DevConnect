import type { MentorApplication, MentorProfile } from './types'
import { devConnectApi } from './baseApi'

export interface MentorAccess {
  canAccess: boolean
  status: string | null
  blocked: boolean
  message: string
}

export interface MentorProfileSettings {
  userId: string
  fullName: string | null
  email: string | null
  phone: string | null
  profileImageUrl: string | null
  professionalTitle: string | null
  currentCompany: string | null
  currentRole: string | null
  totalExperience: string | null
  bio: string | null
  skills: string[]
  technologies: string[]
  mentorshipCategories: string[]
  sessionDurationMinutes: number
  hourlyRateCents: number | null
  mockInterviewPriceCents: number | null
  resumeReviewPriceCents: number | null
  freeSessionAllowed: boolean
  available: boolean
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
  averageRating: number
  ratingCount: number
  sessionsCompleted: number
  studentsMentored: number
  updatedAt: string
}

export type UpdateMentorProfileSettings = Partial<{
  fullName: string
  email: string
  phone: string
  profileImageUrl: string
  professionalTitle: string
  currentCompany: string
  currentRole: string
  totalExperience: string
  bio: string
  skills: string[]
  technologies: string[]
  mentorshipCategories: string[]
  sessionDurationMinutes: number
  hourlyRateCents: number
  mockInterviewPriceCents: number
  resumeReviewPriceCents: number
  freeSessionAllowed: boolean
  available: boolean
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string
}>

export const mentorApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listMentors: build.query<MentorProfile[], void>({
      query: () => '/api/mentors',
      providesTags: ['Mentors'],
    }),

    getMentor: build.query<MentorProfile, string>({
      query: (id) => `/api/mentors/${id}`,
    }),

    upsertMyMentorProfile: build.mutation<
      MentorProfile,
      { headline?: string; bio?: string; hourlyRateCents?: number; available?: boolean }
    >({
      query: (body) => ({ url: '/api/mentors/me', method: 'PUT', body }),
      invalidatesTags: ['Mentors'],
    }),

    // ── Application flow ────────────────────────────────────────────────────

    applyForMentorship: build.mutation<
      MentorApplication,
      { headline: string; bio?: string; hourlyRateCents?: number; motivation: string }
    >({
      query: (body) => ({ url: '/api/mentors/apply', method: 'POST', body }),
      invalidatesTags: ['MentorApplications'],
    }),

    getMyApplication: build.query<MentorApplication, void>({
      query: () => '/api/mentors/my-application',
      providesTags: ['MentorApplications'],
    }),

    getMentorAccess: build.query<MentorAccess, void>({
      query: () => '/api/mentors/me/access',
      providesTags: ['MentorApplications'],
    }),

    getMyMentorProfileSettings: build.query<MentorProfileSettings, void>({
      query: () => '/api/mentors/me/profile',
      providesTags: ['MentorProfileSettings'],
    }),

    updateMyMentorProfileSettings: build.mutation<MentorProfileSettings, UpdateMentorProfileSettings>({
      query: (body) => ({ url: '/api/mentors/me/profile', method: 'PUT', body }),
      invalidatesTags: ['MentorProfileSettings', 'Mentors'],
    }),

    // ── Admin endpoints ─────────────────────────────────────────────────────

    listAllApplications: build.query<MentorApplication[], void>({
      query: () => '/api/mentors/applications',
      providesTags: ['MentorApplications'],
    }),

    approveApplication: build.mutation<MentorApplication, { id: string; reviewNote?: string }>({
      query: ({ id, reviewNote }) => ({
        url: `/api/mentors/applications/${id}/approve`,
        method: 'POST',
        body: reviewNote ? { reviewNote } : undefined,
      }),
      invalidatesTags: ['MentorApplications', 'Mentors'],
    }),

    rejectApplication: build.mutation<MentorApplication, { id: string; reviewNote?: string }>({
      query: ({ id, reviewNote }) => ({
        url: `/api/mentors/applications/${id}/reject`,
        method: 'POST',
        body: reviewNote ? { reviewNote } : undefined,
      }),
      invalidatesTags: ['MentorApplications'],
    }),

    // ── Admin mentor management ─────────────────────────────────────────────

    /** Admin: list ALL mentor profiles including blocked ones */
    listAllMentors: build.query<MentorProfile[], void>({
      query: () => '/api/mentors/all',
      providesTags: ['Mentors'],
    }),

    blockMentor: build.mutation<MentorProfile, string>({
      query: (id) => ({ url: `/api/mentors/${id}/block`, method: 'POST' }),
      invalidatesTags: ['Mentors'],
    }),

    unblockMentor: build.mutation<MentorProfile, string>({
      query: (id) => ({ url: `/api/mentors/${id}/unblock`, method: 'POST' }),
      invalidatesTags: ['Mentors'],
    }),
  }),
})

export const {
  useListMentorsQuery,
  useGetMentorQuery,
  useUpsertMyMentorProfileMutation,
  useApplyForMentorshipMutation,
  useGetMyApplicationQuery,
  useGetMentorAccessQuery,
  useLazyGetMentorAccessQuery,
  useGetMyMentorProfileSettingsQuery,
  useUpdateMyMentorProfileSettingsMutation,
  useListAllApplicationsQuery,
  useApproveApplicationMutation,
  useRejectApplicationMutation,
  useListAllMentorsQuery,
  useBlockMentorMutation,
  useUnblockMentorMutation,
} = mentorApi
