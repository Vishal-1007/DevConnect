/**
 * useSignaling — STOMP over native WebSocket for WebRTC signaling.
 *
 * Connects DIRECTLY to chat-service on port 8083 using a native browser
 * WebSocket (no SockJS, no Vite proxy).  This eliminates the ECONNRESET
 * errors that occurred when SockJS's multi-request handshake was forwarded
 * through Vite's ws proxy.
 *
 * chat-service already permits origin localhost:5174 in WebSocketConfig.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'

export interface SignalingMessage {
  type:
    | 'call-request' | 'call-accept' | 'call-reject' | 'offer' | 'answer' | 'ice'
    | 'match-request' | 'match-assigned' | 'match-accepted' | 'match-rejected'
    | 'match-expired' | 'match-cancelled' | 'match-ended'
  from: string
  to: string
  fromName?: string
  sdp?: string
  candidate?: string
  sdpMid?: string
  sdpMLineIndex?: number
  assignmentId?: string
  criteria?: string
  partnerRole?: string
  status?: string
}

// Native WebSocket URL — goes directly to chat-service, skipping the proxy.
// In production override with VITE_WS_STOMP_URL (e.g. wss://api.example.com/ws/stomp).
const STOMP_URL = import.meta.env.VITE_WS_STOMP_URL ?? 'ws://localhost:8083/ws/stomp'

export function useSignaling(
  myUserId: string | undefined,
  onMessage: (msg: SignalingMessage) => void,
) {
  const [connected, setConnected] = useState(false)
  const clientRef   = useRef<Client | null>(null)
  const onMsgRef    = useRef(onMessage)
  useEffect(() => { onMsgRef.current = onMessage }, [onMessage])

  useEffect(() => {
    if (!myUserId) return

    const client = new Client({
      brokerURL: STOMP_URL,           // native WebSocket — no SockJS
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        setConnected(true)
        client.subscribe(`/topic/signal/${myUserId}`, (frame) => {
          try {
            const msg: SignalingMessage = JSON.parse(frame.body)
            onMsgRef.current(msg)
          } catch {
            /* ignore malformed frames */
          }
        })
      },

      onDisconnect:  () => setConnected(false),
      onStompError:  () => setConnected(false),
      onWebSocketError: (e) => {
        console.warn('[useSignaling] WebSocket error', e)
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
  }, [myUserId])

  const sendSignal = useCallback((msg: SignalingMessage) => {
    const c = clientRef.current
    if (!c?.connected) {
      console.warn('[useSignaling] sendSignal called but STOMP not connected')
      return
    }
    c.publish({ destination: '/app/signal', body: JSON.stringify(msg) })
  }, [])

  return { sendSignal, connected }
}
