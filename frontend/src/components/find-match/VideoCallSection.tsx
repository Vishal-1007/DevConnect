/**
 * VideoCallSection — real peer-to-peer WebRTC video call component.
 *
 * Picks up WebRTC state from WebRTCContext if available (Mentor page),
 * or falls back to its own useWebRTC instance (User / FindMatch page).
 *
 * Stream-to-<video> wiring strategy
 * ──────────────────────────────────
 * Each <video> element is tracked with a state variable (localVideoEl /
 * remoteVideoEl). A ref callback sets that state when the element mounts.
 * Two useEffects then assign srcObject whenever EITHER the element or the
 * stream changes. This handles every case:
 *   • Stream arrives after element mounted  (normal user flow)
 *   • Element mounts after stream arrived   (mentor tab-switch flow)
 *   • Strict Mode double-mount              (dev only, harmless)
 */
import { useEffect, useRef, useState } from 'react'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Wifi, AlertTriangle, Loader2,
} from 'lucide-react'
import { useAppSelector } from '../../hooks'
import { useGetMyProfileQuery } from '../../api/userApi'
import { useMatchFlow } from '../../hooks/useMatchFlow'
import { useWebRTC } from '../../hooks/useWebRTC'
import { useWebRTCContextSafe } from '../../contexts/WebRTCContext'
import { IncomingCallDialog } from './IncomingCallDialog'
import { formatCallDuration } from '../../lib/formatTime'

