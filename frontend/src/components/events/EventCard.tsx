import { Bookmark, Calendar, Clock, Loader2, MapPin, Monitor, Star, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CommunityEvent } from '../../api/types'
import {
  categoryLabels,
  defaultEventThumbnail,
  formatLabels,
  typeBadgeColors,
  typeLabels,
} from '../../data/eventsData'
import { avatarUrl } from '../../lib/avatar'
import { formatEventDateTime, formatEventDuration, formatInr } from '../../lib/formatTime'
import { useToggleEventBookmarkMutation } from '../../api/eventsApi'

interface EventCardProps {
  event: CommunityEvent
  onRegister?: (event: CommunityEvent) => void
  registering?: boolean
}

export function EventCard({ event, onRegister, registering }: EventCardProps) {
  const [toggleBookmark, { isLoading: bookmarking }] = useToggleEventBookmarkMutation()
  const typeLabel = typeLabels[event.eventType] ?? event.eventType
  const typeColor = typeBadgeColors[event.eventType] ?? typeBadgeColors.webinar
  const categoryLabel = categoryLabels[event.category] ?? event.category
  const formatLabel = formatLabels[event.format] ?? event.format
  const spotsLeft = event.maxAttendees - event.attendeeCount
  const thumbnail = event.thumbnailUrl ?? defaultEventThumbnail(event.category, event.eventType)
  const isPast = new Date(event.endsAt).getTime() < Date.now()

  async function handleBookmark(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (bookmarking) return
    await toggleBookmark(event.id)
  }

  function handleRegister(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isPast && onRegister) onRegister(event)
  }

  return (
    <Link
      to={`/events/${event.id}`}
      className="group block rounded-2xl dc-glass-card dc-event-card-hover overflow-hidden"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={thumbnail}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c14]/90 via-transparent to-transparent" />
        <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColor}`}>
          {typeLabel}
        </span>
        <button
          type="button"
          onClick={handleBookmark}
          className={`absolute top-3 right-3 p-1.5 rounded-lg backdrop-blur-sm transition-colors ${
            event.bookmarkedByMe
              ? 'bg-[#6366f1]/40 text-white'
              : 'bg-black/40 text-white/80 hover:text-white hover:bg-[#6366f1]/30'
          }`}
          aria-label={event.bookmarkedByMe ? 'Remove bookmark' : 'Save event'}
        >
          <Bookmark size={14} className={event.bookmarkedByMe ? 'fill-current' : ''} />
        </button>
        {event.featured && (
          <span className="absolute bottom-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Featured
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#0b0c14] text-[#8b8ca8] border border-[#2d2e3e]">
            {categoryLabel}
          </span>
          {event.registeredByMe && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Registered
            </span>
          )}
        </div>

        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-[#a5b4fc] transition-colors">
          {event.title}
        </h3>
        <p className="text-xs text-[#8b8ca8] mt-1.5 line-clamp-2">{event.description}</p>

        <div className="mt-3 space-y-1 text-[11px] text-[#b4b5c8]">
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-[#818cf8] shrink-0" />
            <span>{formatEventDateTime(event.startsAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-[#818cf8] shrink-0" />
            <span>{formatEventDuration(event.startsAt, event.endsAt)}</span>
            <span className="text-[#5c5d72]">·</span>
            {event.format === 'online' ? (
              <Monitor size={12} className="text-[#818cf8] shrink-0" />
            ) : (
              <MapPin size={12} className="text-[#818cf8] shrink-0" />
            )}
            <span>{formatLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={12} className="text-[#818cf8] shrink-0" />
            <span>
              {event.attendeeCount}/{event.maxAttendees} registered
              {event.full ? ' · Full' : spotsLeft <= 10 && spotsLeft > 0 ? ` · ${spotsLeft} left` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2d2e3e]/60">
          <div className="flex items-center gap-2 min-w-0">
            <img src={avatarUrl(event.hostDisplayName, 28)} alt="" className="w-7 h-7 rounded-full shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-white font-medium truncate">{event.hostDisplayName}</p>
              <p className="text-[10px] text-[#8b8ca8] truncate flex items-center gap-1">
                {event.hostRole ?? 'Mentor'}
                {event.hostRating != null && (
                  <>
                    <Star size={9} className="text-amber-400 fill-amber-400 shrink-0" />
                    {event.hostRating.toFixed(1)}
                  </>
                )}
              </p>
            </div>
          </div>

          {!isPast && (
            <button
              type="button"
              onClick={handleRegister}
              disabled={(event.full && !event.registeredByMe) || registering}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                event.registeredByMe
                  ? 'border border-emerald-500/30 text-emerald-400'
                  : event.paid
                    ? 'dc-gradient-btn text-white disabled:opacity-50'
                    : 'border border-[#6366f1]/40 text-[#a5b4fc] hover:bg-[#6366f1]/10 disabled:opacity-50'
              }`}
            >
              {registering ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Registering…
                </>
              ) : event.registeredByMe ? (
                'Registered ✓'
              ) : event.full ? (
                'Full'
              ) : event.paid ? (
                `Register ${formatInr(event.priceInr ?? 0)}`
              ) : (
                'Register Free'
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
