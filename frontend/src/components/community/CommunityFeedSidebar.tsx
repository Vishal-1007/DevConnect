import { Calendar, Star, Trophy, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useListEventsQuery } from '../../api/eventsApi'
import { useGetLeaderboardQuery } from '../../api/leaderboardApi'
import type { CommunityPost } from '../../api/types'
import { developerBadge } from '../../data/communityData'
import { avatarUrl } from '../../lib/avatar'
import { formatEventDateTime } from '../../lib/formatTime'
import { useFollowedAuthors } from '../../lib/communityFollows'

interface CommunityFeedSidebarProps {
  posts: CommunityPost[]
}

export function CommunityFeedSidebar({ posts }: CommunityFeedSidebarProps) {
  const { isFollowing, toggleFollow } = useFollowedAuthors()
  const { data: leaderboard } = useGetLeaderboardQuery({ period: 'monthly', category: 'overall' })
  const { data: events } = useListEventsQuery({ when: 'upcoming', limit: 4 })

  const suggested = [...posts]
    .filter((p, i, arr) => arr.findIndex((x) => x.authorId === p.authorId) === i)
    .slice(0, 4)

  const topContributors = leaderboard?.entries.slice(0, 5) ?? []

  return (
    <aside className="w-full xl:w-80 shrink-0 space-y-4">
      <div className="dc-glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={16} className="text-amber-400" />
          <h3 className="text-sm font-bold text-white">Top Developers</h3>
        </div>
        <div className="space-y-3">
          {topContributors.length === 0 ? (
            <p className="text-xs text-[#8b8ca8]">No leaderboard data yet.</p>
          ) : (
            topContributors.map((entry, idx) => {
              const badge = developerBadge(entry.points)
              return (
                <div key={entry.userId} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-[#5c5d72] w-4">{idx + 1}</span>
                  <img src={avatarUrl(entry.displayName, 32)} alt="" className="w-8 h-8 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{entry.displayName}</p>
                    <p className="text-[10px] text-[#8b8ca8] truncate">{entry.role ?? 'Developer'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-amber-400 flex items-center gap-0.5 justify-end">
                      <Star size={10} className="fill-amber-400" />
                      {entry.points.toLocaleString()}
                    </p>
                    <p className={`text-[9px] ${badge.color}`}>{badge.label}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="dc-glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-[#818cf8]" />
          <h3 className="text-sm font-bold text-white">Upcoming Events</h3>
        </div>
        <div className="space-y-3">
          {(events ?? []).slice(0, 3).map((event) => (
            <div key={event.id} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 flex items-center justify-center shrink-0">
                <Calendar size={14} className="text-[#818cf8]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white line-clamp-1">{event.title}</p>
                <p className="text-[10px] text-[#8b8ca8]">{event.hostDisplayName}</p>
                <p className="text-[10px] text-[#5c5d72]">{formatEventDateTime(event.startsAt)}</p>
                <Link
                  to={`/events/${event.id}`}
                  className="inline-block mt-1.5 text-[10px] font-semibold text-[#818cf8] hover:text-white"
                >
                  Register →
                </Link>
              </div>
            </div>
          ))}
          {(!events || events.length === 0) && (
            <p className="text-xs text-[#8b8ca8]">No upcoming events.</p>
          )}
        </div>
        <Link to="/events" className="block mt-3 text-center text-[10px] text-[#818cf8] hover:text-white">
          View all events
        </Link>
      </div>

      <div className="dc-glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={16} className="text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Suggested Connections</h3>
        </div>
        <div className="space-y-3">
          {suggested.map((post) => (
            <div key={post.authorId} className="flex items-center gap-3">
              <img src={avatarUrl(post.authorDisplayName, 32)} alt="" className="w-8 h-8 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{post.authorDisplayName}</p>
                <p className="text-[10px] text-[#8b8ca8] truncate">{post.authorRole ?? 'Developer'}</p>
                {post.tags[0] && (
                  <span className="text-[9px] text-violet-300">#{post.tags[0]}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleFollow(post.authorId)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                  isFollowing(post.authorId)
                    ? 'border-[#6366f1]/50 text-[#a5b4fc] bg-[#6366f1]/10'
                    : 'border-[#6366f1]/40 text-[#a5b4fc] hover:bg-[#6366f1]/10'
                }`}
              >
                {isFollowing(post.authorId) ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
          {suggested.length === 0 && (
            <p className="text-xs text-[#8b8ca8]">More connections appear as the feed grows.</p>
          )}
        </div>
      </div>
    </aside>
  )
}
