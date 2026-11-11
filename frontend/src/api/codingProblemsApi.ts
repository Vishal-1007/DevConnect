import { devConnectApi } from './baseApi'

export type ProblemCategory =
  | 'DSA'
  | 'BACKEND_DEVELOPMENT'
  | 'FRONTEND_DEVELOPMENT'
  | 'DATABASE'
  | 'SYSTEM_DESIGN'
  | 'DEBUGGING'

export type ProblemDifficulty = 'easy' | 'medium' | 'hard'
export type ProblemStatus = 'DRAFT' | 'PUBLISHED' | 'PENDING_APPROVAL'

export interface ProblemExample {
  input: string
  output: string
}

export interface ProblemTestCase {
  name: string
  input: string
  expected: string
  jsInvoke?: string
  pyInvoke?: string
  javaInvoke?: string
}

export interface CodingProblemSummary {
  id: string
  title: string
  description: string
  difficulty: ProblemDifficulty
  category: ProblemCategory
  languages: string[]
  tags: string[]
  companies: string[]
  examples: ProblemExample[]
  constraints: string[]
  solved: boolean
  solvedCount: number
  status: ProblemStatus
  creatorType: string
  createdAt: string
}

export interface CodingProblemDetail extends CodingProblemSummary {
  hints: string[]
  starterCode: Record<string, string>
  testCases: ProblemTestCase[]
  solution: string | null
  updatedAt: string
}

export interface ProblemStats {
  totalProblems: number
  solvedCount: number
}

export interface CreateCodingProblemRequest {
  title: string
  description: string
  category: string
  difficulty: string
  languages: string[]
  tags: string[]
  companies: string[]
  starterCode: Record<string, string>
  testCases: ProblemTestCase[]
  solution?: string
  hints?: string[]
  constraints?: string[]
  examples?: ProblemExample[]
  status: ProblemStatus
}

export const CHALLENGE_CATEGORIES: { id: ProblemCategory; label: string }[] = [
  { id: 'DSA', label: 'DSA' },
  { id: 'BACKEND_DEVELOPMENT', label: 'Backend Development' },
  { id: 'FRONTEND_DEVELOPMENT', label: 'Frontend Development' },
  { id: 'DATABASE', label: 'Database' },
  { id: 'SYSTEM_DESIGN', label: 'System Design' },
  { id: 'DEBUGGING', label: 'Debugging' },
]

export const PROGRAMMING_LANGUAGES = [
  { id: 'java', label: 'Java' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'cpp', label: 'C++' },
  { id: 'go', label: 'Go' },
]

