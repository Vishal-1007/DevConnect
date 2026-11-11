import { Radio, Users } from 'lucide-react'
import type { VideoRoom } from '../../api/types'
import { categoryLabels } from '../../data/videoRoomsData'
import { avatarUrl } from '../../lib/avatar'
import { formatRelativeTime } from '../../lib/formatTime'

interface VideoRoomCardProps {
  room: VideoRoom
  active?: boolean
  onSelect: () => void
}

export function VideoRoomCard({ room, active, onSelect }: VideoRoomCardProps) {
  const categoryLabel = categoryLabels[room.category] ?? room.category
  const spotsLeft = room.maxParticipants - room.participantCount
  const isLive = room.status === 'live'

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-5 transition-colors ${
        active
          ? 'border-[#6366f1] bg-[#6366f1]/10'
          : 'border-[#2d2e3e] bg-[#161722] hover:border-[#6366f1]/40'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {isLive && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
            <Radio size={10} className="animate-pulse" />
            Live
          </span>
        )}
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#a5b4fc] border border-[#6366f1]/25">
          {categoryLabel}
        </span>
        {room.joinedByMe && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Joined
          </span>
        )}
      </div>

      <h3 className="font-semibold text-white text-base leading-snug">{room.title}</h3>
      <p className="text-xs text-[#8b8ca8] mt-1 line-clamp-2">{room.description}</p>

      <div className="mt-4 space-y-1.5 text-xs text-[#b4b5c8]">
        <div className="flex items-center gap-2">
          <Users size={13} className="text-[#818cf8] shrink-0" />
          <span>
            {room.participantCount}/{room.maxParticipants} in room
            {room.full ? ' · Full' : spotsLeft <= 3 ? ` · ${spotsLeft} spots left` : ''}
          </span>
        </div>
        <p className="text-[#8b8ca8]">Started {formatRelativeTime(room.createdAt)}</p>
      </div>

      {room.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {room.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-[#0b0c14] text-[#8b8ca8] border border-[#2d2e3e]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#2d2e3e]">
        <img src={avatarUrl(room.hostDisplayName, 28)} alt="" className="w-7 h-7 rounded-full" />
        <span className="text-xs text-[#8b8ca8]">
          Hosted by <span className="text-white font-medium">{room.hostDisplayName}</span>
        </span>
      </div>
    </button>
  )
}
