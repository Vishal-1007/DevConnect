import { devConnectApi } from './baseApi'
import type { RunCodeResult } from './pairProgrammingApi'

export interface PracticeAttempt {
  id: string
  studentId: string
  problemId: string
  code: string
  language: string
  status: string
  mode: string
  startedAt: string
  completedAt: string | null
}

export interface SubmitPracticeResult {
  attempt: PracticeAttempt
  runResult: RunCodeResult
}

export const practiceApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    startPractice: build.mutation<PracticeAttempt, { problemId: string; language: string }>({
      query: (body) => ({ url: '/api/practice/start', method: 'POST', body }),
    }),
    savePracticeCode: build.mutation<PracticeAttempt, { attemptId: string; code: string; language: string }>({
      query: ({ attemptId, ...body }) => ({
        url: `/api/practice/${encodeURIComponent(attemptId)}/code`,
        method: 'POST',
        body,
      }),
    }),
    runPracticeCode: build.mutation<
      RunCodeResult,
      { problemId: string; code: string; language: string }
    >({
      query: (body) => ({ url: '/api/practice/run-code', method: 'POST', body }),
    }),
    submitPractice: build.mutation<
      SubmitPracticeResult,
      { attemptId: string; code: string; language: string }
    >({
      query: ({ attemptId, ...body }) => ({
        url: `/api/practice/${encodeURIComponent(attemptId)}/submit`,
        method: 'POST',
        body,
      }),
      invalidatesTags: () => [
        { type: 'CodingProblems', id: 'LIST' },
        { type: 'CodingProblems', id: 'STATS' },
        { type: 'Leaderboard', id: 'LIST' },
        { type: 'UserStats', id: 'ME' },
      ],
    }),
  }),
})

export const {
  useStartPracticeMutation,
  useSavePracticeCodeMutation,
  useRunPracticeCodeMutation,
  useSubmitPracticeMutation,
} = practiceApi
