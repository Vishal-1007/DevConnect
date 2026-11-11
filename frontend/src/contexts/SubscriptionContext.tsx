import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  useConsumeRecruiterUsageMutation,
  useGetRecruiterSubscriptionQuery,
  useSyncRecruiterJobCountMutation,
} from '../api/recruiterSubscriptionApi'
import {
  DEFAULT_FREE_SUBSCRIPTION,
  type RecruiterFeatureKey,
  type RecruiterPlanType,
  type RecruiterSubscription,
  type RecruiterUsageAction,
} from '../types/recruiterSubscription'
import { UpgradePaymentModal } from '../components/recruiter/subscription/UpgradePaymentModal'

type SubscriptionContextValue = {
  subscription: RecruiterSubscription
  loading: boolean
  hasFeature: (feature: RecruiterFeatureKey) => boolean
  canUse: (action: RecruiterUsageAction) => boolean
  consumeUsage: (action: RecruiterUsageAction) => Promise<boolean>
  syncActiveJobs: (count: number) => Promise<void>
  refresh: () => void
  openUpgrade: (plan?: RecruiterPlanType) => void
  getUsageMetric: (id: string) => RecruiterSubscription['usage']['metrics'][number] | undefined
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

function parseErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { message?: string } }).data
    if (data?.message) return data.message
  }
  if (err instanceof Error) return err.message
  return 'Action blocked by subscription limits'
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = useGetRecruiterSubscriptionQuery()
  const [consumeUsageMutation] = useConsumeRecruiterUsageMutation()
  const [syncJobsMutation] = useSyncRecruiterJobCountMutation()
  const [upgradePlan, setUpgradePlan] = useState<RecruiterPlanType | null>(null)
  const [limitMessage, setLimitMessage] = useState<string | null>(null)

  const subscription = data ?? DEFAULT_FREE_SUBSCRIPTION

  const hasFeature = useCallback(
    (feature: RecruiterFeatureKey) => Boolean(subscription.features[feature]),
    [subscription.features],
  )

  const getUsageMetric = useCallback(
    (id: string) => subscription.usage.metrics.find((m) => m.id === id),
    [subscription.usage.metrics],
  )

  const canUse = useCallback(
    (action: RecruiterUsageAction) => {
      switch (action) {
        case 'JOB_POST': {
          const metric = subscription.usage.metrics.find((m) => m.id === 'jobs')
          if (!metric) return true
          return metric.limit < 0 || metric.used < metric.limit
        }
        case 'CANDIDATE_SEARCH': {
          const metric = subscription.usage.metrics.find((m) => m.id === 'searches')
          if (!metric) return true
          return metric.limit < 0 || metric.used < metric.limit
        }
        case 'MESSAGE': {
          const metric = subscription.usage.metrics.find((m) => m.id === 'messages')
          if (!metric) return true
          return metric.limit < 0 || metric.used < metric.limit
        }
        case 'AI_REPORT': {
          const metric = subscription.usage.metrics.find((m) => m.id === 'ai-reports')
          if (!metric) return true
          return metric.limit < 0 || metric.used < metric.limit
        }
        case 'DECREMENT_JOB_POST':
          return true
        default:
          return true
      }
    },
    [subscription.usage.metrics],
  )

  const consumeUsage = useCallback(
    async (action: RecruiterUsageAction) => {
      try {
        await consumeUsageMutation({ action }).unwrap()
        return true
      } catch (err) {
        setLimitMessage(parseErrorMessage(err))
        setTimeout(() => setLimitMessage(null), 3000)
        return false
      }
    },
    [consumeUsageMutation],
  )

  const syncActiveJobs = useCallback(
    async (count: number) => {
      try {
        await syncJobsMutation({ activeJobCount: count }).unwrap()
      } catch {
        // keep local dashboard usable if sync fails
      }
    },
    [syncJobsMutation],
  )

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      subscription,
      loading: isLoading,
      hasFeature,
      canUse,
      consumeUsage,
      syncActiveJobs,
      refresh: refetch,
      openUpgrade: (plan = 'PRO') => setUpgradePlan(plan),
      getUsageMetric,
    }),
    [
      subscription,
      isLoading,
      hasFeature,
      canUse,
      consumeUsage,
      syncActiveJobs,
      refetch,
      getUsageMetric,
    ],
  )

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      {upgradePlan && (
        <UpgradePaymentModal
          planType={upgradePlan}
          onClose={() => setUpgradePlan(null)}
          onSuccess={() => refetch()}
        />
      )}
      {limitMessage && (
        <div className="fixed bottom-6 left-1/2 z-[75] max-w-md -translate-x-1/2 rounded-xl border border-amber-500/30 bg-[#161722] px-4 py-2.5 text-sm text-amber-100 shadow-xl">
          {limitMessage}
        </div>
      )}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider')
  }
  return ctx
}
