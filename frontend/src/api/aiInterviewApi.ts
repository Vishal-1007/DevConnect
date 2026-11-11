import { devConnectApi } from './baseApi'

export interface ResumeParseResult {
  resumeUrl: string
  username: string
  skills: string[]
  experience: string
  projects: string[]
  companies: string[]
  technologies: string[]
  education: string
}

export interface StartAiInterviewPayload {
  candidateName: string
  targetRole: string
  experienceLevel: string
  interviewType: string
  resumeUrl?: string
  resumeData: Omit<ResumeParseResult, 'resumeUrl'>
}

export interface AiQuestionResponse {
  questionId: string
  questionOrder: number
  question: string
  aiFeedback: string | null
  score: number | null
}

export interface AiInterviewResult {
  interviewId: string
  overallScore: number
  technicalScore: number
  communicationScore: number
  problemSolvingScore: number
  confidenceScore: number
  grammarScore: number
  hiringLevel?: string
  strengths: string[]
  improvements: string[]
  recommendedTopics: string[]
  questions: AiQuestionResponse[]
}

export interface AiInterviewSession {
  interviewId: string
  status: string
  candidateName: string
  targetRole: string
  experienceLevel: string
  interviewType: string
  introMessage: string
  currentQuestion: AiQuestionResponse | null
  totalQuestions: number
  completed: boolean
  result: AiInterviewResult | null
  lastAnswerFeedback: string | null
  lastAnswerScore: number | null
  askedQuestions: string[]
  nextQuestion: string | null
  questionNumber: number | null
  transitionMessage?: string | null
}

export const aiInterviewApi = devConnectApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadAiResume: builder.mutation<ResumeParseResult, File>({
      query: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return {
          url: '/api/ai-interview/upload-resume',
          method: 'POST',
          body: formData,
        }
      },
    }),
    startAiInterview: builder.mutation<AiInterviewSession, StartAiInterviewPayload>({
      query: (body) => ({
        url: '/api/ai-interview/start',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AiInterview'],
    }),
    getAiInterviewSession: builder.query<AiInterviewSession, string>({
      query: (id) => `/api/ai-interview/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AiInterview', id }],
    }),
    submitAiAnswer: builder.mutation<
      AiInterviewSession,
      { interviewId: string; questionId: string; answer: string; answerTimeSeconds?: number }
    >({
      query: ({ interviewId, questionId, answer, answerTimeSeconds }) => ({
        url: `/api/ai-interview/${interviewId}/answer`,
        method: 'POST',
        body: { answer, questionId, answerTimeSeconds },
      }),
      // Avoid refetch race while the voice flow is advancing to the next question
      invalidatesTags: [],
    }),
    endAiInterview: builder.mutation<AiInterviewSession, string>({
      query: (interviewId) => ({
        url: `/api/ai-interview/${interviewId}/end`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [{ type: 'AiInterview', id }],
    }),
    getAiInterviewResult: builder.query<AiInterviewResult, string>({
      query: (id) => `/api/ai-interview/${id}/result`,
      providesTags: (_r, _e, id) => [{ type: 'AiInterview', id }],
    }),
  }),
})

export const {
  useUploadAiResumeMutation,
  useStartAiInterviewMutation,
  useGetAiInterviewSessionQuery,
  useSubmitAiAnswerMutation,
  useEndAiInterviewMutation,
  useGetAiInterviewResultQuery,
} = aiInterviewApi
