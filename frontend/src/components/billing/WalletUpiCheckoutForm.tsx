import { useState } from 'react'
import { Loader2, Lock, Smartphone } from 'lucide-react'
import { useCheckoutPaymentMutation } from '../../api/paymentsApi'
import type { BillingPlan, Payment } from '../../api/types'
import { PAYMENT_MODE_BY_ID, type PaymentModeId } from '../../data/paymentModes'
import { extractApiError } from '../../lib/extractApiError'

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

interface WalletUpiCheckoutFormProps {
  plan: BillingPlan
  mode: PaymentModeId
  disabled?: boolean
  onBack: () => void
  onSuccess: (payment: Payment) => void
  onError: (message: string) => void
  onProcessingChange: (processing: boolean) => void
}

function isValidUpiId(value: string) {
  const trimmed = value.trim()
  return trimmed.length >= 5 && (trimmed.includes('@') || /^[a-zA-Z0-9.\-_]{3,}$/.test(trimmed))
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10
}

export function WalletUpiCheckoutForm({
  plan,
  mode,
  disabled,
  onBack,
  onSuccess,
  onError,
  onProcessingChange,
}: WalletUpiCheckoutFormProps) {
  const visual = PAYMENT_MODE_BY_ID[mode]
  const isUpi = mode === 'UPI' || mode === 'BHIM'
  const [identifier, setIdentifier] = useState('')
  const [checkoutPayment, { isLoading: checkingOut }] = useCheckoutPaymentMutation()

  const busy = disabled || checkingOut

  const formValid = isUpi ? isValidUpiId(identifier) : isValidPhone(identifier)

  async function handlePay() {
    if (!formValid) return
    onProcessingChange(true)

    try {
      const idempotencyKey = `checkout-${plan.id}-${mode}-${crypto.randomUUID()}`
      const completed = await checkoutPayment({
        payment: {
          amount: plan.price,
          currency: plan.currency,
          description: `${plan.name} subscription (${visual.label})`,
          paymentMode: mode,
          idempotencyKey,
        },
        simulatedOutcome: 'SUCCESS',
      }).unwrap()

      if (completed.status !== 'COMPLETED') {
        throw new Error(completed.failureReason ?? 'Payment was not completed')
      }

      onSuccess(completed)
    } catch (err) {
      onError(extractApiError(err))
    } finally {
      onProcessingChange(false)
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-[#2d2e3e] bg-[#12131c] p-4">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: visual.accentMuted, color: visual.accent }}
        >
          {visual.monogram}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Pay with {visual.label}</p>
          <p className="text-[11px] text-[#5c5d72]">
            {isUpi
              ? 'Enter your UPI ID (VPA) to authorize payment'
              : 'Enter mobile number linked to your wallet'}
          </p>
        </div>
      </div>

      <label className="block">
        <span className="text-xs text-[#8b8ca8]">
          {isUpi ? 'UPI ID (VPA)' : 'Mobile number'}
        </span>
        <div className="relative mt-1">
          <Smartphone
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]"
          />
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={isUpi ? 'yourname@upi' : '9876543210'}
            className="w-full rounded-lg border border-[#2d2e3e] bg-[#0f1018] pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-[#5c5d72] focus:border-[#6366f1] focus:outline-none"
          />
        </div>
      </label>

      <p className="mt-3 text-[11px] text-[#5c5d72] flex items-center gap-1.5">
        <Lock size={12} />
        Demo mode — mock gateway simulates {visual.label} authorization. No real money is moved.
      </p>

      <div className="flex flex-wrap gap-3 mt-5">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="px-4 py-2.5 rounded-xl border border-[#2d2e3e] text-sm text-[#8b8ca8] hover:text-white disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={busy || !formValid}
          className="px-6 py-2.5 rounded-xl dc-gradient-btn text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          Pay {formatMoney(plan.price, plan.currency)} via {visual.label}
        </button>
      </div>
    </div>
  )
}
