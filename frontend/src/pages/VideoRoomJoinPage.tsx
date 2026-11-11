import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2, Mic, MicOff, Users, Video, VideoOff } from 'lucide-react'
import {
  useGetVideoRoomJoinPreviewQuery,
  useJoinVideoRoomByCodeMutation,
} from '../api/videoRoomsApi'
import { useLocalMedia } from '../hooks/useLocalMedia'
import { extractApiError } from '../lib/extractApiError'

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function VideoRoomJoinPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const [joinRoom, { isLoading: joining, error: joinError }] = useJoinVideoRoomByCodeMutation()
  const { data: preview, isLoading, error } = useGetVideoRoomJoinPreviewQuery(roomCode!, {
    skip: !roomCode,
    pollingInterval: 5000,
  })

  const [previewReady, setPreviewReady] = useState(false)
  const {
    videoRef,
    micEnabled,
    cameraEnabled,
    mediaError,
    streamReady,
    toggleMic,
    toggleCamera,
    stopMedia,
  } = useLocalMedia(previewReady)

  useEffect(() => {
    setPreviewReady(true)
    return () => stopMedia()
  }, [stopMedia])

  async function handleJoin() {
    if (!roomCode || !preview || preview.full) return
    const joined = await joinRoom(roomCode).unwrap()
    stopMedia()
    navigate(`/video-rooms/${joined.id}`, { replace: true })
  }

  if (!roomCode) {
    return (
      <div className="p-6 text-center text-[#8b8ca8]">
        Invalid meeting link.{' '}
        <Link to="/video-rooms" className="text-[#818cf8] hover:underline">
          Back to rooms
        </Link>
      </div>
    )
  }

  if (isLoading || !preview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
        <p className="text-sm text-[#8b8ca8]">Loading meeting…</p>
      </div>
    )
  }

  const isExpired = preview.status === 'expired' || preview.status === 'ended'
  const remaining = preview.remainingSeconds

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="rounded-2xl bg-[#161722] border border-[#2d2e3e] overflow-hidden">
        <div className="p-6 border-b border-[#2d2e3e]">
          <p className="text-xs text-[#8b8ca8] uppercase tracking-wide mb-1">Join meeting</p>
          <h1 className="text-2xl font-bold text-white">{preview.title}</h1>
          <p className="text-sm text-[#8b8ca8] mt-2">
            Host: <span className="text-white">{preview.hostDisplayName}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-[#b4b5c8]">
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} className="text-[#818cf8]" />
              {preview.participantCount} / {preview.maxParticipants}
            </span>
            {remaining != null && preview.status === 'live' && (
              <span className="text-emerald-400 font-mono text-xs">
                Room ends in {formatCountdown(remaining)}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-[#8b8ca8] mb-2">Camera preview</p>
            <div className="relative aspect-video rounded-xl bg-[#0b0c14] border border-[#2d2e3e] overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${
                  streamReady && cameraEnabled ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {(!streamReady || !cameraEnabled) && (
                <div className="absolute inset-0 flex items-center justify-center text-[#5c5d72] text-sm">
                  Camera off
                </div>
              )}
            </div>
            {mediaError && (
              <p className="text-xs text-amber-300 mt-2">{mediaError}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={toggleCamera}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2d2e3e] text-xs text-[#b4b5c8] hover:border-[#6366f1]/40"
              >
                {cameraEnabled ? <Video size={14} /> : <VideoOff size={14} />}
                Camera
              </button>
              <button
                type="button"
                onClick={toggleMic}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2d2e3e] text-xs text-[#b4b5c8] hover:border-[#6366f1]/40"
              >
                {micEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                Microphone
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            {error && (
              <p className="text-sm text-red-300 mb-4">{extractApiError(error)}</p>
            )}
            {isExpired ? (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-200">
                This meeting has ended.
              </div>
            ) : preview.full ? (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-200">
                Room limit reached. Ask the host to upgrade.
              </div>
            ) : (
              <>
                <button
                  type="button"
                  disabled={joining}
                  onClick={handleJoin}
                  className="w-full py-3 rounded-xl dc-gradient-btn text-white font-semibold disabled:opacity-50"
                >
                  {joining ? 'Joining…' : 'Join meeting'}
                </button>
                {joinError && (
                  <p className="text-xs text-red-300 mt-3">{extractApiError(joinError)}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
