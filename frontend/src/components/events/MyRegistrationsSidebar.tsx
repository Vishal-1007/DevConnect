import { Calendar, ChevronRight, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useListMyRegistrationsQuery } from '../../api/eventsApi'
import { formatEventDateTime } from '../../lib/formatTime'
import { defaultEventThumbnail } from '../../data/eventsData'

export function MyRegistrationsSidebar() {
  const { data: registrations, isLoading } = useListMyRegistrationsQuery()
  const upcoming = (registrations ?? []).filter(
    (e) => new Date(e.endsAt).getTime() >= Date.now()
  )

  return (
    <aside className="dc-glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">My Registrations</h3>
        <Link to="/events/saved" className="text-[10px] text-[#818cf8] hover:text-white font-medium">
          Saved
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={18} className="animate-spin text-[#818cf8]" />
        </div>
      ) : upcoming.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-8 h-8 text-[#3d3e52] mx-auto mb-2" />
          <p className="text-xs text-[#8b8ca8]">No upcoming registrations</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {upcoming.slice(0, 5).map((event) => (
            <li key={event.id}>
              <Link
                to={`/events/${event.id}`}
                className="flex items-center gap-3 group rounded-xl p-2 -mx-2 hover:bg-[#6366f1]/5 transition-colors"
              >
                <img
                  src={event.thumbnailUrl ?? defaultEventThumbnail(event.category, event.eventType)}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#2d2e3e]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-[#a5b4fc]">
                    {event.title}
                  </p>
                  <p className="text-[10px] text-[#8b8ca8] mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {formatEventDateTime(event.startsAt)}
                  </p>
                </div>
                <ChevronRight size={14} className="text-[#5c5d72] group-hover:text-[#818cf8] shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {upcoming.length > 5 && (
        <Link
          to="/events"
          className="block text-center text-[10px] text-[#818cf8] hover:text-white mt-3 font-medium"
        >
          View all registrations
        </Link>
      )}
    </aside>
  )
}
