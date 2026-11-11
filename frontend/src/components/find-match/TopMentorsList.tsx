import { Star } from 'lucide-react'
import { useListMentorsQuery } from '../../api/mentorApi'
import { topMentorsMock } from '../../data/mockData'
import { avatarUrl } from '../../lib/avatar'

export function TopMentorsList() {
  const { data: apiMentors } = useListMentorsQuery()

  const mentors =
    apiMentors && apiMentors.length > 0
      ? apiMentors.slice(0, 5).map((m) => ({
          id: m.userId,
          name: m.headline ?? 'Mentor',
          title: m.bio?.slice(0, 40) ?? 'Available mentor',
          rating: m.averageRating || 4.8,
          sessions: m.ratingCount || 0,
          online: m.available,
        }))
      : topMentorsMock

  return (
    <section className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4 h-fit">
      <h2 className="text-base font-semibold text-white mb-4">Top Mentors</h2>
      <ul className="space-y-4">
        {mentors.map((m) => (
          <li key={m.id} className="flex gap-3">
            <div className="relative shrink-0">
              <img
                src={avatarUrl(m.name, 40)}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              {m.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#161722]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{m.name}</p>
              <p className="text-xs text-[#8b8ca8] truncate">{m.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-xs text-[#b4b5c8]">{m.rating.toFixed(1)}</span>
                <span className="text-xs text-[#5c5d72]">· {m.sessions} sessions</span>
              </div>
            </div>
            {m.online && (
              <span className="text-[10px] font-semibold text-emerald-400 shrink-0">Online</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
