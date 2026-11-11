import { useState } from 'react'
import { Bookmark, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useListBookmarkedEventsQuery,
  useRegisterForEventMutation,
} from '../api/eventsApi'
import { EventCard } from '../components/events/EventCard'
import { EventPaymentModal } from '../components/events/EventPaymentModal'
import { extractApiError } from '../lib/extractApiError'
import type { CommunityEvent } from '../api/types'

export function SavedEventsPage() {
  const { data: events, isLoading } = useListBookmarkedEventsQuery()
  const [registerForEvent] = useRegisterForEventMutation()
  const [paymentEvent, setPaymentEvent] = useState<CommunityEvent | null>(null)
  const [registeringId, setRegisteringId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleRegister(event: CommunityEvent) {
    if (event.registeredByMe) {
      showToast('You are already registered for this event', 'error')
      return
    }
    if (event.paid) {
      setPaymentEvent(event)
      return
    }
    setRegisteringId(event.id)
    try {
      await registerForEvent(event.id).unwrap()
      showToast(`Successfully registered for ${event.title}`, 'success')
    } catch (err) {
      showToast(extractApiError(err), 'error')
    } finally {
      setRegisteringId(null)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-sm px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
            toast.type === 'success'
              ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#6366f1]/20 flex items-center justify-center">
          <Bookmark className="w-5 h-5 text-[#818cf8]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Saved Events</h1>
          <Link to="/events" className="text-xs text-[#818cf8] hover:text-white">
            ← Back to events
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={22} className="animate-spin text-[#818cf8]" />
        </div>
      ) : !events?.length ? (
        <div className="text-center py-20 dc-glass-card rounded-2xl">
          <Bookmark className="w-10 h-10 text-[#3d3e52] mx-auto mb-3" />
          <p className="text-white font-medium">No saved events yet</p>
          <p className="text-sm text-[#8b8ca8] mt-1">Bookmark events to find them here later.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onRegister={handleRegister}
              registering={registeringId === event.id}
            />
          ))}
        </div>
      )}

      {paymentEvent && (
        <EventPaymentModal
          event={paymentEvent}
          onClose={() => setPaymentEvent(null)}
          onSuccess={(title) => {
            setPaymentEvent(null)
            showToast(`Successfully registered for ${title}`, 'success')
          }}
        />
      )}
    </div>
  )
}
