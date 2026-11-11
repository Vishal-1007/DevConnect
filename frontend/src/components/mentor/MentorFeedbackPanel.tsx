/**
 * MentorFeedbackPanel — ratings, reviews, testimonials, and mentor replies.
 */
import { useState } from 'react'
import {
  Star, Loader2, MessageSquare, TrendingUp, Shield, X, Send, Quote, AlertTriangle, RefreshCw,
} from 'lucide-react'
import {
  useGetMentorReviewsSummaryQuery,
  useReplyToMentorReviewMutation,
  useToggleMentorReviewShowcaseMutation,
  type MentorReview,
} from '../../api/mentorWorkspaceApi'

function Av({ name, size = 34 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 flex items-center justify-center shrink-0 font-bold text-violet-300"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  )
}

function Stars({ rating, size = 10 }: { rating: number; size?: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-[#3d3e52]'} />
      ))}
    </div>
  )
}

function ReplyModal({ review, onClose }: { review: MentorReview; onClose: () => void }) {
  const [reply, setReply] = useState(review.mentorReply || `Thank you, ${review.learnerName}! I appreciate your feedback.`)
  const [sendReply, { isLoading }] = useReplyToMentorReviewMutation()

  const save = async () => {
    await sendReply({ reviewId: review.id, reply }).unwrap()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#161722] border border-[#2d2e3e] rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-[#2d2e3e] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Reply to {review.learnerName}</h3>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-[#8b8ca8] italic">&ldquo;{review.reviewText}&rdquo;</p>
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4}
            className="w-full bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-violet-500" />
          <button type="button" onClick={save} disabled={isLoading || !reply.trim()}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2">
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Post Reply
          </button>
        </div>
      </div>
    </div>
  )
}

export function MentorFeedbackPanel() {
  const { data, isLoading, isError, refetch } = useGetMentorReviewsSummaryQuery(undefined, {
    pollingInterval: 15_000,
  })
  const [toggleShowcase] = useToggleMentorReviewShowcaseMutation()
  const [replyReview, setReplyReview] = useState<MentorReview | null>(null)

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
        <AlertTriangle size={40} className="mx-auto text-amber-400 mb-3" />
        <p className="text-sm font-semibold text-white">Could not load reviews</p>
        <p className="text-xs text-[#5c5d72] mt-1 mb-4">Please retry. If this persists, restart mentor-service.</p>
        <button type="button" onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    )
  }

  const dist = data.ratingDistribution ?? { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
  const distValues = [5, 4, 3, 2, 1].map((star) => dist[String(star)] ?? 0)
  const maxDist = Math.max(...distValues, 1)
  const showcasedTestimonials = data.reviews.filter((r) => r.showcased)
  const hasReviews = data.totalReviews > 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Average Rating', value: data.averageRating.toFixed(1), sub: `${data.totalReviews} reviews`, icon: Star, color: 'text-amber-400' },
          { label: 'Visibility Boost', value: `+${data.visibilityBoostPct}%`, sub: 'Search ranking', icon: TrendingUp, color: 'text-violet-400' },
          { label: 'Trust Score', value: `${data.trustScorePct}%`, sub: 'Booking confidence', icon: Shield, color: 'text-emerald-400' },
          { label: 'Testimonials', value: String(data.totalTestimonials), sub: 'With written feedback', icon: Quote, color: 'text-cyan-400' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1"><Icon size={14} className={color} /><p className="text-[10px] text-[#5c5d72]">{label}</p></div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-[9px] text-[#5c5d72]">{sub}</p>
          </div>
        ))}
      </div>

      {data.improvementSuggestions.length > 0 && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
          <p className="text-xs font-bold text-white mb-2">Improvement Suggestions from Learners</p>
          <ul className="space-y-1">
            {data.improvementSuggestions.map((s) => (
              <li key={s} className="text-[11px] text-[#a5a6bb] flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showcasedTestimonials.length > 0 && (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
          <p className="text-xs font-bold text-white mb-3 flex items-center gap-2"><Quote size={14} className="text-cyan-400" /> Showcased Testimonials</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {showcasedTestimonials.map((t) => (
              <div key={t.id} className="bg-[#12131a] border border-cyan-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Av name={t.learnerName} size={24} />
                  <span className="text-[11px] font-semibold text-white">{t.learnerName}</span>
                  <Stars rating={t.rating} size={8} />
                </div>
                <p className="text-[10px] text-[#8b8ca8] italic line-clamp-2">&ldquo;{t.reviewText}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5 flex flex-col items-center">
          <p className="text-5xl font-black text-white">{data.averageRating.toFixed(1)}</p>
          <div className="flex my-2"><Stars rating={Math.round(data.averageRating)} size={18} /></div>
          <p className="text-xs text-[#5c5d72]">{data.totalReviews} reviews</p>
          <div className="w-full mt-4 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[10px] text-[#5c5d72] w-3">{star}</span>
                <Star size={9} className="text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 bg-[#1c1d2a] rounded-full h-1.5">
                  <div className="bg-amber-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${((dist[String(star)] ?? 0) / maxDist) * 100}%` }} />
                </div>
                <span className="text-[10px] text-[#5c5d72] w-3">{dist[String(star)] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          {!hasReviews ? (
            <div className="text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
              <Star size={40} className="mx-auto text-[#3d3e52] mb-3" />
              <p className="text-sm font-semibold text-white">No student feedback received yet</p>
              <p className="text-xs text-[#5c5d72] mt-1">Average Rating: 0 · Reviews: 0</p>
            </div>
          ) : data.reviews.map((r) => (
            <div key={r.id} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Av name={r.learnerName} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-white">{r.learnerName}</span>
                    <Stars rating={r.rating} />
                    {r.topic && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-[#2d2e3e] text-[#8b8ca8] border-[#3d3e52]">{r.topic}</span>
                    )}
                    {r.showcased && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-cyan-500/15 text-cyan-300 border-cyan-500/25">Testimonial</span>
                    )}
                    <span className="ml-auto text-[9px] text-[#5c5d72]">{r.createdAtLabel}</span>
                  </div>
                  <p className="text-xs text-[#8b8ca8] italic">&ldquo;{r.reviewText}&rdquo;</p>
                  {r.improvementSuggestion && (
                    <p className="text-[10px] text-violet-400 mt-1">Suggestion: {r.improvementSuggestion}</p>
                  )}
                  {r.mentorReply && (
                    <div className="mt-2 bg-[#12131a] border border-violet-500/20 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-violet-300 font-semibold mb-0.5">Your reply · {r.repliedAtLabel}</p>
                      <p className="text-[11px] text-[#a5a6bb]">{r.mentorReply}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <button type="button" onClick={() => setReplyReview(r)}
                      className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1">
                      <MessageSquare size={11} /> {r.mentorReply ? 'Edit reply' : 'Reply to review'}
                    </button>
                    <button type="button" onClick={() => toggleShowcase({ reviewId: r.id, showcased: !r.showcased }).unwrap()}
                      className={`text-[10px] flex items-center gap-1 ${r.showcased ? 'text-cyan-400' : 'text-[#5c5d72] hover:text-cyan-400'}`}>
                      <Quote size={11} /> {r.showcased ? 'Remove testimonial' : 'Showcase testimonial'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {replyReview && <ReplyModal review={replyReview} onClose={() => setReplyReview(null)} />}
    </div>
  )
}
