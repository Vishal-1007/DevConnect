import { ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useGetEventQuery } from '../api/eventsApi'
import { EventDetailPanel } from '../components/events/EventDetailPanel'
import {
  categoryLabels,
  defaultEventThumbnail,
  typeLabels,
} from '../data/eventsData'
import { extractApiError } from '../lib/extractApiError'

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { data: event, isLoading, error } = useGetEventQuery(eventId!, { skip: !eventId })

  if (!eventId) {
    return <NavigateBack />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#8b8ca8] gap-2">
        <Loader2 size={22} className="animate-spin" />
        Loading event…
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <NavigateBack />
        <div className="mt-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error ? extractApiError(error) : 'Event not found'}
        </div>
      </div>
    )
  }

  const thumbnail = event.thumbnailUrl ?? defaultEventThumbnail(event.category, event.eventType)

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <NavigateBack />

      <div className="mt-4 grid lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-2xl overflow-hidden dc-glass-card">
            <img src={thumbnail} alt="" className="w-full aspect-[16/7] object-cover" />
          </div>

          <div className="dc-glass-card rounded-2xl p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#6366f1]/15 text-[#a5b4fc] border border-[#6366f1]/25">
                {typeLabels[event.eventType] ?? event.eventType}
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#0b0c14] text-[#8b8ca8] border border-[#2d2e3e]">
                {categoryLabels[event.category] ?? event.category}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">{event.title}</h1>
            <p className="text-sm text-[#b4b5c8] mt-4 leading-relaxed whitespace-pre-wrap">{event.description}</p>

            {event.topicsCovered && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-white mb-2">Topics covered</h2>
                <p className="text-sm text-[#b4b5c8] whitespace-pre-wrap">{event.topicsCovered}</p>
              </div>
            )}

            {event.requirements && (
              <div className="mt-5">
                <h2 className="text-sm font-semibold text-white mb-2">Requirements</h2>
                <p className="text-sm text-[#b4b5c8] whitespace-pre-wrap">{event.requirements}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <EventDetailPanel event={event} />
        </div>
      </div>
    </div>
  )
}

function NavigateBack() {
  return (
    <Link
      to="/events"
      className="inline-flex items-center gap-2 text-sm text-[#8b8ca8] hover:text-white transition-colors"
    >
      <ArrowLeft size={16} />
      Back to events
    </Link>
  )
}
