import { CreditCard, Crown, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import type { RecruiterPlanType } from '../../../types/recruiterSubscription'
import { completeRecruiterUpgradeCheckout } from '../../../lib/recruiterUpgradeCheckout'
import { formatInr } from '../../../lib/formatTime'

const PLAN_DETAILS: Record<
  Exclude<RecruiterPlanType, 'FREE'>,
  { name: string; price: number; features: string[] }
> = {
  PRO: {
    name: 'Pro Recruiter',
    price: 4999,
    features: [
      '20 Active Jobs',
      '1000 Candidate Searches',
      'Unlimited Messaging',
      'Full DevScore & AI Reports',
      'Talent Pool & Analytics',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 0,
    features: ['Unlimited everything', 'API Access', 'Dedicated Support'],
  },
}

type Props = {
  planType: RecruiterPlanType
  onClose: () => void
  onSuccess: () => void
}

export function UpgradePaymentModal({ planType, onClose, onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  if (planType === 'FREE') return null

  const plan = PLAN_DETAILS[planType as Exclude<RecruiterPlanType, 'FREE'>]

  async function handlePay() {
    if (planType === 'ENTERPRISE') {
      setError('Contact sales for Enterprise pricing')
      return
    }

    setError(null)
    setPaying(true)
    try {
      await completeRecruiterUpgradeCheckout(planType)
      onSuccess()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed'
      if (!msg.includes('cancelled')) setError(msg)
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#2d2e3e] bg-[#161722] shadow-2xl">
        <div className="relative bg-gradient-to-br from-[#6366f1]/15 to-transparent p-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-[#8b8ca8] hover:bg-[#2d2e3e] hover:text-white"
          >
            <X size={18} />
          </button>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
            <Crown className="h-6 w-6 text-violet-300" />
          </div>
          <h2 className="pr-8 text-lg font-bold text-white">Upgrade to {plan.name}</h2>
          <p className="mt-2 text-sm text-[#8b8ca8]">
            Unlock verified candidates, DevScore insights, and AI-powered hiring tools.
          </p>
        </div>

        <div className="border-t border-[#2d2e3e]/60 px-6 py-4">
          <div className="mb-4 rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{plan.name}</span>
              <span className="text-2xl font-bold text-white">
                {planType === 'PRO' ? formatInr(plan.price) : 'Custom'}
              </span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="text-xs text-[#8b8ca8]">
                  ✔ {f}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={paying}
            onClick={handlePay}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {paying ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={16} />}
            {planType === 'PRO' ? `Pay ${formatInr(plan.price)}` : 'Contact Sales'}
          </button>
        </div>
      </div>
    </div>
  )
}
