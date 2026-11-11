/**
 * Subscribes to lobby-wide room lifecycle events and invalidates the room list cache.
 */
import { useEffect } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { videoRoomsApi } from '../api/videoRoomsApi'
import { useAppDispatch } from '../hooks'

const WS_STOMP_URL = import.meta.env.VITE_WS_STOMP_URL ?? 'http://localhost:8083/ws/stomp'

type LobbyEvent = {
  type: 'ROOM_CREATED' | 'ROOM_JOINED' | 'ROOM_LEFT' | 'ROOM_ENDED'
  roomId: string
}

export function useVideoRoomLobbySync(enabled = true) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!enabled) return

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_STOMP_URL) as WebSocket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/video-rooms/lobby', (frame) => {
          try {
            const event = JSON.parse(frame.body) as LobbyEvent
            if (!event?.type || !event?.roomId) return
            dispatch(
              videoRoomsApi.util.invalidateTags([
                { type: 'VideoRooms', id: 'LIST' },
                { type: 'VideoRooms', id: event.roomId },
                'VideoRoomUsage',
              ])
            )
          } catch {
            /* ignore malformed payloads */
          }
        })
      },
    })

    client.activate()
    return () => {
      client.deactivate()
    }
  }, [dispatch, enabled])
}
