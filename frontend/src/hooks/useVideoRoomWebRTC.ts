/**
 * Mesh WebRTC for video rooms — one RTCPeerConnection per remote participant.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useVideoRoomSignaling,
  type VideoRoomSignalingMessage,
} from './useVideoRoomSignaling'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

function shouldOffer(localId: string, remoteId: string): boolean {
  return localId.localeCompare(remoteId) < 0
}

export function useVideoRoomWebRTC(
  roomId: string | undefined,
  myUserId: string | undefined,
  myName: string,
  localStream: MediaStream | null,
  active: boolean,
  knownParticipantIds: string[],
) {
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({})
  const pendingIce = useRef<Record<string, RTCIceCandidateInit[]>>({})
  const announcedPeers = useRef<Set<string>>(new Set())
  const joinedRef = useRef(false)

  const myUserIdRef = useRef(myUserId)
  const myNameRef = useRef(myName)
  const roomIdRef = useRef(roomId)
  const localStreamRef = useRef(localStream)
  const sendSignalRef = useRef<(msg: VideoRoomSignalingMessage) => void>(() => {})

  useEffect(() => { myUserIdRef.current = myUserId }, [myUserId])
  useEffect(() => { myNameRef.current = myName }, [myName])
  useEffect(() => { roomIdRef.current = roomId }, [roomId])
  useEffect(() => { localStreamRef.current = localStream }, [localStream])

  const removePeer = useCallback((peerId: string) => {
    peerConnections.current[peerId]?.close()
    delete peerConnections.current[peerId]
    delete pendingIce.current[peerId]
    announcedPeers.current.delete(peerId)
    setRemoteStreams((prev) => {
      if (!prev[peerId]) return prev
      const next = { ...prev }
      delete next[peerId]
      return next
    })
  }, [])

  const attachLocalTracks = useCallback((pc: RTCPeerConnection) => {
    const stream = localStreamRef.current
    if (!stream) return
    const senders = pc.getSenders()
    for (const track of stream.getTracks()) {
      const existing = senders.find((s) => s.track?.kind === track.kind)
      if (existing) {
        existing.replaceTrack(track).catch(() => {})
      } else {
        pc.addTrack(track, stream)
      }
    }
  }, [])

  const flushPendingIce = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const queue = pendingIce.current[peerId] ?? []
    pendingIce.current[peerId] = []
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch {
        /* ignore */
      }
    }
  }, [])

  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    pc.onicecandidate = (event) => {
      if (!event.candidate || !myUserIdRef.current || !roomIdRef.current) return
      sendSignalRef.current({
        type: 'ICE_CANDIDATE',
        roomId: roomIdRef.current,
        from: myUserIdRef.current,
        to: peerId,
        candidate: JSON.stringify(event.candidate.toJSON()),
        sdpMid: event.candidate.sdpMid ?? undefined,
        sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined,
      })
    }

    pc.ontrack = (event) => {
      const remoteStream = event.streams?.[0]
      if (!remoteStream) return
      console.log('Remote stream received', peerId, event.streams)
      setRemoteStreams((prev) => ({ ...prev, [peerId]: remoteStream }))
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        console.log('ICE connected', peerId)
      }
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        removePeer(peerId)
      }
    }

    attachLocalTracks(pc)
    peerConnections.current[peerId] = pc
    return pc
  }, [attachLocalTracks, removePeer])

  const makeOffer = useCallback(async (peerId: string) => {
    if (!myUserIdRef.current || !roomIdRef.current) return
    let pc = peerConnections.current[peerId]
    if (!pc) {
      pc = createPeerConnection(peerId)
    } else {
      attachLocalTracks(pc)
    }
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    })
    await pc.setLocalDescription(offer)
    sendSignalRef.current({
      type: 'WEBRTC_OFFER',
      roomId: roomIdRef.current,
      from: myUserIdRef.current,
      to: peerId,
      sdp: offer.sdp,
    })
  }, [attachLocalTracks, createPeerConnection])

  const handlePeerJoined = useCallback((peerId: string) => {
    if (!myUserIdRef.current || peerId === myUserIdRef.current) return
    if (peerConnections.current[peerId]) return

    createPeerConnection(peerId)

    if (shouldOffer(myUserIdRef.current, peerId)) {
      void makeOffer(peerId)
    }
  }, [createPeerConnection, makeOffer])

  const handleSignal = useCallback(async (msg: VideoRoomSignalingMessage) => {
    const peerId = msg.from
    if (!peerId || !myUserIdRef.current || peerId === myUserIdRef.current) return

    switch (msg.type) {
      case 'JOIN_ROOM':
      case 'USER_JOINED': {
        if (!announcedPeers.current.has(peerId)) {
          announcedPeers.current.add(peerId)
          if (myUserIdRef.current && roomIdRef.current) {
            sendSignalRef.current({
              type: 'USER_JOINED',
              roomId: roomIdRef.current,
              from: myUserIdRef.current,
              fromName: myNameRef.current,
            })
          }
        }
        handlePeerJoined(peerId)
        break
      }

      case 'WEBRTC_OFFER': {
        let pc = peerConnections.current[peerId]
        if (!pc) {
          pc = createPeerConnection(peerId)
        } else {
          attachLocalTracks(pc)
        }
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: msg.sdp! }))
        await flushPendingIce(peerId, pc)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendSignalRef.current({
          type: 'WEBRTC_ANSWER',
          roomId: roomIdRef.current!,
          from: myUserIdRef.current!,
          to: peerId,
          sdp: answer.sdp,
        })
        break
      }

      case 'WEBRTC_ANSWER': {
        const pc = peerConnections.current[peerId]
        if (!pc) break
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: msg.sdp! }))
        await flushPendingIce(peerId, pc)
        break
      }

      case 'ICE_CANDIDATE': {
        if (!msg.candidate) break
        const candidate = JSON.parse(msg.candidate) as RTCIceCandidateInit
        const pc = peerConnections.current[peerId]
        if (pc?.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          } catch {
            /* ignore */
          }
        } else {
          if (!pendingIce.current[peerId]) pendingIce.current[peerId] = []
          pendingIce.current[peerId].push(candidate)
        }
        break
      }

      case 'USER_LEFT': {
        removePeer(peerId)
        break
      }
    }
  }, [
    attachLocalTracks,
    createPeerConnection,
    flushPendingIce,
    handlePeerJoined,
    removePeer,
  ])

  const { sendSignal, connected } = useVideoRoomSignaling(roomId, myUserId, handleSignal)
  useEffect(() => { sendSignalRef.current = sendSignal }, [sendSignal])

  useEffect(() => {
    if (!active || !connected || !myUserId || !roomId || !localStream || joinedRef.current) return
    joinedRef.current = true
    console.log('Local stream tracks', localStream.getVideoTracks(), localStream.getAudioTracks())
    sendSignal({
      type: 'JOIN_ROOM',
      roomId,
      from: myUserId,
      fromName: myName,
    })
  }, [active, connected, myUserId, roomId, localStream, myName, sendSignal])

  useEffect(() => {
    if (!myUserId) return
    const activePeers = new Set(
      knownParticipantIds.filter((id) => id !== myUserId),
    )
    for (const peerId of Object.keys(peerConnections.current)) {
      if (!activePeers.has(peerId)) {
        removePeer(peerId)
      }
    }
    for (const peerId of activePeers) {
      if (!announcedPeers.current.has(peerId)) {
        announcedPeers.current.add(peerId)
        handlePeerJoined(peerId)
      }
    }
  }, [knownParticipantIds, myUserId, handlePeerJoined, removePeer])

  useEffect(() => {
    if (!localStream) return
    for (const pc of Object.values(peerConnections.current)) {
      attachLocalTracks(pc)
    }
  }, [localStream, attachLocalTracks])

  useEffect(() => {
    if (active) return
    joinedRef.current = false
    announcedPeers.current.clear()
    for (const peerId of Object.keys(peerConnections.current)) {
      removePeer(peerId)
    }
  }, [active, removePeer])

  const leaveRoom = useCallback(() => {
    if (myUserIdRef.current && roomIdRef.current) {
      sendSignalRef.current({
        type: 'USER_LEFT',
        roomId: roomIdRef.current,
        from: myUserIdRef.current,
      })
    }
    joinedRef.current = false
    announcedPeers.current.clear()
    for (const peerId of Object.keys(peerConnections.current)) {
      removePeer(peerId)
    }
  }, [removePeer])

  useEffect(() => () => {
    leaveRoom()
  }, [leaveRoom])

  return { remoteStreams, connected, leaveRoom }
}
