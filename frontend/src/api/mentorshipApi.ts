import { devConnectApi } from './baseApi'



export interface MentorshipRequest {

  id: string

  mentorId: string

  studentId: string

  studentName: string | null

  studentProfileImageUrl: string | null

  mentorName: string | null

  mentorProfileImageUrl: string | null

  goal: string

  message: string | null

  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'

  createdAt: string

  updatedAt: string

}



export interface MyMentor {
  mentorId: string
  mentorName: string
  headline: string | null
  company: string | null
  experienceRange: string | null
  profileImageUrl: string | null
  averageRating: number
  ratingCount: number
  available: boolean
}

export const mentorshipApi = devConnectApi.injectEndpoints({

  endpoints: (build) => ({

    createMentorshipRequest: build.mutation<

      MentorshipRequest,

      { mentorId: string; goal: string; message?: string }

    >({

      query: (body) => ({

        url: '/api/mentorship/request',

        method: 'POST',

        body,

      }),

      invalidatesTags: ['MentorshipRequests', 'AcceptedMentors'],

    }),

    listMyMentorshipRequests: build.query<MentorshipRequest[], void>({

      query: () => '/api/mentorship/my-requests',

      providesTags: ['MentorshipRequests'],

    }),

    listMentorMentorshipRequests: build.query<MentorshipRequest[], void>({

      query: () => '/api/mentor/mentorship-requests',

      providesTags: ['MentorshipRequests'],

    }),

    getMentorMentorshipRequestCount: build.query<{ pending: number }, void>({

      query: () => '/api/mentor/mentorship-requests/count',

      providesTags: ['MentorshipRequests'],

    }),

    acceptMentorshipRequest: build.mutation<MentorshipRequest, string>({

      query: (id) => ({

        url: `/api/mentorship/${id}/accept`,

        method: 'POST',

      }),

      invalidatesTags: ['MentorshipRequests', 'MentorWorkspace', 'AcceptedMentors'],

    }),

    rejectMentorshipRequest: build.mutation<MentorshipRequest, string>({

      query: (id) => ({

        url: `/api/mentorship/${id}/reject`,

        method: 'POST',

      }),

      invalidatesTags: ['MentorshipRequests', 'AcceptedMentors'],

    }),

    listMyMentors: build.query<MyMentor[], void>({
      query: () => '/api/mentorship/my-mentors',
      providesTags: ['AcceptedMentors'],
    }),

    submitMentorFeedback: build.mutation<
      unknown,
      { mentorId: string; rating: number; comment: string; improvementSuggestion?: string; topic?: string }
    >({
      query: ({ mentorId, ...body }) => ({
        url: `/api/mentors/${mentorId}/feedback`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MentorWorkspace', 'AcceptedMentors', 'Mentors'],
    }),
  }),

})



export const {

  useCreateMentorshipRequestMutation,

  useListMyMentorshipRequestsQuery,

  useListMentorMentorshipRequestsQuery,

  useGetMentorMentorshipRequestCountQuery,

  useAcceptMentorshipRequestMutation,

  useRejectMentorshipRequestMutation,

  useListMyMentorsQuery,

  useSubmitMentorFeedbackMutation,

} = mentorshipApi

