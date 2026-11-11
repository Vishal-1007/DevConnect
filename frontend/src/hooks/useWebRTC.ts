/**
 * useWebRTC — full peer-to-peer WebRTC implementation.
 *
 * KEY FIX: peerIdRef is updated SYNCHRONOUSLY before createPC() is called.
 * The previous version used React state (peerId) inside the onicecandidate
 * closure which was always null/stale because React state updates are async.
 * Without a valid `to` field the ICE candidates were never relayed, so the
 * RTCPeerConnection could never reach "connected" state and no video appeared.
 *
 * Call flow (caller side):
 *   startCall(peerId, peerName) → send call-request → wait call-accept
 *   → createOffer → send offer → wait answer → setRemoteDescription
 *   → exchange ICE candidates → streams active
 *
 * Call flow (callee side):
 *   receive call-request → onIncomingCall fires
 *   acceptCall() → send call-accept → wait offer → createAnswer → send answer
 *   → exchange ICE candidates → streams active
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSignaling, type SignalingMessage } from './useSignaling'

export type CallState = 'idle' | 'calling' | 'ringing' | 'in_call' | 'ended'

export interface IncomingCall {
  fromId: string
  fromName: string
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export function useWebRTC(myUserId: string | undefined, myName: string) {
  const [callState, setCallState]       = useState<CallState>('idle')
  const [peerId, setPeerId]             = useState<string | null>(null)
  const [peerName, setPeerName]         = useState<string>('')
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [localStream, setLocalStream]   = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [micEnabled, setMicEnabled]     = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)

  const pcRef          = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const pendingIceRef  = useRef<RTCIceCandidateInit[]>([])
  const isCaller       = useRef(false)

  // Always holds the current peer ID, updated synchronously – safe in closures.
  const peerIdRef    = useRef<string | null>(null)
  const myUserIdRef  = useRef(myUserId)
  const sendSignalRef = useRef<(m: SignalingMessage) => void>(() => {})

  useEffect(() => { myUserIdRef.current = myUserId }, [myUserId])

  // ── helpers ─────────────────────────────────────────────────────────────────

  function createPC(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    pc.onicecandidate = (e) => {
      // peerIdRef.current is always up-to-date (set synchronously before createPC)
      if (e.candidate && peerIdRef.current && myUserIdRef.current) {
        sendSignalRef.current({
          type: 'ice',
          from: myUserIdRef.current,
          to: peerIdRef.current,
          candidate: JSON.stringify(e.candidate.toJSON()),
          sdpMid: e.candidate.sdpMid ?? undefined,
          sdpMLineIndex: e.candidate.sdpMLineIndex ?? undefined,
        })
      }
    }

    pc.ontrack = (e) => {
      if (e.streams?.[0]) setRemoteStream(e.streams[0])
    }

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === 'disconnected' ||
        pc.iceConnectionState === 'failed'
      ) {
        hangUp()
      }
    }

    return pc
  }

  async function getLocalMedia(): Promise<MediaStream> {
    if (localStreamRef.current) return localStreamRef.current
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    localStreamRef.current = stream
    setLocalStream(stream)
    return stream
  }

  function stopLocalMedia() {
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    setLocalStream(null)
  }

  async function flushPendingCandidates(pc: RTCPeerConnection) {
    for (const c of pendingIceRef.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch { /* ignore */ }
    }
    pendingIceRef.current = []
  }

  // ── signaling handler ────────────────────────────────────────────────────────

  const handleSignal = useCallback(async (msg: SignalingMessage) => {
    switch (msg.type) {

      case 'call-request': {
        // Update ref synchronously so acceptCall's createPC sees the right id.
        peerIdRef.current = msg.from
        setPeerId(msg.from)
        setPeerName(msg.fromName ?? msg.from)
        setIncomingCall({ fromId: msg.from, fromName: msg.fromName ?? msg.from })
        setCallState('ringing')
        break
      }

      case 'call-accept': {
        // Caller side — callee accepted; create offer now.
        const pc = pcRef.current
        if (!pc || !myUserIdRef.current) break
        const stream = await getLocalMedia()
        stream.getTracks().forEach((t) => pc.addTrack(t, stream))
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        })
        await pc.setLocalDescription(offer)
        sendSignalRef.current({
          type: 'offer',
          from: myUserIdRef.current,
          to: msg.from,
          sdp: offer.sdp,
        })
        setCallState('in_call')
        break
      }

      case 'call-reject': {
        hangUp()
        break
      }

      case 'offer': {
        // Callee side — received offer, create answer.
        const pc = pcRef.current
        if (!pc || !myUserIdRef.current) break
        const stream = await getLocalMedia()
        stream.getTracks().forEach((t) => pc.addTrack(t, stream))
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: 'offer', sdp: msg.sdp! }),
        )
        await flushPendingCandidates(pc)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendSignalRef.current({
          type: 'answer',
          from: myUserIdRef.current,
          to: msg.from,
          sdp: answer.sdp,
        })
        setCallState('in_call')
        break
      }

      case 'answer': {
        // Caller side — received answer.
        const pc = pcRef.current
        if (!pc) break
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: msg.sdp! }),
        )
        await flushPendingCandidates(pc)
        break
      }

      case 'ice': {
        if (!msg.candidate) break
        const candidate = JSON.parse(msg.candidate) as RTCIceCandidateInit
        const pc = pcRef.current
        if (pc?.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch { /* ignore */ }
        } else {
          pendingIceRef.current.push(candidate)
        }
        break
      }
    }
  }, []) // stable – all state accesses go through refs

  const { sendSignal, connected } = useSignaling(myUserId, handleSignal)

  // Keep sendSignalRef up-to-date so the closure in handleSignal/createPC always
  // uses the latest function without causing deps cycles.
  useEffect(() => { sendSignalRef.current = sendSignal }, [sendSignal])

  // ── public API ───────────────────────────────────────────────────────────────

  /** Caller initiates a call to a remote peer. */
  const startCall = useCallback((remotePeerId: string, remotePeerName: string) => {
    if (!myUserIdRef.current || callState !== 'idle') return
    isCaller.current = true
    // IMPORTANT: update ref SYNCHRONOUSLY so createPC's onicecandidate closure
    // has a valid `to` field from the very first ICE candidate.
    peerIdRef.current = remotePeerId
    setPeerId(remotePeerId)
    setPeerName(remotePeerName)
    setCallState('calling')

    const pc = createPC()
    pcRef.current = pc

    sendSignalRef.current({
      type: 'call-request',
      from: myUserIdRef.current,
      to: remotePeerId,
      fromName: myName,
    })
  }, [callState, myName]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Callee accepts an incoming call. */
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !myUserIdRef.current) return
    const remotePeerId = incomingCall.fromId
    // IMPORTANT: update ref SYNCHRONOUSLY before createPC.
    peerIdRef.current = remotePeerId
    isCaller.current = false

    const pc = createPC()
    pcRef.current = pc

    setIncomingCall(null)
    setCallState('in_call')

    sendSignalRef.current({ type: 'call-accept', from: myUserIdRef.current, to: remotePeerId })
  }, [incomingCall]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Callee rejects an incoming call. */
  const rejectCall = useCallback(() => {
    if (!incomingCall || !myUserIdRef.current) return
    sendSignalRef.current({ type: 'call-reject', from: myUserIdRef.current, to: incomingCall.fromId })
    setIncomingCall(null)
    setCallState('idle')
  }, [incomingCall])

  /** Hang up from either side. */
  const hangUp = useCallback(() => {
    pcRef.current?.close()
    pcRef.current = null
    pendingIceRef.current = []
    peerIdRef.current = null
    stopLocalMedia()
    setRemoteStream(null)
    setIncomingCall(null)
    setPeerId(null)
    setPeerName('')
    setCallState('ended')
    setTimeout(() => setCallState('idle'), 1500)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Start the local camera/mic preview without initiating a call.
   * Safe to call multiple times — stream is cached in localStreamRef.
   */
  const startPreview = useCallback(async () => {
    try {
      await getLocalMedia()
    } catch (err) {
      console.warn('[useWebRTC] startPreview: camera access denied or unavailable', err)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setMicEnabled(track.enabled)
  }, [])

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setCameraEnabled(track.enabled)
  }, [])

  useEffect(() => () => {
    pcRef.current?.close()
    stopLocalMedia()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    callState,
    peerId,
    peerName,
    incomingCall,
    localStream,
    remoteStream,
    micEnabled,
    cameraEnabled,
    connected,
    startCall,
    acceptCall,
    rejectCall,
    hangUp,
    toggleMic,
    toggleCamera,
    startPreview,
  }
}
