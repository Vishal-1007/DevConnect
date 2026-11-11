import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import {
  useGetVideoRoomQuery,
  useJoinVideoRoomMutation,
} from '../api/videoRoomsApi'
import { VideoRoomSessionPanel } from '../components/video-rooms/VideoRoomSessionPanel'

export function VideoRoomSessionPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const joinedRef = useRef(false)
  const { data: room, isLoading, refetch } = useGetVideoRoomQuery(roomId!, {
    skip: !roomId,
    pollingInterval: 3000,
  })
  const [joinRoom, { isLoading: joining }] = useJoinVideoRoomMutation()

  useEffect(() => {
    if (!roomId || !room || room.status === 'ended' || joinedRef.current) return
    if (room.joinedByMe || room.viewerJoinStatus === 'WAITING') return
    joinedRef.current = true
    joinRoom({ roomId, direct: true })
      .unwrap()
      .catch(() => {
        joinedRef.current = false
      })
  }, [roomId, room, joinRoom])

  if (!roomId) {
    navigate('/video-rooms', { replace: true })
    return null
  }

  if (isLoading || joining || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
        <p className="text-sm text-[#8b8ca8]">Joining room…</p>
      </div>
    )
  }

  if (room.viewerJoinStatus === 'WAITING') {
    return (
      <VideoRoomSessionPanel
        roomId={roomId}
        waitingMode
        onJoinApproved={() => refetch()}
      />
    )
  }

  if (!room.joinedByMe && room.status === 'live') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-6 text-center">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
        <p className="text-sm text-[#8b8ca8]">Connecting to room…</p>
      </div>
    )
  }

  return (
    <div className="-m-6">
      <VideoRoomSessionPanel roomId={roomId} />
    </div>
  )
}
