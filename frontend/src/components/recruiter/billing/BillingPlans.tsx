import { CreditCard } from 'lucide-react'
import { useRef, useState } from 'react'
import type { PlanId, RecruiterBillingData } from '../../../data/recruiterBillingData'
import { loadRecruiterBilling, saveRecruiterBilling } from '../../../lib/recruiterBillingStore'
import { useSubscription } from '../../../contexts/SubscriptionContext'
import { CurrentPlan } from './CurrentPlan'
import { PricingCard } from './PricingCard'
import { HiringCredits } from './HiringCredits'
import { TeamSeats } from './TeamSeats'
import { FeatureComparison } from './FeatureComparison'
import { PaymentHistory } from './PaymentHistory'
import { BillingInfo } from './BillingInfo'
import { PremiumImpact } from './PremiumImpact'

function planIdFromType(planType: string): PlanId {
  if (planType === 'PRO') return 'pro'
  if (planType === 'ENTERPRISE') return 'enterprise'
  return 'free'
}

export function BillingPlans() {
  const { subscription, openUpgrade, refresh } = useSubscription()
  const [billing, setBilling] = useState<RecruiterBillingData>(() => loadRecruiterBilling())
  const [toast, setToast] = useState<string | null>(null)
  const pricingRef = useRef<HTMLDivElement>(null)

  const currentPlanId = planIdFromType(subscription.planType)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function persist(next: RecruiterBillingData) {
    setBilling(next)
    saveRecruiterBilling(next)
  }

  function scrollToPricing() {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handlePlanAction(planId: PlanId) {
    if (planId === currentPlanId) return
    if (planId === 'enterprise') {
      openUpgrade('ENTERPRISE')
      return
    }
    if (planId === 'pro') {
      openUpgrade('PRO')
      return
    }
    showToast('Contact support to downgrade your plan')
  }

  function handleBuyCredits(credits: number) {
    const pkg = billing.credits.packages.find((p) => p.credits === credits)
    persist({
      ...billing,
      credits: {
        ...billing.credits,
        available: billing.credits.available + credits,
      },
    })
    showToast(
      pkg
        ? `Purchased ${credits} credits for ₹${pkg.price.toLocaleString('en-IN')}`
        : `${credits} credits added`,
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Billing & Plans</h1>
          <p className="mt-1 text-sm text-[#8b8ca8]">
            Manage your subscription and unlock advanced hiring features
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            refresh()
            showToast('Billing refreshed')
          }}
          className="flex items-center gap-2 rounded-xl border border-[#2d2e3e] bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:border-violet-500/40"
        >
          <CreditCard size={16} />
          Manage Billing
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CurrentPlan
          planName={subscription.planName}
          status={subscription.status}
          renewal={subscription.renewalLabel}
          usageMetrics={subscription.usage.metrics}
          onUpgrade={scrollToPricing}
        />
        <HiringCredits credits={billing.credits} onBuyCredits={handleBuyCredits} />
        <TeamSeats teamSeats={billing.teamSeats} onAddSeat={() => showToast('Invite sent for new recruiter seat')} />
      </div>

      <div ref={pricingRef}>
        <h2 className="mb-4 text-sm font-semibold text-white">
          Choose the plan that fits your hiring needs
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {billing.plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={{
                ...plan,
                buttonLabel:
                  plan.id === currentPlanId && plan.id !== 'enterprise'
                    ? 'Current Plan'
                    : plan.buttonLabel,
                buttonVariant:
                  plan.id === currentPlanId && plan.id !== 'enterprise'
                    ? 'current'
                    : plan.buttonVariant,
              }}
              isCurrent={plan.id === currentPlanId}
              onAction={() => handlePlanAction(plan.id)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_280px]">
        <FeatureComparison rows={billing.featureComparison} />
        <PaymentHistory
          records={billing.paymentHistory}
          onDownload={(id) => showToast(`Downloading ${id}.pdf`)}
        />
        <BillingInfo
          billingInfo={billing.billingInfo}
          onUpdate={() => showToast('Billing info update coming soon')}
        />
      </div>

      <PremiumImpact impact={billing.premiumImpact} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-xl border border-violet-500/30 bg-[#161722] px-4 py-2.5 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
