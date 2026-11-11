import { useMemo, useState } from 'react'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, type StripeCardElementOptions } from '@stripe/stripe-js'
import { Loader2, Lock } from 'lucide-react'
import {
  useConfirmPaymentMutation,
  useCreatePaymentIntentMutation,
} from '../../api/paymentsApi'
import type { BillingPlan, Payment } from '../../api/types'
import { extractApiError } from '../../lib/extractApiError'

const CARD_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      '::placeholder': { color: '#5c5d72' },
    },
    invalid: { color: '#f87171' },
  },
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

interface StripeCheckoutFormProps {
  plan: BillingPlan
  publishableKey: string
  disabled?: boolean
  onBack: () => void
  onSuccess: (payment: Payment) => void
  onError: (message: string) => void
  onProcessingChange: (processing: boolean) => void
}

function StripePaymentForm({
  plan,
  disabled,
  onBack,
  onSuccess,
  onError,
  onProcessingChange,
}: Omit<StripeCheckoutFormProps, 'publishableKey'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardName, setCardName] = useState('')
  const [createIntent, { isLoading: creating }] = useCreatePaymentIntentMutation()
  const [confirmPayment, { isLoading: confirming }] = useConfirmPaymentMutation()

  const busy = disabled || creating || confirming

  async function handlePay() {
    if (!stripe || !elements || cardName.trim().length < 2) return

    const card = elements.getElement(CardElement)
    if (!card) {
      onError('Card input is not ready yet.')
      return
    }

    onProcessingChange(true)

    try {
      const idempotencyKey = `checkout-${plan.id}-${crypto.randomUUID()}`
      const authorized = await createIntent({
        amount: plan.price,
        currency: plan.currency,
        description: `${plan.name} subscription`,
        paymentMode: 'CARD',
        idempotencyKey,
      }).unwrap()

      if (!authorized.clientSecret) {
        throw new Error('Stripe client secret was not returned by the payment service.')
      }

      const confirmation = await stripe.confirmCardPayment(authorized.clientSecret, {
        payment_method: {
          card,
          billing_details: { name: cardName.trim() },
        },
      })

      if (confirmation.error) {
        throw new Error(confirmation.error.message ?? 'Card confirmation failed')
      }

      const completed = await confirmPayment({
        paymentId: authorized.id,
        body: {},
      }).unwrap()

      onSuccess(completed)
    } catch (err) {
      onError(extractApiError(err))
    } finally {
      onProcessingChange(false)
    }
  }

  return (
    <div>
      <label className="sm:col-span-2 block mb-4">
        <span className="text-xs text-[#8b8ca8]">Name on card</span>
        <input
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder="Alex Developer"
          className="mt-1 w-full rounded-lg border border-[#2d2e3e] bg-[#12131c] px-3 py-2.5 text-sm text-white placeholder:text-[#5c5d72] focus:border-[#6366f1] focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs text-[#8b8ca8]">Card details</span>
        <div className="mt-1 rounded-lg border border-[#2d2e3e] bg-[#12131c] px-3 py-3">
          <CardElement options={CARD_OPTIONS} />
        </div>
      </label>

      <p className="mt-3 text-[11px] text-[#5c5d72] flex items-center gap-1.5">
        <Lock size={12} />
        Secured by Stripe. Test card: 4242 4242 4242 4242
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
          disabled={busy || cardName.trim().length < 2 || !stripe}
          className="px-6 py-2.5 rounded-xl dc-gradient-btn text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          Pay {formatMoney(plan.price, plan.currency)}
        </button>
      </div>
    </div>
  )
}

export function StripeCheckoutForm(props: StripeCheckoutFormProps) {
  const stripePromise = useMemo(
    () => loadStripe(props.publishableKey),
    [props.publishableKey]
  )

  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  )
}
