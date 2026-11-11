import { devConnectApi } from './baseApi'

export interface AdminMentorListItem {
  userId: string
  fullName: string
  profileImageUrl: string | null
  headline: string | null
  company: string | null
  designation: string | null
  experience: string | null
  verified: boolean
  averageRating: number
  ratingCount: number
  sessionsCompleted: number
  audioPricePerMinuteCents: number | null
  videoPricePerMinuteCents: number | null
  hourlyRateCents: number | null
  status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED'
  createdAt: string
}

export interface AdminMentorDetail extends AdminMentorListItem {
  bio: string | null
  location: string | null
  responseRate: number
  studentsMentored: number
  revenueGeneratedCents: number
  mockInterviewPriceCents: number | null
  resumeReviewPriceCents: number | null
  skills: string[]
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
  resumeUrl: string | null
  updatedAt: string
}

export const adminMentorsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listAdminMentors: build.query<AdminMentorListItem[], void>({
      query: () => '/api/admin/mentors',
      providesTags: ['Mentors'],
    }),
    getAdminMentor: build.query<AdminMentorDetail, string>({
      query: (id) => `/api/admin/mentors/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Mentors', id }],
    }),
    suspendAdminMentor: build.mutation<AdminMentorDetail, string>({
      query: (id) => ({
        url: `/api/admin/mentors/${id}/suspend`,
        method: 'POST',
      }),
      invalidatesTags: ['Mentors'],
    }),
  }),
})

export const {
  useListAdminMentorsQuery,
  useGetAdminMentorQuery,
  useSuspendAdminMentorMutation,
} = adminMentorsApi
