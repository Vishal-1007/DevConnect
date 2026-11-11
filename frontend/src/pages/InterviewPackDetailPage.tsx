import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Star, Lock, Loader2, ShoppingCart, Clock, HelpCircle } from 'lucide-react'
import {
  useGetInterviewPackQuery,
  usePurchaseInterviewPackMutation,
  useEnrollFreeInterviewPackMutation,
} from '../api/interviewMarketplaceApi'
import { useCheckoutPaymentMutation, useGetPaymentConfigQuery } from '../api/paymentsApi'
import { openRazorpayCheckout } from '../lib/razorpayCheckout'
import { extractApiError } from '../lib/extractApiError'

export function InterviewPackDetailPage() {
  const { packId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const preview = searchParams.get('preview') === '1'
  const navigate = useNavigate()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [error, setError] = useState('')

  const { data: pack, isLoading } = useGetInterviewPackQuery({ id: packId, preview })
  const { data: paymentConfig } = useGetPaymentConfigQuery()
  const [checkout] = useCheckoutPaymentMutation()
  const [purchase] = usePurchaseInterviewPackMutation()
  const [enrollFree] = useEnrollFreeInterviewPackMutation()

  async function handlePurchase() {
    if (!pack) return
    setError('')
    try {
      if (pack.free) {
        await enrollFree(pack.id).unwrap()
        navigate(`/interview-assessment/pack/${pack.id}`)
        return
      }
      if (pack.purchased || pack.hasAccess) {
        navigate(`/interview-assessment/pack/${pack.id}`)
        return
      }
      const amount = pack.priceCents / 100
      let paymentId: string
      if (paymentConfig?.razorpayEnabled && paymentConfig.razorpayKeyId) {
        const payment = await openRazorpayCheckout({
          amount,
          currency: pack.currency,
          description: `DevConnect interview pack: ${pack.title}`,
          keyId: paymentConfig.razorpayKeyId,
          idempotencyKey: `interview-${pack.id}-${Date.now()}`,
        })
        paymentId = payment.id
      } else {
        const payment = await checkout({
          payment: {
            amount,
            currency: pack.currency,
            description: `DevConnect interview pack: ${pack.title}`,
            paymentMode: 'UPI',
            idempotencyKey: `interview-${pack.id}-${Date.now()}`,
          },
          simulatedOutcome: 'SUCCESS',
        }).unwrap()
        paymentId = payment.id
      }
      await purchase({ id: pack.id, paymentId }).unwrap()
      setCheckoutOpen(false)
      navigate(`/interview-assessment/pack/${pack.id}`)
    } catch (e) {
      setError(extractApiError(e))
    }
  }

  if (isLoading || !pack) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-violet-400" size={28} />
      </div>
    )
  }

  const tax = Math.round(pack.priceCents * 0.18)
  const total = pack.priceCents + tax
  const showPreview = preview || !pack.hasAccess

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#8b8ca8] hover:text-white">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-white">{pack.title}</h1>
            <p className="text-sm text-[#8b8ca8] mt-1">by {pack.mentorName}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-[#8b8ca8]">
              <span className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" />{pack.avgRating.toFixed(1)} ({pack.reviewCount} reviews)</span>
              <span>{pack.questionCount} questions</span>
              <span className="flex items-center gap-1"><Clock size={12} />{pack.durationMinutes} min</span>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">{pack.difficultyLabel}</span>
            </div>
          </div>

          {pack.description && (
            <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
              <h2 className="text-sm font-bold text-white mb-2">Overview</h2>
              <p className="text-sm text-[#8b8ca8] whitespace-pre-wrap">{pack.description}</p>
            </div>
          )}

          <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <HelpCircle size={14} className="text-violet-400" />
              {showPreview ? 'Sample Questions (Preview)' : 'Questions'}
            </h2>
            <div className="space-y-3">
              {(showPreview ? pack.sampleQuestions : pack.questions).map((q, i) => (
                <div key={q.id} className="p-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-white font-medium">Q{i + 1}. {q.title || q.questionText}</p>
                    {q.locked && <Lock size={14} className="text-[#5c5d72] shrink-0 mt-0.5" />}
                  </div>
                  {!q.locked && <p className="text-xs text-[#8b8ca8] mt-1 line-clamp-2">{q.questionText}</p>}
                </div>
              ))}
              {showPreview && (
                <p className="text-xs text-[#5c5d72] text-center pt-2">
                  {pack.questionCount - 3} more questions locked — purchase to unlock full content.
                </p>
              )}
            </div>
          </div>

          {pack.reviews.length > 0 && (
            <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-white">Reviews</h2>
              {pack.reviews.map((r) => (
                <div key={r.id} className="border-t border-[#2d2e3e] pt-3 first:border-0 first:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{r.learnerName}</span>
                    <span className="text-amber-400 text-xs">{'★'.repeat(r.rating)}</span>
                  </div>
                  {r.reviewText && <p className="text-xs text-[#8b8ca8] mt-1">{r.reviewText}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="sticky top-6 bg-[#161722] border border-[#2d2e3e] rounded-2xl p-5 space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{pack.free ? 'Free' : pack.priceLabel}</p>
              <p className="text-xs text-[#8b8ca8] mt-1">{pack.validityLabel}</p>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="button"
              onClick={() => (pack.free || pack.purchased || pack.hasAccess ? handlePurchase() : setCheckoutOpen(true))}
              className="w-full py-3 rounded-xl dc-gradient-btn text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              <ShoppingCart size={16} />
              {pack.purchased || pack.hasAccess ? 'Open Pack' : pack.free ? 'Get Free Access' : 'Buy Now'}
            </button>
            <button type="button" onClick={() => navigate(`/interview-marketplace/${pack.id}?preview=1`)} className="w-full py-2.5 rounded-xl border border-[#2d2e3e] text-sm text-[#8b8ca8] hover:text-white">
              Preview
            </button>
          </div>
        </div>
      </div>

      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#12131c] border border-[#2d2e3e] rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Checkout</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#8b8ca8]"><span>{pack.title}</span><span>{pack.priceLabel}</span></div>
              <div className="flex justify-between text-[#8b8ca8]"><span>Tax (18% GST)</span><span>₹{(tax / 100).toFixed(0)}</span></div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-[#2d2e3e]">
                <span>Total</span><span>₹{(total / 100).toFixed(0)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCheckoutOpen(false)} className="flex-1 py-2.5 rounded-lg border border-[#2d2e3e] text-sm text-[#8b8ca8]">Cancel</button>
              <button type="button" onClick={handlePurchase} className="flex-1 py-2.5 rounded-lg dc-gradient-btn text-white text-sm font-bold">Confirm Purchase</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
