import { Loader2, Radio, Users, Video } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useGetVideoRoomQuery,
  useJoinVideoRoomMutation,
  useLeaveVideoRoomMutation,
} from '../../api/videoRoomsApi'
import type { VideoRoom } from '../../api/types'
import { categoryLabels } from '../../data/videoRoomsData'
import { avatarUrl } from '../../lib/avatar'
import { formatRelativeTime } from '../../lib/formatTime'

interface VideoRoomDetailPanelProps {
  room: VideoRoom
}

export function VideoRoomDetailPanel({ room: initialRoom }: VideoRoomDetailPanelProps) {
  const navigate = useNavigate()
  const { data: room = initialRoom } = useGetVideoRoomQuery(initialRoom.id, {
    pollingInterval: 5000,
  })
  const [joinRoom, { isLoading: joining }] = useJoinVideoRoomMutation()
  const [leaveRoom, { isLoading: leaving }] = useLeaveVideoRoomMutation()

  const busy = joining || leaving
  const categoryLabel = categoryLabels[room.category] ?? room.category
  const isLive = room.status === 'live'
  const isEnded = room.status === 'ended' || room.status === 'expired'

  const isWaiting = room.viewerJoinStatus === 'WAITING'
  const isActive = room.joinedByMe

  async function handleToggleJoin() {
    if (busy || isEnded) return
    if (isActive || isWaiting) {
      await leaveRoom(room.id)
    } else {
      await joinRoom({ roomId: room.id, direct: false })
      navigate(`/video-rooms/${room.id}`)
    }
  }

  function handleEnterRoom() {
    if (!isActive || isEnded) return
    navigate(`/video-rooms/${room.id}`)
  }

  return (
    <article className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-6 sticky top-6">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {isLive && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
            <Radio size={12} className="animate-pulse" />
            Live now
          </span>
        )}
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#6366f1]/15 text-[#a5b4fc] border border-[#6366f1]/25">
          {categoryLabel}
        </span>
        {room.status === 'expired' && (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
            Expired
          </span>
        )}
        {room.status === 'ended' && (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#2d2e3e] text-[#8b8ca8]">
            Ended
          </span>
        )}
      </div>

      <h2 className="text-xl font-bold text-white">{room.title}</h2>
      <p className="text-sm text-[#b4b5c8] mt-3 leading-relaxed whitespace-pre-wrap">
        {room.description}
      </p>

      <div className="mt-5 space-y-2 text-sm text-[#e2e8f0]">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-[#818cf8] shrink-0" />
          <span>
            {room.participantCount} / {room.maxParticipants} participants
          </span>
        </div>
        <p className="text-xs text-[#8b8ca8]">
          {isEnded && room.endedAt
            ? `Ended ${formatRelativeTime(room.endedAt)}`
            : `Started ${formatRelativeTime(room.createdAt)}`}
        </p>
      </div>

      {room.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {room.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-[#0b0c14] text-[#8b8ca8] border border-[#2d2e3e]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#2d2e3e]">
        <img src={avatarUrl(room.hostDisplayName, 40)} alt="" className="w-10 h-10 rounded-full" />
        <div>
          <p className="text-sm font-medium text-white">{room.hostDisplayName}</p>
          <p className="text-xs text-[#8b8ca8]">{room.hostRole ?? 'Room host'}</p>
        </div>
      </div>

      {room.participants.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-[#8b8ca8] mb-2 uppercase tracking-wide">
            In this room
          </p>
          <div className="flex flex-wrap gap-2">
            {room.participants.slice(0, 8).map((p) => (
              <div
                key={p.userId}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0b0c14] border border-[#2d2e3e]"
              >
                <img src={avatarUrl(p.displayName, 20)} alt="" className="w-5 h-5 rounded-full" />
                <span className="text-xs text-white">{p.displayName}</span>
                {p.host && (
                  <span className="text-[9px] text-[#818cf8] font-semibold">HOST</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-2">
        {!isEnded && (
          <button
            type="button"
            disabled={busy || (room.full && !isActive && !isWaiting)}
            onClick={handleToggleJoin}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              isActive || isWaiting
                ? 'border border-[#2d2e3e] text-[#8b8ca8] hover:text-white hover:border-[#6366f1]/40'
                : 'dc-gradient-btn text-white disabled:opacity-50'
            }`}
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Updating…
              </span>
            ) : isWaiting ? (
              'Cancel join request'
            ) : isActive ? (
              'Leave room'
            ) : room.full ? (
              'Room full'
            ) : (
              'Join room'
            )}
          </button>
        )}
        {isWaiting && isLive && (
          <p className="text-xs text-center text-[#8b8ca8]">
            Waiting for host approval. You can open the session page to see your status.
          </p>
        )}
        {isActive && isLive && (
          <button
            type="button"
            onClick={handleEnterRoom}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg dc-gradient-btn text-white text-sm font-semibold hover:opacity-90"
          >
            <Video size={16} />
            Enter video room
          </button>
        )}
      </div>
    </article>
  )
}
