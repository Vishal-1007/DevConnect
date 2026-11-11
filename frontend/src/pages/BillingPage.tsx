import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Receipt,
  Shield,
  Sparkles,
  XCircle,
} from 'lucide-react'
import {
  useConfirmPaymentMutation,
  useCreatePaymentIntentMutation,
  useGetPaymentConfigQuery,
  useListPaymentModesQuery,
  useListPaymentsQuery,
} from '../api/paymentsApi'
import type { BillingPlan, Payment } from '../api/types'
import { BILLING_PLANS } from '../data/billingPlans'
import { PAYMENT_MODE_BY_ID, type PaymentModeId } from '../data/paymentModes'
import { extractApiError } from '../lib/extractApiError'
import { PaymentMethodSelector } from '../components/billing/PaymentMethodSelector'
import { StripeCheckoutForm } from '../components/billing/StripeCheckoutForm'
import { WalletUpiCheckoutForm } from '../components/billing/WalletUpiCheckoutForm'

type CheckoutStep = 'plan' | 'payment' | 'processing' | 'success' | 'failed'

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function statusColor(status: Payment['status']) {
  switch (status) {
    case 'COMPLETED':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    case 'FAILED':
      return 'text-red-400 bg-red-500/10 border-red-500/30'
    case 'AUTHORIZED':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    default:
      return 'text-[#8b8ca8] bg-[#2d2e3e] border-[#3d3e52]'
  }
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: BillingPlan
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative text-left w-full rounded-2xl border p-5 transition-all ${
        selected
          ? 'border-[#6366f1] bg-[#6366f1]/10 ring-1 ring-[#6366f1]/40'
          : 'border-[#2d2e3e] bg-[#161722] hover:border-[#6366f1]/40'
      }`}
    >
      {plan.popular && (
        <span className="absolute -top-2.5 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#6366f1] text-white">
          Most popular
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-semibold">{plan.name}</p>
          <p className="text-xs text-[#8b8ca8] mt-1">{plan.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white">
            {formatMoney(plan.price, plan.currency)}
          </p>
          <p className="text-[10px] text-[#5c5d72] uppercase">per {plan.interval}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-[#8b8ca8]">
            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>
    </button>
  )
}

export function BillingPage() {
  const [step, setStep] = useState<CheckoutStep>('plan')
  const [selectedPlanId, setSelectedPlanId] = useState(BILLING_PLANS[1]?.id ?? BILLING_PLANS[0].id)
  const [paymentMode, setPaymentMode] = useState<PaymentModeId>('CARD')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null)

  const selectedPlan = useMemo(
    () => BILLING_PLANS.find((plan) => plan.id === selectedPlanId) ?? BILLING_PLANS[0],
    [selectedPlanId]
  )

  const selectedModeVisual = PAYMENT_MODE_BY_ID[paymentMode]

  const { data: payments = [], isLoading: historyLoading } = useListPaymentsQuery(10)
  const { data: paymentConfig } = useGetPaymentConfigQuery()
  const { data: paymentModes = [] } = useListPaymentModesQuery()
  const [createIntent, { isLoading: creating }] = useCreatePaymentIntentMutation()
  const [confirmPayment, { isLoading: confirming }] = useConfirmPaymentMutation()

  const useStripe =
    paymentConfig?.gatewayProvider === 'stripe' &&
    Boolean(paymentConfig.stripePublishableKey)

  const cardModeOnlyOnStripe = useStripe && paymentMode !== 'CARD'

  useEffect(() => {
    if (useStripe && paymentMode !== 'CARD') {
      setPaymentMode('CARD')
    }
  }, [useStripe, paymentMode])

  const paymentFormValid =
    paymentMode !== 'CARD' ||
    useStripe ||
    (cardName.trim().length >= 2 &&
      cardNumber.replace(/\s/g, '').length >= 15 &&
      expiry.trim().length >= 4 &&
      cvc.trim().length >= 3)

  async function handleMockCardCheckout() {
    if (!selectedPlan || !paymentFormValid || paymentMode !== 'CARD') return

    setError(null)
    setStep('processing')

    try {
      const idempotencyKey = `checkout-${selectedPlan.id}-${crypto.randomUUID()}`
      const authorized = await createIntent({
        amount: selectedPlan.price,
        currency: selectedPlan.currency,
        description: `${selectedPlan.name} subscription`,
        paymentMode: 'CARD',
        idempotencyKey,
      }).unwrap()

      const completed = await confirmPayment({
        paymentId: authorized.id,
        body: { simulatedOutcome: 'SUCCESS' },
      }).unwrap()

      setCompletedPayment(completed)
      setStep('success')
    } catch (err) {
      setError(extractApiError(err))
      setStep('failed')
    }
  }

  function resetCheckout() {
    setStep('plan')
    setError(null)
    setCompletedPayment(null)
  }

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg dc-gradient-btn flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Billing & Checkout</h1>
          </div>
          <p className="text-sm text-[#8b8ca8]">
            Card, UPI, and wallet payments — {useStripe ? 'Stripe for cards' : 'mock gateway for all modes'} with saga + Kafka notifications.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#5c5d72]">
          <Shield size={14} className="text-emerald-400" />
          <Lock size={14} />
          {useStripe ? 'Stripe secure checkout' : 'Encrypted checkout'}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          {step === 'success' && completedPayment && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">Payment successful</h2>
                  <p className="text-sm text-[#8b8ca8] mt-1">
                    {formatMoney(completedPayment.amount, completedPayment.currency)} charged via{' '}
                    {PAYMENT_MODE_BY_ID[completedPayment.paymentMethod as PaymentModeId]?.label ??
                      completedPayment.paymentMethod}{' '}
                    for {completedPayment.description}. Confirmation sent via Kafka.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      type="button"
                      onClick={resetCheckout}
                      className="px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5558e3] text-white text-sm font-semibold transition-colors"
                    >
                      Make another payment
                    </button>
                    <Link
                      to="/dashboard"
                      className="px-4 py-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white text-sm font-semibold transition-colors"
                    >
                      Back to dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'failed' && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
              <div className="flex items-start gap-4">
                <XCircle size={24} className="text-red-400 shrink-0" />
                <div>
                  <h2 className="text-lg font-bold text-white">Payment failed</h2>
                  <p className="text-sm text-red-300 mt-1">{error ?? 'Something went wrong.'}</p>
                  <button
                    type="button"
                    onClick={() => setStep('payment')}
                    className="mt-4 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {(step === 'plan' || step === 'payment' || step === 'processing') && (
            <>
              <section className="rounded-2xl border border-[#2d2e3e] bg-[#161722] p-5">
                <h2 className="text-sm font-semibold text-white mb-4">1. Choose your plan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {BILLING_PLANS.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      selected={selectedPlanId === plan.id}
                      onSelect={() => setSelectedPlanId(plan.id)}
                    />
                  ))}
                </div>
                {step === 'plan' && (
                  <button
                    type="button"
                    onClick={() => setStep('payment')}
                    className="mt-5 w-full sm:w-auto px-6 py-2.5 rounded-xl dc-gradient-btn text-white text-sm font-semibold hover:opacity-90"
                  >
                    Continue to payment
                  </button>
                )}
              </section>

              {(step === 'payment' || step === 'processing') && (
                <section className="rounded-2xl border border-[#2d2e3e] bg-[#161722] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard size={16} className="text-[#818cf8]" />
                    <h2 className="text-sm font-semibold text-white">2. Payment</h2>
                    {useStripe && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#635bff]/20 text-[#a5b4fc]">
                        Stripe
                      </span>
                    )}
                  </div>

                  <PaymentMethodSelector
                    selected={paymentMode}
                    onSelect={setPaymentMode}
                    modes={paymentModes}
                    stripeActive={useStripe}
                    disabled={step === 'processing'}
                  />

                  <div className="mt-6 border-t border-[#2d2e3e] pt-5">
                    {cardModeOnlyOnStripe ? (
                      <p className="text-sm text-amber-300/90">
                        Select Debit / Credit Card for Stripe checkout, or use the mock gateway for UPI and wallets.
                      </p>
                    ) : paymentMode === 'CARD' && useStripe && paymentConfig?.stripePublishableKey ? (
                      <StripeCheckoutForm
                        plan={selectedPlan}
                        publishableKey={paymentConfig.stripePublishableKey}
                        disabled={step === 'processing'}
                        onBack={() => setStep('plan')}
                        onSuccess={(payment) => {
                          setCompletedPayment(payment)
                          setStep('success')
                        }}
                        onError={(message) => {
                          setError(message)
                          setStep('failed')
                        }}
                        onProcessingChange={(processing) =>
                          setStep(processing ? 'processing' : 'payment')
                        }
                      />
                    ) : paymentMode === 'CARD' ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <label className="sm:col-span-2 block">
                            <span className="text-xs text-[#8b8ca8]">Name on card</span>
                            <input
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              placeholder="Alex Developer"
                              className="mt-1 w-full rounded-lg border border-[#2d2e3e] bg-[#12131c] px-3 py-2.5 text-sm text-white placeholder:text-[#5c5d72] focus:border-[#6366f1] focus:outline-none"
                            />
                          </label>
                          <label className="sm:col-span-2 block">
                            <span className="text-xs text-[#8b8ca8]">Card number</span>
                            <input
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="4242 4242 4242 4242"
                              inputMode="numeric"
                              className="mt-1 w-full rounded-lg border border-[#2d2e3e] bg-[#12131c] px-3 py-2.5 text-sm text-white placeholder:text-[#5c5d72] focus:border-[#6366f1] focus:outline-none"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs text-[#8b8ca8]">Expiry</span>
                            <input
                              value={expiry}
                              onChange={(e) => setExpiry(e.target.value)}
                              placeholder="MM/YY"
                              className="mt-1 w-full rounded-lg border border-[#2d2e3e] bg-[#12131c] px-3 py-2.5 text-sm text-white placeholder:text-[#5c5d72] focus:border-[#6366f1] focus:outline-none"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs text-[#8b8ca8]">CVC</span>
                            <input
                              value={cvc}
                              onChange={(e) => setCvc(e.target.value)}
                              placeholder="123"
                              inputMode="numeric"
                              className="mt-1 w-full rounded-lg border border-[#2d2e3e] bg-[#12131c] px-3 py-2.5 text-sm text-white placeholder:text-[#5c5d72] focus:border-[#6366f1] focus:outline-none"
                            />
                          </label>
                        </div>

                        <p className="mt-3 text-[11px] text-[#5c5d72] flex items-center gap-1.5">
                          <Lock size={12} />
                          Demo mode — mock gateway. No real card is charged.
                        </p>

                        <div className="flex flex-wrap gap-3 mt-5">
                          <button
                            type="button"
                            onClick={() => setStep('plan')}
                            disabled={step === 'processing'}
                            className="px-4 py-2.5 rounded-xl border border-[#2d2e3e] text-sm text-[#8b8ca8] hover:text-white disabled:opacity-50"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={handleMockCardCheckout}
                            disabled={
                              !paymentFormValid ||
                              step === 'processing' ||
                              creating ||
                              confirming
                            }
                            className="px-6 py-2.5 rounded-xl dc-gradient-btn text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                          >
                            {(step === 'processing' || creating || confirming) && (
                              <Loader2 size={16} className="animate-spin" />
                            )}
                            Pay {formatMoney(selectedPlan.price, selectedPlan.currency)}
                          </button>
                        </div>
                      </>
                    ) : (
                      <WalletUpiCheckoutForm
                        plan={selectedPlan}
                        mode={paymentMode}
                        disabled={step === 'processing'}
                        onBack={() => setStep('plan')}
                        onSuccess={(payment) => {
                          setCompletedPayment(payment)
                          setStep('success')
                        }}
                        onError={(message) => {
                          setError(message)
                          setStep('failed')
                        }}
                        onProcessingChange={(processing) =>
                          setStep(processing ? 'processing' : 'payment')
                        }
                      />
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#2d2e3e] bg-[#161722] p-5 sticky top-5">
            <h3 className="text-sm font-semibold text-white mb-4">Order summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-[#8b8ca8]">{selectedPlan.name}</span>
                <span className="text-white font-medium">
                  {formatMoney(selectedPlan.price, selectedPlan.currency)}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-[#5c5d72]">Payment mode</span>
                <span
                  className="text-[#8b8ca8] font-medium"
                  style={{ color: selectedModeVisual.accent }}
                >
                  {selectedModeVisual.label}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-[#5c5d72]">Billing cycle</span>
                <span className="text-[#8b8ca8] capitalize">{selectedPlan.interval}ly</span>
              </div>
              <div className="border-t border-[#2d2e3e] pt-3 flex justify-between gap-3">
                <span className="text-white font-semibold">Total due today</span>
                <span className="text-white font-bold">
                  {formatMoney(selectedPlan.price, selectedPlan.currency)}
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-[#12131c] border border-[#2d2e3e] p-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5c5d72]">
                Payment pipeline
              </p>
              <ol className="text-xs text-[#8b8ca8] space-y-1.5">
                <li>1. Authorize via {selectedModeVisual.label}</li>
                <li>2. Capture on confirm</li>
                <li>3. Outbox → Kafka event</li>
                <li>4. Notification inbox alert</li>
              </ol>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2d2e3e] bg-[#161722] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Receipt size={16} className="text-[#818cf8]" />
              <h3 className="text-sm font-semibold text-white">Recent payments</h3>
            </div>

            {historyLoading && (
              <div className="flex justify-center py-6">
                <Loader2 size={18} className="animate-spin text-[#6366f1]" />
              </div>
            )}

            {!historyLoading && payments.length === 0 && (
              <p className="text-xs text-[#5c5d72]">No payments yet.</p>
            )}

            <ul className="space-y-3">
              {payments.slice(0, 5).map((payment) => (
                <li
                  key={payment.id}
                  className="rounded-xl border border-[#2d2e3e] bg-[#12131c] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-white font-medium truncate">
                        {payment.description}
                      </p>
                      <p className="text-[10px] text-[#5c5d72] mt-0.5">
                        {formatDate(payment.createdAt)} ·{' '}
                        {PAYMENT_MODE_BY_ID[payment.paymentMethod as PaymentModeId]?.label ??
                          payment.paymentMethod}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusColor(payment.status)}`}
                    >
                      {payment.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-2">
                    {formatMoney(payment.amount, payment.currency)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
