import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radio, Search, Loader2 } from 'lucide-react'
import {
  useBrowseStreamCoursesQuery,
  usePurchasedStreamCoursesQuery,
  useRecommendedStreamCoursesQuery,
  usePurchaseStreamCourseMutation,
  useEnrollFreeStreamCourseMutation,
  useSaveStreamCourseMutation,
  useUnsaveStreamCourseMutation,
  useAddStreamToCartMutation,
} from '../api/learningStreamsApi'
import { useCheckoutPaymentMutation, useGetPaymentConfigQuery } from '../api/paymentsApi'
import { StreamCourseCardView, StreamCourseSkeleton, StreamEmptyState } from '../components/learning-streams/StreamCourseCard'
import { extractApiError } from '../lib/extractApiError'
import { openRazorpayCheckout } from '../lib/razorpayCheckout'

type Tab = 'free' | 'premium' | 'purchased' | 'recommended'

export function LearningStreamsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('free')
  const [search, setSearch] = useState('')
  const [page] = useState(0)

  const { data: paymentConfig } = useGetPaymentConfigQuery()
  const freeQuery = useBrowseStreamCoursesQuery(
    { pricingType: 'FREE', search: search || undefined, page, size: 12 },
    { skip: tab !== 'free' },
  )
  const premiumQuery = useBrowseStreamCoursesQuery(
    { pricingType: 'PAID', search: search || undefined, page, size: 12 },
    { skip: tab !== 'premium' },
  )
  const purchasedQuery = usePurchasedStreamCoursesQuery({ page, size: 12 }, { skip: tab !== 'purchased' })
  const recommendedQuery = useRecommendedStreamCoursesQuery({ page, size: 12 }, { skip: tab !== 'recommended' })

  const active = tab === 'free' ? freeQuery : tab === 'premium' ? premiumQuery : tab === 'purchased' ? purchasedQuery : recommendedQuery
  const courses = active.data?.items ?? []

  const [checkout] = useCheckoutPaymentMutation()
  const [purchase] = usePurchaseStreamCourseMutation()
  const [enrollFree] = useEnrollFreeStreamCourseMutation()
  const [saveCourse] = useSaveStreamCourseMutation()
  const [unsaveCourse] = useUnsaveStreamCourseMutation()
  const [addToCart] = useAddStreamToCartMutation()

  const tabs = useMemo(() => ([
    { id: 'free' as Tab, label: 'Free Courses' },
    { id: 'premium' as Tab, label: 'Premium Courses' },
    { id: 'purchased' as Tab, label: 'Purchased Courses' },
    { id: 'recommended' as Tab, label: 'Recommended' },
  ]), [])

  async function handleBuy(courseId: string, title: string, amountCents: number, currency: string) {
    const amount = amountCents / 100
    if (paymentConfig?.razorpayEnabled && paymentConfig.razorpayKeyId) {
      const payment = await openRazorpayCheckout({
        amount,
        currency,
        description: `DevConnect course: ${title}`,
        keyId: paymentConfig.razorpayKeyId,
        idempotencyKey: `course-${courseId}-${Date.now()}`,
      })
      await purchase({ courseId, paymentId: payment.id }).unwrap()
      return
    }
    const payment = await checkout({
      payment: {
        amount,
        currency,
        description: `DevConnect course: ${title}`,
        paymentMode: 'UPI',
        idempotencyKey: `course-${courseId}-${Date.now()}`,
      },
      simulatedOutcome: 'SUCCESS',
    }).unwrap()
    await purchase({ courseId, paymentId: payment.id }).unwrap()
  }

  async function handleWatch(courseId: string, isPaid: boolean, purchased: boolean) {
    if (!isPaid || purchased) {
      if (!isPaid) await enrollFree(courseId).unwrap().catch(() => {})
      navigate(`/learning-streams/${courseId}/watch`)
    }
  }

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Radio size={22} className="text-violet-400" /> Learning Streams
        </h1>
        <p className="text-sm text-[#8b8ca8] mt-1">
          Video courses from mentors and DevConnect — free and premium learning paths.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              tab === t.id
                ? 'bg-violet-600 text-white'
                : 'bg-[#161722] border border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses, tags…"
          className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#5c5d72]"
        />
      </div>

      {active.isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <StreamCourseSkeleton key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <StreamEmptyState
            title="No courses found"
            subtitle={tab === 'purchased' ? 'Purchase a premium course to see it here.' : 'Check back soon for new video courses.'}
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => {
            const isPaid = course.pricingType === 'PAID'
            const price = course.discountPriceCents ?? course.priceCents
            return (
              <StreamCourseCardView
                key={course.id}
                course={course}
                onSave={() => (course.saved ? unsaveCourse(course.id) : saveCourse(course.id))}
                onCart={() => addToCart(course.id)}
                onBuy={() => handleBuy(course.id, course.title, price, course.currency ?? 'INR').catch((e) => alert(extractApiError(e)))}
                onWatch={() => handleWatch(course.id, isPaid, course.purchased).catch((e) => alert(extractApiError(e)))}
              />
            )
          })}
        </div>
      )}

      {active.isFetching && !active.isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 size={20} className="animate-spin text-violet-400" />
        </div>
      )}
    </div>
  )
}
