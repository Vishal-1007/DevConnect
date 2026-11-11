import { Check, Lock } from 'lucide-react'
import type { PaymentModeOption } from '../../api/types'
import {
  CATEGORY_LABELS,
  PAYMENT_MODE_BY_ID,
  PAYMENT_MODE_CATALOG,
  type PaymentModeId,
  type PaymentModeVisual,
} from '../../data/paymentModes'

interface PaymentMethodSelectorProps {
  selected: PaymentModeId
  onSelect: (mode: PaymentModeId) => void
  modes?: PaymentModeOption[]
  stripeActive?: boolean
  disabled?: boolean
}

function resolveModes(apiModes?: PaymentModeOption[]): Array<{
  id: PaymentModeId
  label: string
  description: string
  category: PaymentModeVisual['category']
  available: boolean
  stripeNote?: boolean
}> {
  if (!apiModes?.length) {
    return PAYMENT_MODE_CATALOG.map((mode) => ({
      id: mode.id,
      label: mode.label,
      description: mode.description,
      category: mode.category,
      available: true,
    }))
  }

  return apiModes
    .filter((m): m is PaymentModeOption & { id: PaymentModeId } =>
      m.id in PAYMENT_MODE_BY_ID
    )
    .map((m) => ({
      id: m.id as PaymentModeId,
      label: m.label,
      description: m.description,
      category: (m.category as PaymentModeVisual['category']) ?? 'wallets',
      available: m.availableWithStripe !== false,
      stripeNote: !m.availableWithStripe,
    }))
}

export function PaymentMethodSelector({
  selected,
  onSelect,
  modes,
  stripeActive,
  disabled,
}: PaymentMethodSelectorProps) {
  const options = resolveModes(modes)
  const grouped = ['cards', 'upi', 'wallets'] as const

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5c5d72]">
            Mode of payment
          </p>
          <p className="text-[11px] text-[#5c5d72] mt-0.5">
            Choose how you want to pay — secured by our payment saga
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] text-[#5c5d72]">
          <Lock size={11} className="text-emerald-400" />
          PCI-aware routing
        </span>
      </div>

      {stripeActive && (
        <p className="text-[11px] rounded-lg border border-[#635bff]/30 bg-[#635bff]/10 text-[#a5b4fc] px-3 py-2">
          Stripe is active: card checkout is live. UPI and wallet modes are available in demo
          (mock gateway) or when you switch the backend provider.
        </p>
      )}

      {grouped.map((category) => {
        const items = options.filter((o) => o.category === category)
        if (items.length === 0) return null

        return (
          <div key={category}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c5d72] mb-2">
              {CATEGORY_LABELS[category]}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {items.map((option) => {
                const visual = PAYMENT_MODE_BY_ID[option.id]
                const isSelected = selected === option.id
                const isDisabled = disabled || !option.available

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSelect(option.id)}
                    title={
                      option.stripeNote
                        ? 'Not available with Stripe — use card or mock gateway'
                        : option.description
                    }
                    className={`relative text-left rounded-xl border p-3 transition-all ${
                      isSelected
                        ? 'border-[#6366f1] ring-1 ring-[#6366f1]/50 bg-[#6366f1]/10'
                        : 'border-[#2d2e3e] bg-[#12131c] hover:border-[#6366f1]/35'
                    } ${isDisabled ? 'opacity-45 cursor-not-allowed hover:border-[#2d2e3e]' : ''}`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#6366f1] flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </span>
                    )}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mb-2"
                      style={{
                        backgroundColor: visual.accentMuted,
                        color: visual.accent,
                      }}
                    >
                      {visual.monogram.length <= 3 ? visual.monogram : (
                        <visual.icon size={18} />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white pr-6">{option.label}</p>
                    <p className="text-[10px] text-[#5c5d72] mt-0.5 line-clamp-2">
                      {option.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