export const DIFFICULTY_OPTIONS = [
  { id: 'all', label: 'All difficulties' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
]

export const STATUS_OPTIONS = [
  { id: 'all', label: 'All statuses' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'PUBLISHED', label: 'Published' },
  { id: 'PENDING_APPROVAL', label: 'Pending approval' },
]

export function categoryLabel(category: string) {
  return CHALLENGE_CATEGORIES.find((c) => c.id === category)?.label ?? category
}

export function difficultyBadgeClass(difficulty: string) {
  if (difficulty === 'easy') return 'bg-emerald-500/20 text-emerald-400'
  if (difficulty === 'hard') return 'bg-red-500/20 text-red-400'
  return 'bg-amber-500/20 text-amber-400'
}

export function statusBadgeClass(status: string) {
  if (status === 'PUBLISHED') return 'bg-emerald-500/20 text-emerald-400'
  if (status === 'PENDING_APPROVAL') return 'bg-amber-500/20 text-amber-400'
  return 'bg-[#2d2e3e] text-[#8b8ca8]'
}

function buildQuery(params?: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v && v !== 'all') search.set(k, v)
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const codingProblemsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getProblemStats: build.query<ProblemStats, void>({
      query: () => '/api/problems/stats',
      providesTags: [{ type: 'CodingProblems', id: 'STATS' }],
    }),
    listProblems: build.query<
      CodingProblemSummary[],
      { language?: string; category?: string; difficulty?: string; company?: string; tag?: string; q?: string } | void
    >({
      query: (params) => `/api/problems${buildQuery(params as Record<string, string>)}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'CodingProblems' as const, id })), { type: 'CodingProblems', id: 'LIST' }]
          : [{ type: 'CodingProblems', id: 'LIST' }],
    }),
    getProblem: build.query<CodingProblemDetail, string>({
      query: (id) => `/api/problems/${encodeURIComponent(id)}`,
      providesTags: (_r, _e, id) => [{ type: 'CodingProblems', id }],
    }),
    submitProblemAttempt: build.mutation<
      { id: string; problemId: string; status: string; language: string; submittedAt: string },
      { problemId: string; code: string; language: string; passed: boolean }
    >({
      query: ({ problemId, ...body }) => ({
        url: `/api/problems/${encodeURIComponent(problemId)}/attempts`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { problemId }) => [
        { type: 'CodingProblems', id: problemId },
        { type: 'CodingProblems', id: 'LIST' },
        { type: 'CodingProblems', id: 'STATS' },
        { type: 'Leaderboard', id: 'LIST' },
        { type: 'UserStats', id: 'ME' },
      ],
    }),
    listProblemCompanies: build.query<string[], void>({
      query: () => '/api/problems/filters/companies',
    }),
    listProblemTags: build.query<string[], void>({
      query: () => '/api/problems/filters/tags',
    }),
    listAdminProblems: build.query<
      CodingProblemDetail[],
      { language?: string; category?: string; difficulty?: string; company?: string; tag?: string; status?: string; q?: string } | void
    >({
      query: (params) => `/api/admin/problems${buildQuery(params as Record<string, string>)}`,
      providesTags: [{ type: 'AdminCodingProblems', id: 'LIST' }],
    }),
    getAdminProblem: build.query<CodingProblemDetail, string>({
      query: (id) => `/api/admin/problems/${encodeURIComponent(id)}`,
      providesTags: (_r, _e, id) => [{ type: 'AdminCodingProblems', id }],
    }),
    createAdminProblem: build.mutation<CodingProblemDetail, CreateCodingProblemRequest>({
      query: (body) => ({ url: '/api/admin/problems', method: 'POST', body }),
      invalidatesTags: [{ type: 'AdminCodingProblems', id: 'LIST' }, { type: 'CodingProblems', id: 'LIST' }],
    }),
    updateAdminProblem: build.mutation<CodingProblemDetail, { id: string; body: Partial<CreateCodingProblemRequest> }>({
      query: ({ id, body }) => ({ url: `/api/admin/problems/${encodeURIComponent(id)}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AdminCodingProblems', id: 'LIST' },
        { type: 'AdminCodingProblems', id },
        { type: 'CodingProblems', id },
        { type: 'CodingProblems', id: 'LIST' },
      ],
    }),
    updateAdminProblemStatus: build.mutation<CodingProblemDetail, { id: string; status: ProblemStatus }>({
      query: ({ id, status }) => ({
        url: `/api/admin/problems/${encodeURIComponent(id)}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: [{ type: 'AdminCodingProblems', id: 'LIST' }, { type: 'CodingProblems', id: 'LIST' }],
    }),
    deleteAdminProblem: build.mutation<void, string>({
      query: (id) => ({ url: `/api/admin/problems/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminCodingProblems', id: 'LIST' }, { type: 'CodingProblems', id: 'LIST' }],
    }),
    listMentorProblems: build.query<CodingProblemDetail[], void>({
      query: () => '/api/mentors/problems/mine',
      providesTags: [{ type: 'MentorCodingProblems', id: 'LIST' }],
    }),
    createMentorProblem: build.mutation<CodingProblemDetail, CreateCodingProblemRequest>({
      query: (body) => ({ url: '/api/mentors/problems', method: 'POST', body }),
      invalidatesTags: [{ type: 'MentorCodingProblems', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetProblemStatsQuery,
  useListProblemsQuery,
  useGetProblemQuery,
  useSubmitProblemAttemptMutation,
  useListProblemCompaniesQuery,
  useListProblemTagsQuery,
  useListAdminProblemsQuery,
  useGetAdminProblemQuery,
  useCreateAdminProblemMutation,
  useUpdateAdminProblemMutation,
  useUpdateAdminProblemStatusMutation,
  useDeleteAdminProblemMutation,
  useListMentorProblemsQuery,
  useCreateMentorProblemMutation,
} = codingProblemsApi

// Backward-compatible aliases
export type CodingChallengeSummary = CodingProblemSummary
export type CodingChallengeDetail = CodingProblemDetail
export type ChallengeStats = ProblemStats
export const useGetChallengeStatsQuery = useGetProblemStatsQuery
export const useListCodingChallengesQuery = useListProblemsQuery
export const useGetCodingChallengeQuery = useGetProblemQuery
export const useListChallengeCompaniesQuery = useListProblemCompaniesQuery
export const useListChallengeTagsQuery = useListProblemTagsQuery
