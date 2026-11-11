import { devConnectApi } from './baseApi'
import type { CodeReviewSubmission, FocusAreaId } from '../data/codeReviewData'
import type { CodeReviewReport } from '../lib/codeReviewAnalyzer'

export interface AiReviewUsage {
  freeLimit: number
  used: number
  remaining: number
  paidReviews: number
  reviewDate: string
}

export interface CodeReviewOrder {
  amount: number
  currency: string
  description: string
  idempotencyKey: string
  priceCents: number
}

interface ApiCategoryScores {
  security: number
  performance: number
  architecture: number
  cleanCode: number
  interviewStandard: number
}

interface ApiIssue {
  id: string
  severity: string
  category: string
  problem: string
  explanation: string
  solution: string
  codeSuggestion?: string | null
}

interface ApiReportResponse {
  overallScore: number
  scores: ApiCategoryScores
  critical: ApiIssue[]
  improvements: ApiIssue[]
  goodPractices: ApiIssue[]
  summary: string
  submission: {
    title: string
    languageId: string
    languageLabel: string
    framework: string
    githubUrl: string
    code: string
    focusAreas: string[]
  }
  source?: string
}

export interface PaymentRequiredPayload {
  code: string
  message: string
  usage: AiReviewUsage
}

export function mapApiReportToClient(report: ApiReportResponse): CodeReviewReport {
  const sub = report.submission
  const submission: CodeReviewSubmission = {
    title: sub.title,
    languageId: sub.languageId,
    languageLabel: sub.languageLabel,
    framework: sub.framework,
    githubUrl: sub.githubUrl ?? '',
    code: sub.code,
    focusAreas: (sub.focusAreas ?? []) as FocusAreaId[],
  }
  const mapIssue = (i: ApiIssue) => ({
    id: i.id,
    severity: i.severity as 'critical' | 'improvement' | 'good',
    category: i.category as FocusAreaId,
    problem: i.problem,
    explanation: i.explanation,
    solution: i.solution,
    codeSuggestion: i.codeSuggestion ?? undefined,
  })
  return {
    overallScore: report.overallScore,
    scores: {
      security: report.scores.security ?? 0,
      performance: report.scores.performance ?? 0,
      architecture: report.scores.architecture ?? 0,
      'clean-code': report.scores.cleanCode ?? 0,
      'interview-standard': report.scores.interviewStandard ?? 0,
    },
    critical: (report.critical ?? []).map(mapIssue),
    improvements: (report.improvements ?? []).map(mapIssue),
    goodPractices: (report.goodPractices ?? []).map(mapIssue),
    summary: report.summary,
    submission,
  }
}

export const aiReviewApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getAiReviewUsage: build.query<AiReviewUsage, void>({
      query: () => '/api/ai-review/usage',
      providesTags: ['AiReviewUsage'],
    }),
    analyzeCodeReview: build.mutation<ApiReportResponse, CodeReviewSubmission>({
      query: (body) => ({
        url: '/api/ai-review/analyze',
        method: 'POST',
        body: {
          title: body.title,
          languageId: body.languageId,
          languageLabel: body.languageLabel,
          framework: body.framework,
          githubUrl: body.githubUrl,
          code: body.code,
          focusAreas: body.focusAreas,
        },
      }),
      invalidatesTags: ['AiReviewUsage'],
    }),
    createCodeReviewOrder: build.mutation<CodeReviewOrder, void>({
      query: () => ({
        url: '/api/payment/code-review/create-order',
        method: 'POST',
      }),
    }),
    confirmCodeReviewPayment: build.mutation<AiReviewUsage, { paymentId: string }>({
      query: (body) => ({
        url: '/api/payment/code-review/confirm',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AiReviewUsage'],
    }),
  }),
})

export const {
  useGetAiReviewUsageQuery,
  useAnalyzeCodeReviewMutation,
  useCreateCodeReviewOrderMutation,
  useConfirmCodeReviewPaymentMutation,
} = aiReviewApi
