import { useState } from 'react'
import { Check, Loader2, Sparkles, X, Zap } from 'lucide-react'
import { openRazorpayCheckout } from '../../lib/razorpayCheckout'
import {
  useConfirmCodeReviewPaymentMutation,
  useCreateCodeReviewOrderMutation,
  type AiReviewUsage,
} from '../../api/aiReviewApi'

const BENEFITS = [
  'Complete AI Code Analysis',
  'Security Review',
  'Performance Suggestions',
  'Architecture Feedback',
  'Clean Code Improvements',
]

interface CodeReviewUpgradeModalProps {
  usage?: AiReviewUsage
  onClose: () => void
  onPurchased: () => void
}

export function CodeReviewUpgradeModal({ usage, onClose, onPurchased }: CodeReviewUpgradeModalProps) {
  const [createOrder] = useCreateCodeReviewOrderMutation()
  const [confirmPayment] = useConfirmCodeReviewPaymentMutation()
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#161722] border border-[#6366f1]/30 shadow-2xl shadow-[#6366f1]/10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="relative p-6 pb-4 bg-gradient-to-br from-[#6366f1]/15 to-transparent">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8b8ca8] hover:text-white hover:bg-[#2d2e3e]"
          >
            <X size={18} />
          </button>
          <div className="w-12 h-12 rounded-xl bg-[#6366f1]/20 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-[#818cf8]" />
          </div>
          <h2 className="text-lg font-bold text-white pr-8">Daily AI Review Limit Reached</h2>
          <p className="text-sm text-[#8b8ca8] mt-2 leading-relaxed">
            You have used your {usage?.freeLimit ?? 2} free AI code reviews for today.
            <br />
            Upgrade to continue improving your code.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-[#2d2e3e]">
          <div className="rounded-xl bg-[#0b0c14] border border-[#2d2e3e] p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles size={14} className="text-[#818cf8]" />
                Extra AI Code Review
              </span>
              <span className="text-xl font-bold text-white">₹50</span>
            </div>
            <p className="text-[10px] text-[#8b8ca8] mb-3">Includes:</p>
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
            Buy 1 Review — ₹50
          </button>
          <p className="text-[10px] text-center text-[#5c5d72] mt-3">
            Resets daily at midnight · Paid reviews never expire today
          </p>
        </div>
      </div>
    </div>
  )
}
