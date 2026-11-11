import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Star, Clock, Users, Lock, Play, ShoppingCart, Bookmark, UserPlus, Loader2 } from 'lucide-react'
import {
  useGetStreamCourseQuery,
  usePurchaseStreamCourseMutation,
  useEnrollFreeStreamCourseMutation,
  useSaveStreamCourseMutation,
  useUnsaveStreamCourseMutation,
  useAddStreamToCartMutation,
  useFollowStreamMentorMutation,
  useUnfollowStreamMentorMutation,
} from '../api/learningStreamsApi'
import { useCheckoutPaymentMutation, useGetPaymentConfigQuery } from '../api/paymentsApi'
import { avatarUrl } from '../lib/avatar'
import { openRazorpayCheckout } from '../lib/razorpayCheckout'
import { StreamCourseCardView } from '../components/learning-streams/StreamCourseCard'
import { extractApiError } from '../lib/extractApiError'

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}

export function StreamCourseDetailPage() {
  const { courseId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const paymentId = searchParams.get('paymentId')

  const { data: course, isLoading, refetch } = useGetStreamCourseQuery(courseId, { skip: !courseId })
  const { data: paymentConfig } = useGetPaymentConfigQuery()
  const [purchase] = usePurchaseStreamCourseMutation()
  const [enrollFree] = useEnrollFreeStreamCourseMutation()
  const [checkout] = useCheckoutPaymentMutation()
  const [saveCourse] = useSaveStreamCourseMutation()
  const [unsaveCourse] = useUnsaveStreamCourseMutation()
  const [addToCart] = useAddStreamToCartMutation()
  const [follow] = useFollowStreamMentorMutation()
  const [unfollow] = useUnfollowStreamMentorMutation()

  useEffect(() => {
    if (paymentId && courseId) {
      purchase({ courseId, paymentId }).unwrap().then(() => refetch()).catch(() => {})
    }
  }, [paymentId, courseId, purchase, refetch])

  const isPaid = course?.pricingType === 'PAID'
  const canWatch = course && (course.purchased || !isPaid)
  const price = course ? (course.discountPriceCents ?? course.priceCents) : 0

  const previewLesson = useMemo(() => {
    if (!course) return null
    for (const s of course.sections) {
      const lesson = s.lessons.find((l) => l.previewFree && !l.locked)
      if (lesson) return lesson
    }
    return null
  }, [course])

  async function handleBuy() {
    if (!course) return
    const amount = price / 100
    const currency = course.currency ?? 'INR'
    if (paymentConfig?.razorpayEnabled && paymentConfig.razorpayKeyId) {
      const payment = await openRazorpayCheckout({
        amount,
        currency,
        description: `DevConnect course: ${course.title}`,
        keyId: paymentConfig.razorpayKeyId,
        idempotencyKey: `course-${course.id}-${Date.now()}`,
      })
      await purchase({ courseId: course.id, paymentId: payment.id }).unwrap()
      refetch()
      return
    }
    const payment = await checkout({
      payment: {
        amount,
        currency,
        description: `DevConnect course: ${course.title}`,
        paymentMode: 'UPI',
        idempotencyKey: `course-${course.id}-${Date.now()}`,
      },
      simulatedOutcome: 'SUCCESS',
    }).unwrap()
    await purchase({ courseId: course.id, paymentId: payment.id }).unwrap()
    refetch()
  }

  async function handleWatch() {
    if (!course) return
    if (!isPaid || course.purchased) {
      if (isPaid === false) await enrollFree(course.id).unwrap().catch(() => {})
      navigate(`/learning-streams/${course.id}/watch`)
    }
  }

  if (isLoading || !course) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    )
  }

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-6">
      <div className="relative rounded-2xl overflow-hidden border border-[#2d2e3e] bg-[#161722]">
        <div className="h-48 sm:h-56 bg-gradient-to-r from-violet-900/40 to-indigo-900/30"
          style={course.bannerUrl ? { backgroundImage: `url(${course.bannerUrl})`, backgroundSize: 'cover' } : undefined} />
        <div className="p-6 -mt-8 relative">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-violet-400 font-semibold mb-1 capitalize">{course.difficulty.toLowerCase()} · {course.pricingType}</p>
              <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
              <p className="text-sm text-[#8b8ca8] mb-4">{course.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#8b8ca8]">
                <span className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" />{course.averageRating.toFixed(1)} ({course.ratingCount})</span>
                <span className="flex items-center gap-1"><Users size={12} />{course.enrolledCount} students</span>
                <span className="flex items-center gap-1"><Clock size={12} />{formatDuration(course.totalDurationSeconds)}</span>
                <span>{course.sections.reduce((n, s) => n + s.lessons.length, 0)} lessons</span>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <img src={avatarUrl(course.mentorDisplayName, 40)} alt="" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="text-sm font-semibold text-white">{course.mentorDisplayName}</p>
                  <button type="button" onClick={() => course.followingMentor ? unfollow(course.mentorId) : follow(course.mentorId)}
                    className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 mt-0.5">
                    <UserPlus size={10} /> {course.followingMentor ? 'Following' : 'Follow mentor'}
                  </button>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-72 shrink-0 bg-[#12131c] border border-[#2d2e3e] rounded-xl p-4 h-fit">
              {isPaid && !course.purchased ? (
                <>
                  <p className="text-2xl font-bold text-white">₹{(price / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  {course.discountPriceCents && <p className="text-xs text-[#5c5d72] line-through">₹{(course.priceCents / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>}
                  <button type="button" onClick={() => handleBuy().catch((e) => alert(extractApiError(e)))}
                    className="w-full mt-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold py-2.5 rounded-lg">Buy Now</button>
                  <button type="button" onClick={() => addToCart(course.id)}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 border border-[#2d2e3e] text-[#8b8ca8] hover:text-white text-xs font-bold py-2 rounded-lg">
                    <ShoppingCart size={13} /> Add to Cart
                  </button>
                  {previewLesson && (
                    <button type="button" onClick={() => navigate(`/learning-streams/${course.id}/watch?lessonId=${previewLesson.id}`)}
                      className="w-full mt-2 flex items-center justify-center gap-1.5 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold py-2 rounded-lg">
                      <Play size={13} /> Watch free preview
                    </button>
                  )}
                </>
              ) : (
                <button type="button" onClick={handleWatch}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-2">
                  <Play size={14} /> {course.purchased || course.watchProgressPercent > 0 ? 'Continue Learning' : 'Watch Now'}
                </button>
              )}
              <button type="button" onClick={() => course.saved ? unsaveCourse(course.id) : saveCourse(course.id)}
                className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs text-[#8b8ca8] hover:text-amber-400 py-2">
                <Bookmark size={13} /> {course.saved ? 'Saved' : 'Save for later'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {course.whatYouLearn && (
        <section className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-3">What you&apos;ll learn</h2>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs text-[#a5a6bb]">
            {course.whatYouLearn.split('\n').filter(Boolean).map((line) => (
              <li key={line} className="flex gap-2"><span className="text-emerald-400">✓</span>{line}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-4">Course content</h2>
        <div className="space-y-4">
          {course.sections.map((section) => (
            <div key={section.id}>
              <p className="text-xs font-bold text-violet-300 mb-2">{section.title}</p>
              <div className="space-y-1">
                {section.lessons.map((lesson) => {
                  const playable = !lesson.locked && lesson.videoUrl
                  const goToLesson = () => {
                    if (!playable) return
                    navigate(`/learning-streams/${course.id}/watch?lessonId=${lesson.id}`)
                  }
                  return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={goToLesson}
                    disabled={!playable}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs text-left ${lesson.locked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#1c1d2a] cursor-pointer'}`}
                  >
                    <span className="flex items-center gap-2 text-[#8b8ca8]">
                      {lesson.locked ? <Lock size={12} className="text-amber-400" /> : <Play size={12} />}
                      {lesson.title}
                      {lesson.previewFree && <span className="text-[9px] text-emerald-400">Preview</span>}
                    </span>
                    <span className="text-[#5c5d72]">{Math.ceil(lesson.durationSeconds / 60)}m</span>
                  </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        {!canWatch && (
          <div className="mt-4 text-center py-6 border border-dashed border-violet-500/30 rounded-xl bg-violet-500/5">
            <Lock size={24} className="text-violet-400 mx-auto mb-2" />
            <p className="text-sm text-white font-semibold">Premium content locked</p>
            <p className="text-xs text-[#8b8ca8] mt-1">Purchase to unlock all lessons{previewLesson ? ' — preview the first free lesson below' : ''}</p>
          </div>
        )}
      </section>

      {course.relatedCourses.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-white mb-3">Related courses</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.relatedCourses.map((c) => (
              <StreamCourseCardView key={c.id} course={c} onWatch={() => navigate(`/learning-streams/${c.id}/watch`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
