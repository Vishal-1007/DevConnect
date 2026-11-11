import { Link } from 'react-router-dom'
import {
  Star, Clock, Users, Bookmark, Heart, ShoppingCart, Play, Lock, Tag,
} from 'lucide-react'
import type { StreamCourseCard } from '../../api/learningStreamsApi'
import { avatarUrl } from '../../lib/avatar'

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m} min`
}

function formatPrice(cents: number, currency = 'INR') {
  if (currency === 'INR') return `₹${(cents / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  return `$${(cents / 100).toFixed(2)}`
}

interface Props {
  course: StreamCourseCard
  onSave?: () => void
  onCart?: () => void
  onBuy?: () => void
  onWatch?: () => void
}

export function StreamCourseCardView({ course, onSave, onCart, onBuy, onWatch }: Props) {
  const isPaid = course.pricingType === 'PAID'
  const price = course.discountPriceCents ?? course.priceCents
  const hasDiscount = isPaid && course.discountPriceCents != null && course.discountPriceCents < course.priceCents

  return (
    <article className="group bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden hover:border-violet-500/40 transition-all hover:shadow-lg hover:shadow-violet-500/5 flex flex-col h-full">
      <div className="relative aspect-video bg-[#1a1b26] overflow-hidden">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-600/30 to-indigo-900/40" />
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isPaid ? 'bg-amber-500/90 text-black' : 'bg-emerald-500/90 text-black'}`}>
            {isPaid ? 'Premium' : 'Free'}
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white capitalize">{course.difficulty.toLowerCase()}</span>
        </div>
        {course.watchProgressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2d2e3e]">
            <div className="h-full bg-violet-500" style={{ width: `${course.watchProgressPercent}%` }} />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-center gap-2">
          <img src={avatarUrl(course.mentorDisplayName, 24)} alt="" className="w-6 h-6 rounded-full ring-1 ring-violet-500/30" />
          <span className="text-[11px] text-[#8b8ca8] truncate">{course.mentorDisplayName}</span>
        </div>

        <Link to={`/learning-streams/${course.id}`} className="text-sm font-bold text-white hover:text-violet-300 line-clamp-2 leading-snug">
          {course.title}
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#8b8ca8]">
          <span className="flex items-center gap-0.5"><Star size={10} className="text-amber-400 fill-amber-400" />{course.averageRating.toFixed(1)}</span>
          <span className="flex items-center gap-0.5"><Users size={10} />{course.enrolledCount.toLocaleString()}</span>
          <span className="flex items-center gap-0.5"><Clock size={10} />{formatDuration(course.totalDurationSeconds)}</span>
          {(course.totalLessons ?? 0) > 0 && <span>{course.totalLessons} lessons</span>}
        </div>

        <div className="flex flex-wrap gap-1">
          {course.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-[#2d2e3e] text-[#8b8ca8]">#{t}</span>
          ))}
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div>
            {isPaid ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">{formatPrice(price, course.currency)}</span>
                {hasDiscount && <span className="text-[10px] text-[#5c5d72] line-through">{formatPrice(course.priceCents, course.currency)}</span>}
              </div>
            ) : (
              <span className="text-sm font-bold text-emerald-400">Free</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onSave && (
              <button type="button" onClick={onSave} className={`w-7 h-7 rounded-lg flex items-center justify-center ${course.saved ? 'text-amber-400 bg-amber-500/15' : 'text-[#5c5d72] hover:text-amber-400 hover:bg-[#2d2e3e]'}`}>
                <Bookmark size={12} />
              </button>
            )}
            {onCart && isPaid && !course.purchased && (
              <button type="button" onClick={onCart} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5c5d72] hover:text-violet-400 hover:bg-[#2d2e3e]">
                <ShoppingCart size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {course.purchased || !isPaid ? (
            <button type="button" onClick={onWatch} className="flex-1 flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold py-2 rounded-lg">
              <Play size={12} /> {course.watchProgressPercent > 0 ? 'Continue' : 'Watch Now'}
            </button>
          ) : (
            <>
              <button type="button" onClick={onBuy} className="flex-1 flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold py-2 rounded-lg">
                <Tag size={12} /> Buy Now
              </button>
              <Link to={`/learning-streams/${course.id}`} className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-[#2d2e3e] text-[11px] text-[#8b8ca8] hover:text-white">
                <Lock size={11} /> Preview
              </Link>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export function StreamCourseSkeleton() {
  return (
    <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-[#1a1b26]" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-[#2d2e3e] rounded w-1/3" />
        <div className="h-4 bg-[#2d2e3e] rounded w-full" />
        <div className="h-3 bg-[#2d2e3e] rounded w-2/3" />
        <div className="h-8 bg-[#2d2e3e] rounded w-full mt-4" />
      </div>
    </div>
  )
}

export function StreamEmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="col-span-full text-center py-16 bg-[#161722] border border-[#2d2e3e] rounded-xl">
      <Heart size={36} className="text-violet-400 mx-auto mb-3 opacity-60" />
      <p className="text-sm font-semibold text-white mb-1">{title}</p>
      <p className="text-xs text-[#8b8ca8] max-w-sm mx-auto">{subtitle}</p>
    </div>
  )
}
