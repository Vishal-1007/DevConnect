import { useState } from 'react'
import { CreditCard, Loader2, Lock, X } from 'lucide-react'
import {
  useConfirmEventPaymentMutation,
  useCreateEventPaymentOrderMutation,
} from '../../api/eventsApi'
import type { CommunityEvent } from '../../api/types'
import { openRazorpayCheckout } from '../../lib/razorpayCheckout'
import { formatInr } from '../../lib/formatTime'

interface EventPaymentModalProps {
  event: CommunityEvent
  onClose: () => void
  onSuccess: (eventTitle: string) => void
}

export function EventPaymentModal({ event, onClose, onSuccess }: EventPaymentModalProps) {
  const [createOrder] = useCreateEventPaymentOrderMutation()
  const [confirmPayment] = useConfirmEventPaymentMutation()
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  async function handlePay() {
    setError(null)
    setPaying(true)
    try {
      const order = await createOrder(event.id).unwrap()
      const payment = await openRazorpayCheckout({
        amount: order.amountInr,
        currency: order.currency,
        description: order.description,
        keyId: '',
        idempotencyKey: order.idempotencyKey,
      })
      await confirmPayment({ eventId: event.id, paymentId: payment.id }).unwrap()
      onSuccess(event.title)
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed'
      if (!msg.includes('cancelled')) setError(msg)
    } finally {
      setPaying(false)
    }
  }

  const price = event.priceInr ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl dc-glass-card shadow-2xl overflow-hidden">
        <div className="relative p-6 pb-4 bg-gradient-to-br from-[#6366f1]/15 to-transparent">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8b8ca8] hover:text-white hover:bg-[#2d2e3e]"
          >
            <X size={18} />
          </button>
          <div className="w-12 h-12 rounded-xl bg-[#6366f1]/20 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-[#818cf8]" />
          </div>
          <h2 className="text-lg font-bold text-white pr-8">Premium event access</h2>
          <p className="text-sm text-[#8b8ca8] mt-2 leading-relaxed">
            Complete payment to unlock meeting link, resources, and event chat for{' '}
            <span className="text-white font-medium">{event.title}</span>.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-[#2d2e3e]/60">
          <div className="rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e] p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Event ticket</span>
              <span className="text-2xl font-bold text-white">{formatInr(price)}</span>
            </div>
            <p className="text-[10px] text-[#8b8ca8] mt-2">
              Hosted by {event.hostDisplayName} · {event.attendeeCount}/{event.maxAttendees} registered
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-3">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={paying}
            onClick={handlePay}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50"
          >
            {paying ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={16} />}
            Register {formatInr(price)}
          </button>
          <p className="text-[10px] text-center text-[#5c5d72] mt-3">Secure payment with Razorpay</p>
        </div>
      </div>
    </div>
  )
}