export function VideoCallSection() {
  const account  = useAppSelector((s) => s.auth.account)
  const { data: profile } = useGetMyProfileQuery()
  const { session, endSession } = useMatchFlow()
  const myUserId = account?.id ?? ''
  const myName   = profile?.displayName ?? account?.username ?? 'You'
  const userRole = profile?.role ?? 'Learner'

  // Use shared context on Mentor page, own instance on User/FindMatch page.
  const ctxWebRTC = useWebRTCContextSafe()
  const ownWebRTC = useWebRTC(ctxWebRTC ? undefined : (myUserId || undefined), myName)
  const {
    callState, peerName, incomingCall, localStream, remoteStream,
    micEnabled, cameraEnabled, connected,
    startCall, acceptCall, rejectCall, hangUp,
    toggleMic, toggleCamera, startPreview,
  } = ctxWebRTC ?? ownWebRTC

  // ── Video element refs (tracked as state so effects re-run on mount) ──────────
  const [localVideoEl,  setLocalVideoEl]  = useState<HTMLVideoElement | null>(null)
  const [remoteVideoEl, setRemoteVideoEl] = useState<HTMLVideoElement | null>(null)

  // Assign local stream → <video> whenever either changes.
  useEffect(() => {
    if (!localVideoEl) return
    localVideoEl.srcObject = localStream ?? null
    if (localStream) localVideoEl.play().catch(() => { /* autoplay policy */ })
  }, [localStream, localVideoEl])

  // Assign remote stream → <video> whenever either changes.
  useEffect(() => {
    if (!remoteVideoEl) return
    remoteVideoEl.srcObject = remoteStream ?? null
    if (remoteStream) remoteVideoEl.play().catch(() => { /* autoplay policy */ })
  }, [remoteStream, remoteVideoEl])

  // ── Call timer ────────────────────────────────────────────────────────────────
  const [callTimer, setCallTimer] = useState('00:00')
  const callStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (callState === 'in_call' && !callStartRef.current) {
      callStartRef.current = Date.now()
    }
    if (callState !== 'in_call') {
      callStartRef.current = null
      setCallTimer('00:00')
    }
  }, [callState])

  useEffect(() => {
    if (callState !== 'in_call') return
    const id = globalThis.setInterval(() => {
      if (callStartRef.current) setCallTimer(formatCallDuration(callStartRef.current))
    }, 1000)
    return () => globalThis.clearInterval(id)
  }, [callState])

  // ── Camera pre-start ──────────────────────────────────────────────────────────
  // Grab local camera as soon as a session exists so the user sees themselves
  // before the WebRTC handshake completes.
  useEffect(() => {
    if (session.status === 'matched' || session.status === 'in_call') {
      startPreview()
    }
  }, [session.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-initiate call (initiator side) — only after mentor accepted match ───
  // Only the peer with the lexicographically-smaller userId calls first.
  const partner     = session.partner
  const isInitiator = !!myUserId && !!partner?.id && myUserId.localeCompare(partner.id) < 0
  const hasInitiated = useRef(false)

  useEffect(() => {
    if (
      isInitiator &&
      partner?.id &&
      connected &&
      session.status === 'matched' &&
      callState === 'idle' &&
      !hasInitiated.current
    ) {
      hasInitiated.current = true
      startCall(partner.id, partner.displayName)
    }
  }, [isInitiator, partner, session.status, callState, connected]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (session.status === 'idle') hasInitiated.current = false
  }, [session.status])

  // Allow retry when STOMP reconnects mid-session.
  useEffect(() => {
    if (connected && session.status === 'matched' && isInitiator && callState === 'idle') {
      hasInitiated.current = false
    }
  }, [connected]) // eslint-disable-line react-hooks/exhaustive-deps

  // Manual accept required — no auto-accept for matched sessions.

  function handleEnd() {
    hangUp()
    void endSession()
    hasInitiated.current = false
  }

  // Active once match found (even before WebRTC handshake).
  const isActive =
    session.status === 'matched' ||
    session.status === 'in_call'  ||
    callState === 'calling'       ||
    callState === 'ringing'       ||
    callState === 'in_call'

  // ── Idle / ended placeholder ───────────────────────────────────────────────────
  if (!isActive && !incomingCall) {
    return (
      <section className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1a1b26] border border-[#2d2e3e] flex items-center justify-center">
            <div className="text-center px-4">
              <div className="w-16 h-16 rounded-full bg-[#2d2e3e] flex items-center justify-center mx-auto mb-2 text-2xl font-black text-white">
                {myName[0]?.toUpperCase()}
              </div>
              <p className="text-sm text-[#8b8ca8]">Your camera preview appears when a call starts</p>
            </div>
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1a1b26] border border-[#2d2e3e] flex items-center justify-center">
            <p className="text-sm text-[#8b8ca8] px-4 text-center">
              Click <span className="text-white font-medium">Find Match</span> to connect
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#6366f1]/15 border border-[#6366f1]/25">
          <AlertTriangle size={16} className="text-[#6366f1] shrink-0" />
          <span className="text-sm text-[#b4b5c8]">Remember to be respectful and follow our community guidelines.</span>
        </div>
      </section>
    )
  }

  // ── Active call ────────────────────────────────────────────────────────────────
  const displayPeerName = peerName || partner?.displayName || 'Partner'

  return (
    <>
      {/* Incoming call dialog (shown to callee before accepting) */}
      {incomingCall && (
        <IncomingCallDialog call={incomingCall} onAccept={acceptCall} onReject={rejectCall} />
      )}

      <section className="space-y-3">
        <div className="grid grid-cols-2 gap-3">

          {/* ── LOCAL (you) ── */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1a1b26] border border-[#2d2e3e]">
            <video
              ref={setLocalVideoEl}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity ${localStream && cameraEnabled ? 'opacity-100' : 'opacity-0'}`}
            />
            {/* Avatar shown when no stream or camera off */}
            <div className={`absolute inset-0 flex items-center justify-center bg-[#1a1b26] transition-opacity ${localStream && cameraEnabled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <div className="w-20 h-20 rounded-full bg-[#2d2e3e] flex items-center justify-center text-3xl font-black text-white">
                {myName[0]?.toUpperCase()}
              </div>
            </div>
            <div className="absolute inset-0 dc-video-gradient pointer-events-none" />
            <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/90 text-white">
              You
            </span>
            <div className="absolute top-3 right-3 flex items-center gap-1 text-white/90">
              <Wifi size={14} className="text-emerald-400" />
              {!micEnabled && <MicOff size={14} className="text-red-400" />}
            </div>
            {/* Mic + Camera controls — always visible in active state */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
              <div>
                <p className="font-semibold text-white text-sm drop-shadow">{myName}</p>
                <p className="text-xs text-white/70">{userRole}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-2 rounded-lg text-white hover:bg-black/60 transition-colors ${micEnabled ? 'bg-black/40' : 'bg-red-600/80'}`}
                  title={micEnabled ? 'Mute mic' : 'Unmute mic'}
                >
                  {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`p-2 rounded-lg text-white hover:bg-black/60 transition-colors ${cameraEnabled ? 'bg-black/40' : 'bg-red-600/80'}`}
                  title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {cameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* ── REMOTE (partner) ── */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1a1b26] border border-[#2d2e3e]">
            <video
              ref={setRemoteVideoEl}
              autoPlay
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity ${remoteStream ? 'opacity-100' : 'opacity-0'}`}
            />
            {/* Loading / avatar shown while waiting for remote stream */}
            <div className={`absolute inset-0 flex items-center justify-center bg-[#1a1b26] transition-opacity ${remoteStream ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {(callState === 'calling' || callState === 'ringing' || session.status === 'matched') ? (
                <div className="text-center">
                  <Loader2 size={28} className="animate-spin text-violet-400 mx-auto mb-2" />
                  <p className="text-sm text-[#8b8ca8]">
                    {callState === 'calling' && 'Calling…'}
                    {callState === 'ringing' && 'Incoming call…'}
                    {callState === 'idle' && (connected ? 'Starting call…' : 'Connecting…')}
                  </p>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white">
                  {displayPeerName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute inset-0 dc-video-gradient pointer-events-none" />
            <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#6366f1] text-white">
              Match
            </span>
            <div className="absolute top-3 right-3 flex items-center gap-2 text-white text-sm font-mono">
              <Wifi size={14} className={remoteStream ? 'text-emerald-400' : 'text-amber-400 animate-pulse'} />
              {callState === 'in_call' && <span>{callTimer}</span>}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
              <div>
                <p className="font-semibold text-white text-sm drop-shadow">{displayPeerName}</p>
                <p className="text-xs text-white/70">{partner?.role ?? 'Developer'}</p>
              </div>
              <button
                type="button"
                onClick={handleEnd}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold"
              >
                <PhoneOff size={16} />
                End Call
              </button>
            </div>
          </div>
        </div>

        {/* STOMP signaling status */}
        {!connected && (
          <p className="text-xs text-amber-400 px-1 flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" />
            Connecting to signaling server…
          </p>
        )}

        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#6366f1]/15 border border-[#6366f1]/25">
          <div className="flex items-center gap-2 text-sm text-[#b4b5c8]">
            <AlertTriangle size={16} className="text-[#6366f1] shrink-0" />
            <span>Remember to be respectful and follow our community guidelines.</span>
          </div>
          <button type="button" className="text-sm font-medium text-[#8b8ca8] hover:text-white">
            Report
          </button>
        </div>
      </section>
    </>
  )
}
