/**
 * STOMP signaling for multi-party video rooms.
 * Subscribe: /topic/video-room/{roomId}
 * Publish:    /app/video-room
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'

export type VideoRoomSignalType =
  | 'JOIN_ROOM'
  | 'USER_JOINED'
  | 'WEBRTC_OFFER'
  | 'WEBRTC_ANSWER'
  | 'ICE_CANDIDATE'
  | 'USER_LEFT'
  | 'JOIN_REQUEST'
  | 'JOIN_APPROVED'
  | 'JOIN_REJECTED'
  | 'MUTE_USER'
  | 'CAMERA_OFF'
  | 'REMOVE_USER'
  | 'ROOM_ENDED'

export interface VideoRoomSignalingMessage {
  type: VideoRoomSignalType
  roomId: string
  from?: string
  to?: string
  fromName?: string
  targetUserId?: string
  sdp?: string
  candidate?: string
  sdpMid?: string
  sdpMLineIndex?: number
}

const STOMP_URL = import.meta.env.VITE_WS_STOMP_URL ?? 'ws://localhost:8083/ws/stomp'

export function useVideoRoomSignaling(
  roomId: string | undefined,
  myUserId: string | undefined,
  onMessage: (msg: VideoRoomSignalingMessage) => void,
) {
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const onMsgRef = useRef(onMessage)
  useEffect(() => { onMsgRef.current = onMessage }, [onMessage])

  useEffect(() => {
    if (!roomId || !myUserId) return

    const client = new Client({
      brokerURL: STOMP_URL,
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true)
        client.subscribe(`/topic/video-room/${roomId}`, (frame) => {
          try {
            const msg = JSON.parse(frame.body) as VideoRoomSignalingMessage
            const hostControlTypes = new Set([
              'JOIN_REQUEST',
              'JOIN_APPROVED',
              'JOIN_REJECTED',
              'MUTE_USER',
              'CAMERA_OFF',
              'REMOVE_USER',
              'ROOM_ENDED',
            ])
            if (!hostControlTypes.has(msg.type)) {
              if (msg.from === myUserId) return
              if (msg.to && msg.to !== myUserId) return
            } else if (msg.to && msg.to !== myUserId) {
              return
            }
            onMsgRef.current(msg)
          } catch {
            /* ignore malformed frames */
          }
        })
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketError: (e) => {
        console.warn('[useVideoRoomSignaling] WebSocket error', e)
        setConnected(false)
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
      setConnected(false)
    }
  }, [roomId, myUserId])

  const sendSignal = useCallback((msg: VideoRoomSignalingMessage) => {
    const c = clientRef.current
    if (!c?.connected) {
      console.warn('[useVideoRoomSignaling] sendSignal called but STOMP not connected')
      return
    }
    c.publish({ destination: '/app/video-room', body: JSON.stringify(msg) })
  }, [])

  return { sendSignal, connected }
}
