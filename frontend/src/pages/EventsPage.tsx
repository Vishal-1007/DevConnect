import { useMemo, useState } from 'react'

import { CalendarDays, Loader2, Plus, Search, Video } from 'lucide-react'

import { Link } from 'react-router-dom'

import {

  useGetEventStatsQuery,

  useListEventsQuery,

  useRegisterForEventMutation,

} from '../api/eventsApi'

import { EventCard } from '../components/events/EventCard'

import { EventPaymentModal } from '../components/events/EventPaymentModal'

import { MyRegistrationsSidebar } from '../components/events/MyRegistrationsSidebar'

import { PopularHostsSidebar } from '../components/events/PopularHostsSidebar'

import { EVENT_CATEGORIES, EVENT_TYPES } from '../data/eventsData'

import { extractApiError } from '../lib/extractApiError'

import type { CommunityEvent } from '../api/types'



export function EventsPage() {

  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming')

  const [category, setCategory] = useState('all')

  const [eventType, setEventType] = useState('all')

  const [searchInput, setSearchInput] = useState('')

  const [searchQuery, setSearchQuery] = useState('')

  const [paymentEvent, setPaymentEvent] = useState<CommunityEvent | null>(null)

  const [registeringId, setRegisteringId] = useState<string | null>(null)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)



  const { data: events, isLoading, isFetching, error } = useListEventsQuery({

    when,

    category,

    type: eventType,

    q: searchQuery || undefined,

  })

  const { data: stats } = useGetEventStatsQuery()

  const [registerForEvent] = useRegisterForEventMutation()



  const statCards = useMemo(

    () => [

      { label: 'Upcoming', value: stats?.upcomingEvents ?? 0, color: 'text-[#818cf8]', icon: CalendarDays },

      { label: 'Your Registrations', value: stats?.myRegistrations ?? 0, color: 'text-emerald-400', icon: CalendarDays },

      { label: 'Online Events', value: stats?.onlineEvents ?? 0, color: 'text-blue-400', icon: Video },

      { label: 'Past Events', value: stats?.pastEvents ?? 0, color: 'text-amber-400', icon: CalendarDays },

    ],

    [stats]

  )



  function showToast(message: string, type: 'success' | 'error') {

    setToast({ message, type })

    setTimeout(() => setToast(null), 4000)

  }



  function handleSearch(e: React.FormEvent) {

    e.preventDefault()

    setSearchQuery(searchInput.trim())

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



  const inputClass =

    'w-full px-3 rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]'



  return (

    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">

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



      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">

        <div className="flex items-start gap-3">

          <div className="w-11 h-11 rounded-xl bg-[#6366f1]/20 flex items-center justify-center shrink-0">

            <CalendarDays className="w-5 h-5 text-[#818cf8]" />

          </div>

          <div>

            <h1 className="text-2xl font-bold text-white">Events</h1>

            <p className="text-sm text-[#8b8ca8] mt-1 max-w-xl">

              Discover webinars, workshops, hackathons, and meetups — register and join the DevConnect community live.

            </p>

          </div>

        </div>

        <Link

          to="/mentor"

          className="flex items-center gap-2 px-4 py-2.5 rounded-xl dc-gradient-btn text-white text-sm font-semibold hover:opacity-90 transition-opacity"

        >

          <Plus size={16} />

          Host Event

        </Link>

      </div>



      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

        {statCards.map((s) => (

          <div key={s.label} className="dc-glass-card rounded-2xl p-4 text-center">

            <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />

            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>

            <p className="text-[10px] uppercase tracking-wide text-[#8b8ca8] mt-1">{s.label}</p>

          </div>

        ))}

      </div>



      <div className="flex flex-col xl:flex-row gap-6">

        <div className="flex-1 min-w-0">

          <div className="flex flex-wrap gap-2 mb-3">

            {(['upcoming', 'past'] as const).map((w) => (

              <button

                key={w}

                type="button"

                onClick={() => setWhen(w)}

                className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-colors ${

                  when === w

                    ? 'dc-gradient-btn text-white'

                    : 'dc-glass-card text-[#8b8ca8] hover:text-white'

                }`}

              >

                {w}

              </button>

            ))}

          </div>



          <div className="flex flex-wrap gap-2 mb-3">

            {EVENT_TYPES.map((t) => (

              <button

                key={t.id}

                type="button"

                onClick={() => setEventType(t.id)}

                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${

                  eventType === t.id

                    ? 'bg-[#6366f1]/25 text-white border border-[#6366f1]/50'

                    : 'bg-[#161722]/60 text-[#8b8ca8] border border-[#2d2e3e] hover:text-white'

                }`}

              >

                {t.label}

              </button>

            ))}

          </div>



          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-4">

            <div className="relative flex-1">

              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />

              <input

                value={searchInput}

                onChange={(e) => setSearchInput(e.target.value)}

                placeholder="Search by title, technology, or host…"

                className={`${inputClass} h-11 pl-9`}

              />

            </div>

            <select

              value={category}

              onChange={(e) => setCategory(e.target.value)}

              className={`${inputClass} h-11 sm:w-44`}

            >

              {EVENT_CATEGORIES.map((c) => (

                <option key={c.id} value={c.id}>{c.label}</option>

              ))}

            </select>

            <button

              type="submit"

              className="h-11 px-5 rounded-xl dc-gradient-btn text-white text-sm font-semibold shrink-0"

            >

              Search

            </button>

          </form>



          {error && (

            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">

              <p className="text-sm text-red-300">{extractApiError(error)}</p>

            </div>

          )}



          {isLoading && (

            <div className="flex items-center justify-center gap-2 py-20 text-[#8b8ca8]">

              <Loader2 size={22} className="animate-spin" />

              Loading events…

            </div>

          )}



          {!isLoading && events && events.length === 0 && (

            <div className="text-center py-20 dc-glass-card rounded-2xl">

              <CalendarDays className="w-12 h-12 text-[#6366f1] mx-auto mb-3 opacity-60" />

              <p className="text-white font-medium">No events found</p>

              <p className="text-sm text-[#8b8ca8] mt-1">

                {when === 'upcoming' ? 'Check back soon or host your own event.' : 'No past events match your filters.'}

              </p>

            </div>

          )}



          {events && events.length > 0 && (

            <>

              <div className="flex items-center gap-2 mb-4">

                <p className="text-xs text-[#8b8ca8]">

                  {events.length} event{events.length === 1 ? '' : 's'}

                </p>

                {isFetching && !isLoading && (

                  <Loader2 size={14} className="animate-spin text-[#8b8ca8]" />

                )}

              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">

                {events.map((event) => (

                  <EventCard

                    key={event.id}

                    event={event}

                    onRegister={handleRegister}

                    registering={registeringId === event.id}

                  />

                ))}

              </div>

            </>

          )}

        </div>



        <div className="w-full xl:w-80 shrink-0 space-y-4">

          <MyRegistrationsSidebar />

          <PopularHostsSidebar />

        </div>

      </div>



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


