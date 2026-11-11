import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import { devConnectApi } from '../api/baseApi'
import { useAppDispatch, useAppSelector } from '../hooks'

const STOMP_URL = import.meta.env.VITE_WS_STOMP_URL ?? 'ws://localhost:8083/ws/stomp'

/** Subscribes to real-time notification pushes and refreshes the inbox cache. */
export function useNotificationStream() {
  const dispatch = useAppDispatch()
  const userId = useAppSelector((s) => s.auth.account?.id)
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!userId) return

    const client = new Client({
      brokerURL: STOMP_URL,
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        client.subscribe(`/topic/notifications/${userId}`, () => {
          dispatch(
            devConnectApi.util.invalidateTags([
              { type: 'Notifications', id: 'LIST' },
              { type: 'Notifications', id: 'UNREAD' },
            ])
          )
        })
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
    }
  }, [dispatch, userId])
}
