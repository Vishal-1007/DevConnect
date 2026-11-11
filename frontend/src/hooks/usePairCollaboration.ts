import { useCallback, useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'

const STOMP_URL = import.meta.env.VITE_WS_STOMP_URL ?? 'ws://localhost:8083/ws/stomp'

export interface PairCollabMessage {
  sessionId: string
  type:
    | 'code-change'
    | 'cursor-move'
    | 'chat-message'
    | 'user-joined'
    | 'user-left'
    | 'video-state-change'
    | 'whiteboard-update'
    | 'note-update'
    | 'typing'
  fromUserId: string
  fromName?: string
  code?: string
  language?: string
  line?: number
  column?: number
  message?: string
  messageType?: string
  noteContent?: string
  whiteboardJson?: string
  micEnabled?: boolean
  cameraEnabled?: boolean
  typing?: boolean
  color?: string
}

export function usePairCollaboration(
  sessionId: string | undefined,
  userId: string | undefined,
  userName: string,
  onMessage: (msg: PairCollabMessage) => void
) {
  const clientRef = useRef<Client | null>(null)
  const onMsgRef = useRef(onMessage)
  useEffect(() => { onMsgRef.current = onMessage }, [onMessage])

  useEffect(() => {
    if (!sessionId || !userId) return

    const client = new Client({
      brokerURL: STOMP_URL,
      reconnectDelay: 4000,
      onConnect: () => {
        client.subscribe(`/topic/pair/${sessionId}`, (frame) => {
          try {
            const msg = JSON.parse(frame.body) as PairCollabMessage
            if (msg.fromUserId !== userId) onMsgRef.current(msg)
          } catch {
            /* ignore */
          }
        })
        publish({
          sessionId,
          type: 'user-joined',
          fromUserId: userId,
          fromName: userName,
        })
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      publish({
        sessionId,
        type: 'user-left',
        fromUserId: userId,
        fromName: userName,
      })
      client.deactivate()
      clientRef.current = null
    }
  }, [sessionId, userId, userName])

  const publish = useCallback((msg: PairCollabMessage) => {
    const client = clientRef.current
    if (!client?.connected) return
    client.publish({
      destination: '/app/pair',
      body: JSON.stringify(msg),
    })
  }, [])

  return { publish }
}
