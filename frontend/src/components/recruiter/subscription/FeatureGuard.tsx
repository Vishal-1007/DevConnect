import { Crown, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { FEATURE_LABELS, type RecruiterFeatureKey } from '../../../types/recruiterSubscription'
import { useSubscription } from '../../../contexts/SubscriptionContext'

type Props = {
  feature: RecruiterFeatureKey
  children: ReactNode
  fallback?: ReactNode
  compact?: boolean
}

export function FeatureGuard({ feature, children, fallback, compact }: Props) {
  const { hasFeature, openUpgrade } = useSubscription()

  if (hasFeature(feature)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <LockedFeatureCard
      title={FEATURE_LABELS[feature]}
      compact={compact}
      onUpgrade={openUpgrade}
    />
  )
}

export function LockedFeatureCard({
  title,
  description,
  compact,
  onUpgrade,
}: {
  title: string
  description?: string
  compact?: boolean
  onUpgrade?: () => void
}) {
  return (
    <div
      className={`rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#161722]/90 to-violet-950/20 backdrop-blur-md ${
        compact ? 'p-4' : 'p-6'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
          <Lock size={18} className="text-violet-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs text-[#8b8ca8]">
            {description ?? 'Upgrade to Pro to unlock this feature and hire verified developers faster.'}
          </p>
          {onUpgrade && (
            <button
              type="button"
              onClick={() => onUpgrade?.()}
              className="mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              <Crown size={14} />
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function UpgradeScreen({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const { openUpgrade } = useSubscription()

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-violet-500/30 bg-[#161722]/40 p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
        <Lock size={24} className="text-violet-300" />
      </div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-[#8b8ca8]">{description}</p>
      <button
        type="button"
        onClick={() => openUpgrade()}
        className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        <Crown size={16} />
        Upgrade Plan
      </button>
    </div>
  )
}
