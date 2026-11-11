import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  Crown,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  MonitorUp,
  PhoneOff,
  Radio,
  Send,
  Users,
  Video,
  VideoOff,
  Wifi,
  Shield,
  Layers,
  UserMinus,
  VolumeX,
} from 'lucide-react'
import {
  useApproveVideoRoomJoinMutation,
  useEndVideoRoomMutation,
  useGetVideoRoomQuery,
  useLeaveVideoRoomMutation,
  useListVideoRoomMessagesQuery,
  useRejectVideoRoomJoinMutation,
  useSendVideoRoomMessageMutation,
  useSetParticipantCameraMutation,
  useSetParticipantMutedMutation,
  useRemoveVideoRoomParticipantMutation,
  useUpdateVideoRoomPermissionsMutation,
  useCreateBreakoutRoomMutation,
} from '../../api/videoRoomsApi'
import { useGetMyProfileQuery } from '../../api/userApi'
import { useAppSelector } from '../../hooks'
import { avatarUrl } from '../../lib/avatar'
import { formatCallDuration, formatMessageTime } from '../../lib/formatTime'
import { useLocalMedia } from '../../hooks/useLocalMedia'
import { useVideoRoomSignaling, type VideoRoomSignalingMessage } from '../../hooks/useVideoRoomSignaling'
import { useVideoRoomWebRTC } from '../../hooks/useVideoRoomWebRTC'
import { VideoRoomUpgradeModal } from './VideoRoomUpgradeModal'

