import { devConnectApi } from './baseApi'
import type { MentorApplicationFormData } from '../components/mentor-onboarding/types'

export interface MentorApplicationDraft {
  id: string
  userId: string
  currentStep: number
  data: MentorApplicationFormData | null
  status: string
  updatedAt: string
}

export const mentorApplicationApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getApplicationDraft: build.query<MentorApplicationDraft, void>({
      query: () => '/api/mentors/application/draft',
      providesTags: ['MentorApplications'],
    }),

    saveApplicationDraft: build.mutation<
      MentorApplicationDraft,
      { currentStep: number; data: MentorApplicationFormData }
    >({
      query: (body) => ({
        url: '/api/mentors/application/draft',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['MentorApplications'],
    }),

    submitMentorApplication: build.mutation<
      unknown,
      { data: MentorApplicationFormData }
    >({
      query: (body) => ({
        url: '/api/mentors/application/submit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MentorApplications'],
    }),

    uploadApplicationDocument: build.mutation<
      { url: string; type: string },
      { type: 'PROFILE' | 'RESUME' | 'GOVERNMENT_ID'; file: File }
    >({
      query: ({ type, file }) => {
        const form = new FormData()
        form.append('file', file)
        return {
          url: `/api/mentors/application/upload?type=${type}`,
          method: 'POST',
          body: form,
        }
      },
    }),
  }),
})

export const {
  useGetApplicationDraftQuery,
  useSaveApplicationDraftMutation,
  useSubmitMentorApplicationMutation,
  useUploadApplicationDocumentMutation,
} = mentorApplicationApi
