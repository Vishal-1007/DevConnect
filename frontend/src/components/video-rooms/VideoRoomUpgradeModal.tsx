import { useState } from 'react'
import { Check, Crown, Loader2, X } from 'lucide-react'
import { openRazorpayCheckout } from '../../lib/razorpayCheckout'
import {
  useConfirmVideoRoomProPaymentMutation,
  useCreateVideoRoomProOrderMutation,
} from '../../api/videoRoomsApi'
import type { VideoRoomUsage } from '../../api/types'

const BENEFITS = [
  'Unlimited meeting duration',
  'Unlimited participants',
  'Create unlimited rooms',
  'No 24-hour waiting time',
  'Priority support',
]

interface VideoRoomUpgradeModalProps {
  usage?: VideoRoomUsage
  title?: string
  subtitle?: string
  onClose: () => void
  onPurchased: () => void
}

export function VideoRoomUpgradeModal({
  usage,
  title = 'Upgrade to Video Room Pro',
  subtitle = 'Unlock unlimited live meetings for your developer community.',
  onClose,
  onPurchased,
}: VideoRoomUpgradeModalProps) {
  const [createOrder] = useCreateVideoRoomProOrderMutation()
  const [confirmPayment] = useConfirmVideoRoomProPaymentMutation()
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  async function handleBuy() {
    setError(null)
    setPaying(true)
    try {
      const order = await createOrder().unwrap()
      const payment = await openRazorpayCheckout({
        amount: Number(order.amount),
        currency: order.currency,
        description: order.description,
        keyId: '',
        idempotencyKey: order.idempotencyKey,
      })
      await confirmPayment({ paymentId: payment.id }).unwrap()
      onPurchased()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed'
      if (!msg.includes('cancelled')) {
        setError(msg)
      }
    } finally {
      setPaying(false)
    }
  }

  const price = usage?.premiumPriceInr ?? 50

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#161722] border border-[#6366f1]/30 shadow-2xl overflow-hidden">
        <div className="relative p-6 pb-4 bg-gradient-to-br from-[#6366f1]/15 to-transparent">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8b8ca8] hover:text-white hover:bg-[#2d2e3e]"
          >
            <X size={18} />
          </button>
          <div className="w-12 h-12 rounded-xl bg-[#6366f1]/20 flex items-center justify-center mb-4">
            <Crown className="w-6 h-6 text-[#818cf8]" />
          </div>
          <h2 className="text-lg font-bold text-white pr-8">{title}</h2>
          <p className="text-sm text-[#8b8ca8] mt-2 leading-relaxed">{subtitle}</p>
        </div>

        <div className="px-6 py-4 border-t border-[#2d2e3e]">
          <div className="rounded-xl bg-[#0b0c14] border border-[#2d2e3e] p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white">Video Room Pro</span>
              <span className="text-xl font-bold text-white">₹{price}</span>
            </div>
            <p className="text-[10px] text-emerald-400 mb-3 font-semibold">Lifetime · BEST VALUE</p>
            <ul className="space-y-2">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2 text-xs text-[#b4b5c8]">
                  <Check size={12} className="text-emerald-400 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-3">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={paying}
            onClick={handleBuy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50"
          >
            {paying ? <Loader2 size={18} className="animate-spin" /> : null}
            Upgrade Now — ₹{price}
          </button>
          <p className="text-[10px] text-center text-[#5c5d72] mt-3">Secure payment with Razorpay</p>
        </div>
      </div>
    </div>
  )
}