function remoteHasLiveVideo(stream: MediaStream | undefined): boolean {
  if (!stream) return false
  const track = stream.getVideoTracks()[0]
  return Boolean(track?.enabled && track.readyState === 'live')
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface JoinRequestNotice {
  userId: string
  displayName: string
}

interface VideoRoomSessionPanelProps {
  roomId: string
  /** When true, stay embedded (e.g. mentor dashboard) instead of routing to /video-rooms */
  embedMode?: boolean
  /** Open host/moderator manage panel on entry (community room moderation) */
  initialManageOpen?: boolean
  /** Show waiting-for-approval screen instead of the video session */
  waitingMode?: boolean
  onJoinApproved?: () => void
  onExit?: () => void
}

export function VideoRoomSessionPanel({
  roomId,
  embedMode,
  initialManageOpen,
  waitingMode,
  onJoinApproved,
  onExit,
}: VideoRoomSessionPanelProps) {
  const navigate = useNavigate()

  function exitSession() {
    if (onExit) onExit()
    else navigate('/video-rooms', { replace: true })
  }

  // Use auth account ID synchronously — never undefined while logged in
  const account = useAppSelector((s) => s.auth.account)
  const { data: profile } = useGetMyProfileQuery()
  const myId = account?.id
  const myName = profile?.displayName ?? account?.username ?? 'You'
  const myRole = profile?.role ?? 'Learner'

  const { data: room, isLoading, error } = useGetVideoRoomQuery(roomId, {
    pollingInterval: 4000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })
  const { data: messages = [] } = useListVideoRoomMessagesQuery(
    { roomId, limit: 100 },
    { pollingInterval: 3000, skip: !room?.joinedByMe }
  )
  const [sendMessage, { isLoading: sending }] = useSendVideoRoomMessageMutation()
  const [leaveRoom, { isLoading: leaving }] = useLeaveVideoRoomMutation()
  const [endRoom, { isLoading: ending }] = useEndVideoRoomMutation()
  const [setMuted] = useSetParticipantMutedMutation()
  const [setCamera] = useSetParticipantCameraMutation()
  const [approveJoin] = useApproveVideoRoomJoinMutation()
  const [rejectJoin] = useRejectVideoRoomJoinMutation()
  const [removeParticipant] = useRemoveVideoRoomParticipantMutation()
  const [updatePermissions] = useUpdateVideoRoomPermissionsMutation()
  const [createBreakout] = useCreateBreakoutRoomMutation()

  const [chatOpen, setChatOpen] = useState(true)
  const [manageOpen, setManageOpen] = useState(initialManageOpen ?? false)
  const [manageTab, setManageTab] = useState<'participants' | 'permissions' | 'breakouts'>('participants')
  const [breakoutTitle, setBreakoutTitle] = useState('')
  const [chatInput, setChatInput] = useState('')
  const sessionStartedAt = useMemo(
    () => (room?.createdAt ? new Date(room.createdAt).getTime() : Date.now()),
    [room?.createdAt],
  )
  const [callTimer, setCallTimer] = useState('00:00')
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [hostNotice, setHostNotice] = useState<string | null>(null)
  const [joinRequest, setJoinRequest] = useState<JoinRequestNotice | null>(null)
  const [rejectNotice, setRejectNotice] = useState(false)
  const [removedNotice, setRemovedNotice] = useState(false)
  const [confirmEndRoom, setConfirmEndRoom] = useState(false)
  const [confirmRemoveUser, setConfirmRemoveUser] = useState<{ userId: string; name: string } | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Screen share
  const screenRef = useRef<HTMLVideoElement>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  const startShare = useCallback(async () => {
    setShareError(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      screenStreamRef.current = stream
      if (screenRef.current) {
        screenRef.current.srcObject = stream
      }
      setIsSharing(true)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopShare()
      })
    } catch {
      setShareError('Screen sharing was cancelled or denied.')
    }
  }, [])

  const stopShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop())
    screenStreamRef.current = null
    if (screenRef.current) screenRef.current.srcObject = null
    setIsSharing(false)
  }, [])

  const inSession = Boolean(room?.joinedByMe && room.status === 'live' && !waitingMode)
  const showFiveMinWarning =
    room?.freeTierRoom &&
    remainingSeconds != null &&
    remainingSeconds > 0 &&
    remainingSeconds <= 300
  const {
    videoRef,
    localStream,
    micEnabled,
    cameraEnabled,
    mediaError,
    streamReady,
    toggleMic,
    toggleCamera,
    stopMedia,
    forceMute,
    forceCameraOff,
  } = useLocalMedia(inSession)

  const participantIds = useMemo(
    () => (room?.participants ?? []).map((p) => p.userId),
    [room?.participants],
  )

  const { remoteStreams, leaveRoom: leaveWebRTC } = useVideoRoomWebRTC(
    roomId,
    myId,
    myName,
    localStream,
    inSession,
    participantIds,
  )
  const leaveWebRTCRef = useRef(leaveWebRTC)
  useEffect(() => {
    leaveWebRTCRef.current = leaveWebRTC
  }, [leaveWebRTC])

  const handleSignaling = useCallback(
    (msg: VideoRoomSignalingMessage) => {
      if (msg.type === 'JOIN_REQUEST' && room?.hostId === myId) {
        const requesterId = msg.targetUserId ?? msg.from
        if (!requesterId) return
        setJoinRequest({
          userId: requesterId,
          displayName: msg.fromName ?? 'Someone',
        })
        return
      }
      if (msg.type === 'JOIN_APPROVED' && (msg.to === myId || msg.targetUserId === myId)) {
        onJoinApproved?.()
        return
      }
      if (msg.type === 'JOIN_REJECTED' && (msg.to === myId || msg.targetUserId === myId)) {
        setRejectNotice(true)
        return
      }
      if (msg.type === 'MUTE_USER' && (msg.to === myId || msg.targetUserId === myId)) {
        forceMute()
        setHostNotice('Host muted your microphone')
        return
      }
      if (msg.type === 'CAMERA_OFF' && (msg.to === myId || msg.targetUserId === myId)) {
        forceCameraOff()
        setHostNotice('Host turned off your camera')
        return
      }
      if (msg.type === 'REMOVE_USER' && (msg.to === myId || msg.targetUserId === myId)) {
        leaveWebRTCRef.current?.()
        stopShare()
        stopMedia()
        setRemovedNotice(true)
        return
      }
      if (msg.type === 'ROOM_ENDED') {
        leaveWebRTCRef.current?.()
        stopShare()
        stopMedia()
        exitSession()
      }
    },
    [room?.hostId, myId, onJoinApproved, forceMute, forceCameraOff, stopMedia, stopShare],
  )

  useVideoRoomSignaling(roomId, myId, handleSignaling)

  const myParticipant = room?.participants?.find((p) => p.userId === myId)
  const isHost =
    room?.hostId === myId ||
    myParticipant?.participantRole === 'HOST' ||
    myParticipant?.host === true
  const canManage = isHost

  useEffect(() => {
    if (!isHost || !room?.waitingParticipants?.length) return
    const next = room.waitingParticipants[0]
    setJoinRequest((current) =>
      current ?? { userId: next.userId, displayName: next.displayName },
    )
  }, [isHost, room?.waitingParticipants])
  const busy = leaving || ending

  useEffect(() => {
    if (room?.remainingSeconds != null) {
      setRemainingSeconds(room.remainingSeconds)
    }
  }, [room?.remainingSeconds])

  useEffect(() => {
    if (!inSession) return
    if (room?.freeTierRoom && remainingSeconds != null) {
      const id = window.setInterval(() => {
        setRemainingSeconds((prev) => (prev != null && prev > 0 ? prev - 1 : prev))
      }, 1000)
      return () => window.clearInterval(id)
    }
    const tick = () => setCallTimer(formatCallDuration(sessionStartedAt))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [inSession, sessionStartedAt, room?.freeTierRoom, remainingSeconds])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (room && (room.status === 'ended' || room.status === 'expired')) {
      stopShare()
      stopMedia()
      if (room.status === 'ended') {
        exitSession()
      }
    }
  }, [room, stopMedia, stopShare]) // eslint-disable-line react-hooks/exhaustive-deps

  async function copyInviteLink() {
    const link = room?.joinUrl
    if (!link) return
    await navigator.clipboard.writeText(link)
    setLinkCopied(true)
    window.setTimeout(() => setLinkCopied(false), 2000)
  }

  // Other participants (exclude self from the list so we show them separately)
  const otherParticipants = useMemo(
    () => (room?.participants ?? []).filter((p) => p.userId !== myId),
    [room?.participants, myId]
  )

  // Total tiles = 1 (self) + others
  const totalTiles = otherParticipants.length + 1
  const gridClass =
    totalTiles <= 1
      ? 'grid-cols-1'
      : totalTiles <= 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : totalTiles <= 4
          ? 'grid-cols-2'
          : 'grid-cols-2 lg:grid-cols-3'

  async function handleLeave() {
    if (busy) return
    leaveWebRTC()
    stopShare()
    stopMedia()
    await leaveRoom(roomId)
    exitSession()
  }

  async function handleEndRoom() {
    if (busy || !isHost) return
    setConfirmEndRoom(false)
    leaveWebRTC()
    stopShare()
    stopMedia()
    await endRoom(roomId)
    exitSession()
  }

  async function toggleParticipantMute(userId: string) {
    if (!canManage) return
    await setMuted({ roomId, userId, muted: true })
  }

  async function handleCameraOff(userId: string) {
    if (!canManage) return
    await setCamera({ roomId, userId, enabled: false })
  }

  async function handleRemoveParticipant(userId: string) {
    if (!canManage) return
    setConfirmRemoveUser(null)
    await removeParticipant({ roomId, userId })
  }

  async function handleApproveJoin(userId: string) {
    if (!isHost) return
    setJoinRequest(null)
    await approveJoin({ roomId, userId })
  }

  async function handleRejectJoin(userId: string) {
    if (!isHost) return
    setJoinRequest(null)
    await rejectJoin({ roomId, userId })
  }

  async function handlePermissionChange(key: 'chatEnabled' | 'screenShareEnabled' | 'breakoutEnabled', value: boolean) {
    if (!canManage) return
    await updatePermissions({ roomId, body: { [key]: value } })
  }

  async function handleCreateBreakout() {
    if (!isHost || !breakoutTitle.trim()) return
    await createBreakout({ parentRoomId: roomId, body: { title: breakoutTitle.trim(), maxParticipants: 6 } })
    setBreakoutTitle('')
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text || sending) return
    setChatInput('')
    await sendMessage({ roomId, content: text })
  }

  if (isLoading || !room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
      </div>
    )
  }

  if (room.status === 'expired' || room.expiredDueToTimeLimit) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        {showUpgrade && (
          <VideoRoomUpgradeModal
            title="Your free meeting has ended"
            subtitle="Upgrade for ₹50 to continue unlimited meetings."
            onClose={() => setShowUpgrade(false)}
            onPurchased={() => setShowUpgrade(false)}
          />
        )}
        <p className="text-white font-semibold mb-2">Your free meeting has ended.</p>
        <p className="text-sm text-[#8b8ca8] mb-6">
          Upgrade for ₹50 to continue unlimited meetings.
        </p>
        <button
          type="button"
          onClick={() => setShowUpgrade(true)}
          className="dc-gradient-btn px-5 py-2 rounded-lg text-white text-sm font-semibold mb-3"
        >
          Upgrade Now
        </button>
        <button
          type="button"
          onClick={exitSession}
          className="block mx-auto text-sm text-[#8b8ca8] hover:text-white"
        >
          Back to rooms
        </button>
      </div>
    )
  }

  if (waitingMode || room.viewerJoinStatus === 'WAITING') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        {rejectNotice ? (
          <>
            <p className="text-white font-semibold">Host rejected your request</p>
            <button
              type="button"
              onClick={exitSession}
              className="dc-gradient-btn px-4 py-2 rounded-lg text-white text-sm font-semibold"
            >
              Back to rooms
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 text-[#6366f1] animate-spin" />
            <p className="text-white font-semibold">Waiting for host approval…</p>
            <p className="text-sm text-[#8b8ca8] max-w-sm">
              The host will be notified. You will join automatically once admitted.
            </p>
            <button
              type="button"
              onClick={async () => {
                await leaveRoom(roomId)
                exitSession()
              }}
              className="text-sm text-[#8b8ca8] hover:text-white"
            >
              Cancel request
            </button>
          </>
        )}
      </div>
    )
  }

  if (removedNotice) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <p className="text-white font-semibold mb-4">You were removed by the host</p>
        <button
          type="button"
          onClick={exitSession}
          className="dc-gradient-btn px-4 py-2 rounded-lg text-white text-sm font-semibold"
        >
          Back to rooms
        </button>
      </div>
    )
  }

  if (error || !room.joinedByMe) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <p className="text-[#8b8ca8] mb-4">Join the room from the lobby before entering the session.</p>
        <button
          type="button"
          onClick={exitSession}
          className="dc-gradient-btn px-4 py-2 rounded-lg text-white text-sm font-semibold"
        >
          Back to rooms
        </button>
      </div>
    )
  }

  const displayTimer =
    room.freeTierRoom && remainingSeconds != null
      ? formatCountdown(remainingSeconds)
      : callTimer

  return (
    <div className={`flex flex-col ${embedMode ? 'h-full min-h-[600px]' : 'h-[calc(100vh-4rem)] max-h-[900px]'}`}>
      {joinRequest && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md rounded-xl bg-[#161722] border border-[#2d2e3e] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-1">Join Request</h3>
            <p className="text-sm text-[#b4b5c8] mb-6">
              <span className="text-white font-medium">{joinRequest.displayName}</span> wants to join this meeting
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => handleRejectJoin(joinRequest.userId)}
                className="px-4 py-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white text-sm font-semibold"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleApproveJoin(joinRequest.userId)}
                className="px-4 py-2 rounded-lg dc-gradient-btn text-white text-sm font-semibold"
              >
                Admit
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmEndRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md rounded-xl bg-[#161722] border border-[#2d2e3e] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">End meeting for everyone?</h3>
            <p className="text-sm text-[#8b8ca8] mb-6">All participants will be disconnected.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmEndRoom(false)}
                className="px-4 py-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEndRoom}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold"
              >
                End room
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmRemoveUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md rounded-xl bg-[#161722] border border-[#2d2e3e] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              Remove {confirmRemoveUser.name} from meeting?
            </h3>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmRemoveUser(null)}
                className="px-4 py-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemoveParticipant(confirmRemoveUser.userId)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      {hostNotice && (
        <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-xs text-center">
          {hostNotice}
          <button
            type="button"
            onClick={() => setHostNotice(null)}
            className="ml-3 underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}
      {showUpgrade && (
        <VideoRoomUpgradeModal
          onClose={() => setShowUpgrade(false)}
          onPurchased={() => setShowUpgrade(false)}
        />
      )}
      {showFiveMinWarning && (
        <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <span>Your free room ends in 5 minutes.</span>
          {!room.viewerHasVideoRoomPremium && (
            <button
              type="button"
              onClick={() => setShowUpgrade(true)}
              className="flex items-center gap-1 text-[#fcd34d] font-semibold hover:underline"
            >
              <Crown size={12} />
              Upgrade Now
            </button>
          )}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#2d2e3e] bg-[#12131c]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleLeave}
            className="p-2 rounded-lg text-[#8b8ca8] hover:text-white hover:bg-[#2d2e3e] transition-colors"
            aria-label="Leave room"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                <Radio size={10} className="animate-pulse" />
                LIVE
              </span>
              <span
                className={`text-xs font-mono ${
                  room.freeTierRoom && remainingSeconds != null && remainingSeconds <= 300
                    ? 'text-amber-400'
                    : 'text-[#8b8ca8]'
                }`}
              >
                {room.freeTierRoom && remainingSeconds != null
                  ? `Remaining ${displayTimer}`
                  : displayTimer}
              </span>
            </div>
            <h1 className="text-base font-semibold text-white truncate">{room.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#8b8ca8]">
          {room.joinUrl && (
            <button
              type="button"
              onClick={copyInviteLink}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#2d2e3e] hover:border-[#6366f1]/40 text-[#b4b5c8]"
            >
              <Copy size={12} />
              {linkCopied ? 'Copied' : 'Copy link'}
            </button>
          )}
          <Users size={14} className="text-[#818cf8]" />
          {room.participantCount}/{room.maxParticipants}
          <button
            type="button"
            onClick={() => setChatOpen((v) => !v)}
            className={`ml-2 p-2 rounded-lg transition-colors ${
              chatOpen ? 'bg-[#6366f1]/20 text-[#a5b4fc]' : 'hover:bg-[#2d2e3e] text-[#8b8ca8]'
            }`}
            aria-label="Toggle chat"
          >
            <MessageSquare size={16} />
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => setManageOpen((v) => !v)}
              className={`p-2 rounded-lg transition-colors ${
                manageOpen ? 'bg-violet-500/20 text-violet-300' : 'hover:bg-[#2d2e3e] text-[#8b8ca8]'
              }`}
              aria-label="Manage room"
            >
              <Shield size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Video grid */}
        <div className="flex-1 flex flex-col min-w-0 p-4">
          <div className={`grid ${gridClass} gap-3 flex-1 auto-rows-fr min-h-0`}>

            {/* ── YOUR OWN TILE ── always first, video element always in DOM */}
            <div className="relative aspect-video min-h-[140px] rounded-xl overflow-hidden bg-[#1a1b26] border border-[#2d2e3e]">
              {/* Camera video — always mounted so videoRef is set before streamReady fires */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
                  inSession && streamReady && cameraEnabled && !isSharing ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />

              {/* Screen share video — fills the tile when sharing */}
              <video
                ref={screenRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-contain bg-black transition-opacity ${
                  isSharing ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />

              {/* Camera PiP overlay while screen sharing */}
              {isSharing && inSession && streamReady && cameraEnabled && (
                <div className="absolute bottom-12 right-2 w-24 aspect-video rounded-lg overflow-hidden border-2 border-white/30 shadow-lg z-10">
                  <video
                    autoPlay
                    playsInline
                    muted
                    ref={(el) => {
                      if (el && videoRef.current?.srcObject) {
                        el.srcObject = videoRef.current.srcObject
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Avatar shown when camera off and not sharing */}
              {(!inSession || !streamReady || !cameraEnabled) && !isSharing && (
                <img
                  src={avatarUrl(myName, 400)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
              )}
              <div className="absolute inset-0 dc-video-gradient pointer-events-none" />
              <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/90 text-white">
                You
              </span>
              {isSharing && (
                <span className="absolute top-3 left-12 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/90 text-white flex items-center gap-1">
                  <Monitor size={10} />
                  Sharing
                </span>
              )}
              <div className="absolute top-3 right-3 flex items-center gap-1 text-white/90">
                <Wifi size={14} />
                {!micEnabled && <MicOff size={14} className="text-red-400" />}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-semibold text-white text-sm">{myName}</p>
                <p className="text-xs text-white/70">{myRole}</p>
              </div>
            </div>

            {/* ── OTHER PARTICIPANTS ── */}
            {otherParticipants.map((participant) => {
              const remoteStream = remoteStreams[participant.userId]
              const showRemoteVideo = remoteHasLiveVideo(remoteStream)
              return (
                <div
                  key={participant.userId}
                  className="relative aspect-video min-h-[140px] rounded-xl overflow-hidden bg-[#1a1b26] border border-[#2d2e3e]"
                >
                  {showRemoteVideo ? (
                    <video
                      autoPlay
                      playsInline
                      ref={(video) => {
                        if (video && remoteStream) {
                          video.srcObject = remoteStream
                        }
                      }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={avatarUrl(participant.displayName, 400)}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-90"
                    />
                  )}
                  <div className="absolute inset-0 dc-video-gradient pointer-events-none" />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#6366f1]/90 text-white">
                    {participant.host ? 'Host' : 'Guest'}
                  </span>
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-white/90">
                    <Wifi size={14} />
                    {participant.muted && <MicOff size={14} className="text-red-400" />}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-semibold text-white text-sm">{participant.displayName}</p>
                    <p className="text-xs text-white/70">{participant.role ?? 'Developer'}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {mediaError && (
            <p className="text-sm text-amber-400 mt-2 px-1">{mediaError}</p>
          )}
          {shareError && (
            <p className="text-sm text-amber-400 mt-1 px-1">{shareError}</p>
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 py-3 px-4 rounded-xl bg-[#161722] border border-[#2d2e3e]">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-3 rounded-full transition-colors ${
                micEnabled
                  ? 'bg-[#2d2e3e] text-white hover:bg-[#3d3e4e]'
                  : 'bg-red-600 text-white hover:bg-red-500'
              }`}
              aria-label={micEnabled ? 'Mute' : 'Unmute'}
            >
              {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              type="button"
              onClick={toggleCamera}
              className={`p-3 rounded-full transition-colors ${
                cameraEnabled
                  ? 'bg-[#2d2e3e] text-white hover:bg-[#3d3e4e]'
                  : 'bg-red-600 text-white hover:bg-red-500'
              }`}
              aria-label={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button
              type="button"
              onClick={isSharing ? stopShare : startShare}
              className={`p-3 rounded-full transition-colors ${
                isSharing
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-[#2d2e3e] text-white hover:bg-[#3d3e4e]'
              }`}
              aria-label={isSharing ? 'Stop sharing screen' : 'Share screen'}
              title={isSharing ? 'Stop sharing screen' : 'Share your screen'}
            >
              {isSharing ? <MonitorOff size={20} /> : <MonitorUp size={20} />}
            </button>
            <button
              type="button"
              onClick={handleLeave}
              disabled={busy}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#2d2e3e] text-white hover:bg-[#3d3e4e] text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowLeft size={18} />}
              Leave
            </button>
            {isHost && (
              <button
                type="button"
                onClick={() => setConfirmEndRoom(true)}
                disabled={busy}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <PhoneOff size={18} />
                End room
              </button>
            )}
          </div>
        </div>

        {/* Host manage panel */}
        {manageOpen && canManage && (
          <aside className="w-full sm:w-72 border-l border-[#2d2e3e] bg-[#0f1018] flex flex-col shrink-0">
            <div className="flex border-b border-[#2d2e3e]">
              {(['participants', 'permissions', 'breakouts'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setManageTab(tab)}
                  className={`flex-1 text-[10px] font-semibold py-2.5 capitalize ${
                    manageTab === tab ? 'text-violet-300 border-b-2 border-violet-500' : 'text-[#5c5d72] hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {manageTab === 'participants' && (
                <>
                  <p className="text-[10px] font-semibold text-[#8b8ca8] uppercase tracking-wide">
                    Participants ({room.participants?.length ?? 0})
                  </p>
                  {(room.participants ?? []).map((p) => (
                    <div key={p.userId} className="flex items-center gap-2 bg-[#161722] rounded-lg p-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-white truncate">
                          {p.displayName}
                          {p.host || p.participantRole === 'HOST' ? ' (Host)' : ''}
                        </p>
                        <p className="text-[9px] text-[#5c5d72]">
                          Mic {p.muted ? 'off' : 'on'} · Camera {p.cameraEnabled === false ? 'off' : 'on'}
                        </p>
                      </div>
                      {!p.host && p.participantRole !== 'HOST' && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleParticipantMute(p.userId)}
                            className="p-1.5 rounded bg-[#2d2e3e] text-[#8b8ca8] hover:text-white"
                            title="Mute mic"
                          >
                            <VolumeX size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCameraOff(p.userId)}
                            className="p-1.5 rounded bg-[#2d2e3e] text-[#8b8ca8] hover:text-white"
                            title="Turn off camera"
                          >
                            <VideoOff size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmRemoveUser({ userId: p.userId, name: p.displayName })
                            }
                            className="p-1.5 rounded bg-red-500/15 text-red-400 hover:bg-red-600 hover:text-white"
                            title="Remove"
                          >
                            <UserMinus size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
              {manageTab === 'permissions' && (
                <div className="space-y-3">
                  {(
                    [
                      ['chatEnabled', 'Allow room chat', room.chatEnabled],
                      ['screenShareEnabled', 'Allow screen share', room.screenShareEnabled],
                      ['breakoutEnabled', 'Enable breakout rooms', room.breakoutEnabled],
                    ] as const
                  ).map(([key, label, enabled]) => (
                    <label key={key} className="flex items-center justify-between text-xs text-[#8b8ca8] cursor-pointer">
                      {label}
                      <input
                        type="checkbox"
                        checked={Boolean(enabled)}
                        onChange={(e) => handlePermissionChange(key as 'chatEnabled' | 'screenShareEnabled' | 'breakoutEnabled', e.target.checked)}
                      />
                    </label>
                  ))}
                </div>
              )}
              {manageTab === 'breakouts' && (
                <div className="space-y-3">
                  {(room.breakouts ?? []).map((b) => (
                    <div key={b.id} className="bg-[#161722] rounded-lg p-2">
                      <p className="text-[11px] font-semibold text-white">{b.title}</p>
                      <p className="text-[9px] text-[#5c5d72]">{b.participantCount}/{b.maxParticipants} · {b.status}</p>
                    </div>
                  ))}
                  {room.breakoutEnabled && (
                    <div className="flex gap-2">
                      <input
                        value={breakoutTitle}
                        onChange={(e) => setBreakoutTitle(e.target.value)}
                        placeholder="Breakout room name"
                        className="flex-1 bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCreateBreakout}
                        className="px-2 py-1.5 rounded-lg bg-violet-600 text-white text-[10px] font-bold"
                      >
                        <Layers size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Chat panel */}
        {chatOpen && (
          <aside className="w-full sm:w-80 border-l border-[#2d2e3e] bg-[#12131c] flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-[#2d2e3e]">
              <h2 className="text-sm font-semibold text-white">Room chat</h2>
              <p className="text-xs text-[#8b8ca8]">{messages.length} messages</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg) => {
                const isMine = msg.authorId === myId
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                    <img
                      src={avatarUrl(msg.authorDisplayName, 28)}
                      alt=""
                      className="w-7 h-7 rounded-full shrink-0 mt-0.5"
                    />
                    <div className={`max-w-[85%] ${isMine ? 'text-right' : ''}`}>
                      <div className={`flex items-center gap-2 mb-0.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs font-medium text-white">{msg.authorDisplayName}</span>
                        <span className="text-[10px] text-[#5c5d72]">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>
                      <p
                        className={`text-sm px-3 py-2 rounded-xl ${
                          isMine
                            ? 'bg-[#6366f1]/25 text-white border border-[#6366f1]/30'
                            : 'bg-[#161722] text-[#e2e8f0] border border-[#2d2e3e]'
                        }`}
                      >
                        {msg.content}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-3 border-t border-[#2d2e3e] flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message the room…"
                className="flex-1 px-3 py-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || sending}
                className="p-2 rounded-lg dc-gradient-btn text-white disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  )
}
