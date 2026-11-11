import { Check, X } from 'lucide-react'
import type { PricingPlan } from '../../../data/recruiterBillingData'

type Props = {
  plan: PricingPlan
  isCurrent?: boolean
  onAction?: () => void
}

export function PricingCard({ plan, isCurrent, onAction }: Props) {
  const buttonClass =
    plan.buttonVariant === 'upgrade'
      ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white hover:opacity-90'
      : plan.buttonVariant === 'contact'
        ? 'border border-[#2d2e3e] bg-white/5 text-white hover:border-violet-500/40'
        : plan.buttonVariant === 'free'
          ? 'border border-[#2d2e3e] bg-white/5 text-white hover:border-violet-500/40'
          : 'border border-[#2d2e3e] bg-[#0b0c14]/60 text-[#8b8ca8] cursor-default'

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-5 backdrop-blur-md ${
        plan.recommended
          ? 'border-violet-500/50 bg-[#161722]/80 shadow-lg shadow-violet-500/10'
          : 'border-[#2d2e3e]/80 bg-[#161722]/60'
      }`}
    >
      {plan.recommended && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-3 py-0.5 text-[10px] font-semibold text-white">
          Recommended
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-base font-bold text-white">{plan.name}</h3>
        <div className="mt-1 flex items-baseline gap-0.5">
          <span className="text-2xl font-bold text-white">{plan.price}</span>
          {plan.period && <span className="text-sm text-[#8b8ca8]">{plan.period}</span>}
        </div>
        <p className="mt-1 text-xs text-[#8b8ca8]">{plan.description}</p>
      </div>

      <ul className="mb-4 flex-1 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-[#c4c5d6]">
            <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
            {feature}
          </li>
        ))}
        {plan.missing?.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-[#5c5d72]">
            <X size={14} className="mt-0.5 shrink-0 text-red-400/70" />
            {feature}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onAction}
        disabled={isCurrent && plan.buttonVariant === 'current'}
        className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${buttonClass}`}
      >
        {isCurrent && plan.id === 'pro' ? 'Current Plan' : plan.buttonLabel}
      </button>
    </div>
  )
}
