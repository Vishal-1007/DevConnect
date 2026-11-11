import { useNavigate } from 'react-router-dom'
import { useListVideoRoomsQuery } from '../../api/videoRoomsApi'
import { avatarUrl } from '../../lib/avatar'
import { formatRelativeTime } from '../../lib/formatTime'

interface QuickJoinRoomsProps {
  onJoinRoom?: (room: { id: string; title: string; tags: string[] }) => void
}

export function QuickJoinRooms({ onJoinRoom }: QuickJoinRoomsProps) {
  const navigate = useNavigate()
  const { data: rooms } = useListVideoRoomsQuery({ status: 'live', limit: 3 })
  const featured = rooms?.slice(0, 3) ?? []

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Quick Join Rooms</h2>
        <button
          type="button"
          onClick={() => navigate('/video-rooms')}
          className="text-sm text-[#6366f1] hover:text-[#818cf8] font-medium"
        >
          View All
        </button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {featured.map((room) => (
          <div
            key={room.id}
            className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4 hover:border-[#6366f1]/40 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-white text-sm">{room.title}</h3>
              <span className="text-xs text-[#8b8ca8]">
                {room.participantCount}/{room.maxParticipants}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {room.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[#6366f1]/20 text-[#a5b4fc] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <img src={avatarUrl(room.hostDisplayName, 24)} alt="" className="w-6 h-6 rounded-full" />
              <span className="text-xs text-[#8b8ca8]">
                {room.hostDisplayName} · {formatRelativeTime(room.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                <img
                  src={avatarUrl(room.hostDisplayName, 24)}
                  alt=""
                  className="w-6 h-6 rounded-full border-2 border-[#161722]"
                />
                {Array.from({ length: Math.min(Math.max(room.participantCount - 1, 0), 3) }).map(
                  (_, i) => (
                    <img
                      key={i}
                      src={avatarUrl(`Guest ${i}`, 24)}
                      alt=""
                      className="w-6 h-6 rounded-full border-2 border-[#161722]"
                    />
                  )
                )}
              </div>
              <button
                type="button"
                disabled={room.full}
                onClick={() =>
                  onJoinRoom?.({
                    id: room.id,
                    title: room.title,
                    tags: room.tags,
                  })
                }
                className="px-3 py-1.5 rounded-lg text-xs font-semibold dc-gradient-btn text-white hover:opacity-90 disabled:opacity-50"
              >
                {room.full ? 'Full' : 'Join Room'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
