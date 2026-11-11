import { useState } from 'react'
import { FileCode2, ShieldCheck, Sparkles } from 'lucide-react'
import type { CodeReviewSubmission } from '../data/codeReviewData'
import type { CodeReviewReport } from '../lib/codeReviewAnalyzer'
import {
  mapApiReportToClient,
  useAnalyzeCodeReviewMutation,
  useGetAiReviewUsageQuery,
} from '../api/aiReviewApi'
import { CodeReviewSubmissionForm } from '../components/code-review/CodeReviewSubmissionForm'
import { CodeReviewAnalyzingScreen } from '../components/code-review/CodeReviewAnalyzingScreen'
import { CodeReviewReportView } from '../components/code-review/CodeReviewReport'
import { CodeReviewMentorRequestModal } from '../components/code-review/CodeReviewMentorRequestModal'
import { CodeReviewUsageBanner } from '../components/code-review/CodeReviewUsageBanner'
import { CodeReviewUpgradeModal } from '../components/code-review/CodeReviewUpgradeModal'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { extractApiError } from '../lib/extractApiError'

type Phase = 'submit' | 'analyzing' | 'report'

function isPaymentRequired(err: unknown): boolean {
  const e = err as FetchBaseQueryError
  if (e?.status !== 402) return false
  const data = e.data as { code?: string } | undefined
  return data?.code === 'PAYMENT_REQUIRED'
}

function getAnalyzeErrorMessage(err: unknown): string {
  const e = err as FetchBaseQueryError
  if (e?.status === 404) {
    return 'AI Review API was not found. Restart mentor-service (port 8086), then refresh this page.'
  }
  if (e?.status === 'FETCH_ERROR') {
    return 'Cannot reach mentor-service. Start mentor-service on port 8086 and try again.'
  }
  if (e?.status === 401) return 'Please sign in again.'
  if (e?.status === 500) {
    return 'AI review service error. Restart mentor-service (port 8086) and try again.'
  }
  if (e?.status === 502 || e?.status === 503) {
    return 'AI review service is unavailable. Check that mentor-service is running.'
  }
  const msg = extractApiError(err)
  if (msg === 'Unexpected error') {
    return 'AI review service error. Restart mentor-service (port 8086) and try again.'
  }
  if (msg === 'Not Found' || msg === 'The requested resource was not found.') {
    return 'AI Review API was not found. Restart mentor-service (port 8086), then refresh this page.'
  }
  return msg
}

export function CodeReviewPage() {
  const {
    data: usage,
    isLoading: usageLoading,
    isError: usageError,
    error: usageQueryError,
    refetch: refetchUsage,
  } = useGetAiReviewUsageQuery()
  const [analyzeCode, { error: analyzeError, reset: resetAnalyze }] = useAnalyzeCodeReviewMutation()
  const [lastError, setLastError] = useState<string | null>(null)

  const [phase, setPhase] = useState<Phase>('submit')
  const [report, setReport] = useState<CodeReviewReport | null>(null)
  const [showMentorModal, setShowMentorModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [mentorRequested, setMentorRequested] = useState(false)

  const hasQuota =
    (usage?.remaining ?? 0) > 0 || (usage?.paidReviews ?? 0) > 0
  const upgradeRequired = !usageLoading && usage != null && !hasQuota

  async function handleAnalyze(submission: CodeReviewSubmission) {
    if (upgradeRequired) {
      setShowUpgradeModal(true)
      return
    }

    setPhase('analyzing')
    setMentorRequested(false)
    setLastError(null)
    resetAnalyze()

    try {
      const result = await analyzeCode(submission).unwrap()
      setReport(mapApiReportToClient(result))
      setPhase('report')
      refetchUsage()
    } catch (err) {
      if (isPaymentRequired(err)) {
        setShowUpgradeModal(true)
        setPhase('submit')
        refetchUsage()
        return
      }
      setLastError(getAnalyzeErrorMessage(err))
      setPhase('submit')
    }
  }

  function handleNewAnalysis() {
    setReport(null)
    setMentorRequested(false)
    setPhase('submit')
    refetchUsage()
  }

  const analyzeBlockedMessage =
    !usageError &&
    (lastError ??
      (analyzeError && 'status' in analyzeError && analyzeError.status !== 402
        ? getAnalyzeErrorMessage(analyzeError)
        : null))

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1]/30 to-[#7c3aed]/20 flex items-center justify-center shrink-0 border border-[#6366f1]/30 shadow-lg shadow-[#6366f1]/10">
          <FileCode2 className="w-6 h-6 text-[#818cf8]" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">Code Review</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/30 font-semibold uppercase tracking-wide">
              AI Analyzer
            </span>
          </div>
          <p className="text-sm text-[#8b8ca8] max-w-2xl leading-relaxed">
            Submit completed code for professional quality analysis — like a GitHub PR review
            combined with SonarQube insights. Get scores, issues, and fixes before optional mentor
            validation.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-[#b4b5c8] px-2.5 py-1 rounded-lg bg-[#161722] border border-[#2d2e3e]">
              <ShieldCheck size={12} className="text-emerald-400" /> Security scans
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-[#b4b5c8] px-2.5 py-1 rounded-lg bg-[#161722] border border-[#2d2e3e]">
              <Sparkles size={12} className="text-[#818cf8]" /> Clean code & architecture
            </span>
          </div>
        </div>
      </header>

      <div className="mb-6">
        {usageError ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
            {getAnalyzeErrorMessage(usageQueryError)}
          </div>
        ) : (
          <CodeReviewUsageBanner usage={usage} isLoading={usageLoading} />
        )}
      </div>

      {analyzeBlockedMessage && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          {analyzeBlockedMessage}
        </div>
      )}

      {phase === 'submit' && (
        <CodeReviewSubmissionForm
          onAnalyze={handleAnalyze}
          isAnalyzing={false}
          upgradeRequired={upgradeRequired}
          onUpgradeClick={() => setShowUpgradeModal(true)}
        />
      )}

      {phase === 'analyzing' && <CodeReviewAnalyzingScreen />}

      {phase === 'report' && report && (
        <CodeReviewReportView
          report={report}
          onNewAnalysis={handleNewAnalysis}
          onRequestMentor={() => setShowMentorModal(true)}
          mentorRequested={mentorRequested}
        />
      )}

      {showMentorModal && report && (
        <CodeReviewMentorRequestModal
          report={report}
          onClose={() => setShowMentorModal(false)}
          onSuccess={() => {
            setMentorRequested(true)
            setShowMentorModal(false)
          }}
        />
      )}

      {showUpgradeModal && (
        <CodeReviewUpgradeModal
          usage={usage}
          onClose={() => setShowUpgradeModal(false)}
          onPurchased={() => refetchUsage()}
        />
      )}
    </div>
  )
}
