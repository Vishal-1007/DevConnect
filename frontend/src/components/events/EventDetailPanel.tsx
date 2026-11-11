import { useState } from 'react'
import {
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  Lock,
  MapPin,
  Mic2,
  Monitor,
  Users,
} from 'lucide-react'
import {
  useGetEventQuery,
  useRegisterForEventMutation,
  useUnregisterFromEventMutation,
} from '../../api/eventsApi'
import type { CommunityEvent } from '../../api/types'
import {
  categoryLabels,
  defaultEventThumbnail,
  formatLabels,
  typeLabels,
} from '../../data/eventsData'
import { avatarUrl } from '../../lib/avatar'
import {
  formatEventCountdown,
  formatEventDateTime,
  formatEventDuration,
  formatInr,
} from '../../lib/formatTime'
import { EventPaymentModal } from './EventPaymentModal'

interface EventDetailPanelProps {
  event: CommunityEvent
}

export function EventDetailPanel({ event: initialEvent }: EventDetailPanelProps) {
  const { data: event = initialEvent } = useGetEventQuery(initialEvent.id)
  const [register, { isLoading: registering }] = useRegisterForEventMutation()
  const [unregister, { isLoading: unregistering }] = useUnregisterFromEventMutation()
  const [showPayment, setShowPayment] = useState(false)

  const busy = registering || unregistering
  const typeLabel = typeLabels[event.eventType] ?? event.eventType
  const categoryLabel = categoryLabels[event.category] ?? event.category
  const formatLabel = formatLabels[event.format] ?? event.format
  const isPast = new Date(event.endsAt).getTime() < Date.now()
  const countdown = !isPast ? formatEventCountdown(event.startsAt) : null
  const canJoin = event.registeredByMe && event.hasAccess !== false && !event.locked
  const thumbnail = event.thumbnailUrl ?? defaultEventThumbnail(event.category, event.eventType)

  async function handleToggleRegister() {
    if (busy || isPast) return
    if (event.registeredByMe) {
      await unregister(event.id)
      return
    }
    if (event.paid) {
      setShowPayment(true)
      return
    }
    await register(event.id)
  }

  return (
    <>
      <article className="dc-glass-card rounded-2xl overflow-hidden sticky top-6">
        <div className="relative aspect-[16/7]">
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161722] via-[#161722]/40 to-transparent" />
        </div>

        <div className="p-6 -mt-8 relative">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#6366f1]/15 text-[#a5b4fc] border border-[#6366f1]/25">
              {typeLabel}
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#0b0c14] text-[#8b8ca8] border border-[#2d2e3e]">
              {categoryLabel}
            </span>
            {isPast && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#2d2e3e] text-[#8b8ca8]">
                Ended
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-white">{event.title}</h2>
          <p className="text-sm text-[#b4b5c8] mt-3 leading-relaxed whitespace-pre-wrap">{event.description}</p>

          {event.topicsCovered && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-wide text-[#5c5d72] font-semibold mb-1">Topics covered</p>
              <p className="text-sm text-[#e2e8f0] whitespace-pre-wrap">{event.topicsCovered}</p>
            </div>
          )}

          {event.requirements && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wide text-[#5c5d72] font-semibold mb-1">Requirements</p>
              <p className="text-sm text-[#e2e8f0] whitespace-pre-wrap">{event.requirements}</p>
            </div>
          )}

          <div className="mt-5 space-y-2 text-sm text-[#e2e8f0]">
            <div className="flex items-start gap-2">
              <Calendar size={16} className="text-[#818cf8] mt-0.5 shrink-0" />
              <div>
                <p>{formatEventDateTime(event.startsAt)}</p>
                <p className="text-xs text-[#8b8ca8]">Duration: {formatEventDuration(event.startsAt, event.endsAt)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              {event.format === 'online' ? (
                <Monitor size={16} className="text-[#818cf8] mt-0.5 shrink-0" />
              ) : (
                <MapPin size={16} className="text-[#818cf8] mt-0.5 shrink-0" />
              )}
              <div>
                <p>{formatLabel}</p>
                {event.locked ? (
                  <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                    <Lock size={12} />
                    Premium event — complete payment to access meeting link
                  </p>
                ) : event.locationOrLink ? (
                  <p className="text-xs text-[#8b8ca8] break-all">{event.locationOrLink}</p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#818cf8] shrink-0" />
              <span>
                {event.attendeeCount} / {event.maxAttendees} registered
              </span>
            </div>
            {event.paid && (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#818cf8] shrink-0" />
                <span className="font-semibold text-white">{formatInr(event.priceInr ?? 0)}</span>
              </div>
            )}
          </div>

          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[#0b0c14] text-[#8b8ca8] border border-[#2d2e3e]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#2d2e3e]/60">
            <img src={avatarUrl(event.hostDisplayName, 40)} alt="" className="w-10 h-10 rounded-full" />
            <div>
              <p className="text-sm font-medium text-white">{event.hostDisplayName}</p>
              <p className="text-xs text-[#8b8ca8]">{event.hostRole ?? 'Event host'}</p>
            </div>
          </div>

          {event.speakers?.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-wide text-[#5c5d72] font-semibold mb-2 flex items-center gap-1">
                <Mic2 size={11} />
                Speakers
              </p>
              <div className="space-y-2">
                {event.speakers.map((speaker) => (
                  <div key={speaker.userId} className="flex items-center gap-2">
                    <img src={avatarUrl(speaker.displayName, 28)} alt="" className="w-7 h-7 rounded-full" />
                    <div>
                      <p className="text-xs font-medium text-white">{speaker.displayName}</p>
                      <p className="text-[10px] text-[#8b8ca8]">{speaker.role ?? 'Speaker'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2">
            {!isPast && (
              <button
                type="button"
                disabled={busy || (event.full && !event.registeredByMe)}
                onClick={handleToggleRegister}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  event.registeredByMe
                    ? 'border border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:border-[#6366f1]/40'
                    : 'dc-gradient-btn text-white disabled:opacity-50'
                }`}
              >
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Updating…
                  </span>
                ) : event.registeredByMe ? (
                  'Cancel registration'
                ) : event.full ? (
                  'Event full'
                ) : event.paid ? (
                  `Register ${formatInr(event.priceInr ?? 0)}`
                ) : (
                  'Register Free'
                )}
              </button>
            )}

            {countdown && event.registeredByMe && (
              <p className="text-xs text-center text-[#8b8ca8]">
                Starts in: <span className="text-white font-medium">{countdown}</span>
              </p>
            )}

            {canJoin && event.locationOrLink?.startsWith('http') && !isPast && (
              <a
                href={event.locationOrLink}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-[#6366f1]/40 text-[#a5b4fc] text-sm hover:bg-[#6366f1]/10 transition-colors"
              >
                <ExternalLink size={15} />
                Join event
              </a>
            )}
          </div>
        </div>
      </article>

      {showPayment && (
        <EventPaymentModal
          event={event}
          onClose={() => setShowPayment(false)}
          onSuccess={() => setShowPayment(false)}
        />
      )}
    </>
  )
}
