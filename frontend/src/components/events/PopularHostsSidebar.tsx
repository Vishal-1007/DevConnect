import { Crown, Loader2, Star, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useListPopularHostsQuery } from '../../api/eventsApi'
import { avatarUrl } from '../../lib/avatar'

export function PopularHostsSidebar() {
  const { data: hosts, isLoading } = useListPopularHostsQuery(5)

  return (
    <aside className="dc-glass-card rounded-2xl p-4">
      <h3 className="text-sm font-bold text-white mb-4">Popular Hosts</h3>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={18} className="animate-spin text-[#818cf8]" />
        </div>
      ) : !hosts?.length ? (
        <p className="text-xs text-[#8b8ca8] text-center py-6">No hosts yet</p>
      ) : (
        <ul className="space-y-3">
          {hosts.map((host) => (
            <li key={host.userId} className="flex items-center gap-3">
              <img
                src={avatarUrl(host.displayName, 40)}
                alt=""
                className="w-10 h-10 rounded-full border border-[#2d2e3e] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{host.displayName}</p>
                <p className="text-[10px] text-[#8b8ca8] truncate">
                  {host.role} {host.company ? `@ ${host.company}` : ''}
                </p>
                <p className="text-[10px] text-amber-400 flex items-center gap-0.5 mt-0.5">
                  <Star size={10} className="fill-amber-400" />
                  {host.rating.toFixed(1)} · {host.eventsHosted} events
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border border-[#6366f1]/30 text-[#a5b4fc] hover:bg-[#6366f1]/10 transition-colors"
              >
                <UserPlus size={11} />
                Follow
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 pt-4 border-t border-[#2d2e3e]/60">
        <div className="rounded-xl bg-gradient-to-br from-[#6366f1]/10 to-[#7c3aed]/5 border border-[#6366f1]/20 p-4 text-center">
          <Crown className="w-6 h-6 text-[#818cf8] mx-auto mb-2" />
          <p className="text-xs font-semibold text-white mb-1">Host your own event</p>
          <p className="text-[10px] text-[#8b8ca8] mb-3">Share knowledge and earn with DevConnect</p>
          <Link
            to="/mentor"
            className="inline-flex items-center justify-center w-full py-2 rounded-lg dc-gradient-btn text-white text-xs font-semibold"
          >
            + Host Event
          </Link>
        </div>
      </div>
    </aside>
  )
}
