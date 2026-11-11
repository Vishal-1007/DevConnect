import {
  consumeStoredOAuthPopupResult,
  isOAuthPopupPayload,
  OAUTH_BROADCAST_CHANNEL,
  OAUTH_LOCAL_STORAGE_KEY,
  OAUTH_MESSAGE_TYPE,
  payloadToPopupResult,
  publishOAuthPopupResult,
  type OAuthPopupPayload,
} from './oauthPopupBridge'

export type OAuthPopupResult = {
  status: 'success' | 'error'
  provider?: string
  message?: string
  details?: string
}

export { OAUTH_MESSAGE_TYPE }

export function postOAuthResultToOpener(result: OAuthPopupResult): boolean {
  return publishOAuthPopupResult(result)
}

export function openOAuthPopup(authorizationUrl: string): Promise<OAuthPopupResult> {
  return new Promise((resolve, reject) => {
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      authorizationUrl,
      'devconnect-oauth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`,
    )

    if (!popup) {
      reject(new Error('Popup blocked. Allow popups to connect integrations.'))
      return
    }

    let settled = false
    let broadcastChannel: BroadcastChannel | null = null

    const timeout = window.setTimeout(() => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error('OAuth connection timed out after 2 minutes'))
    }, 120_000)

    function cleanup() {
      window.clearTimeout(timeout)
      window.removeEventListener('message', onMessage)
      window.removeEventListener('storage', onStorage)
      window.clearInterval(closedCheck)
      window.clearInterval(storagePoll)
      try {
        broadcastChannel?.close()
      } catch {
        // ignore
      }
      broadcastChannel = null
    }

    function finish(result: OAuthPopupResult) {
      if (settled) return
      settled = true
      cleanup()
      try {
        popup.close()
      } catch {
        // ignore
      }
      resolve(result)
    }

    function fail(message: string) {
      if (settled) return
      settled = true
      cleanup()
      try {
        popup.close()
      } catch {
        // ignore
      }
      reject(new Error(message))
    }

    function handlePayload(data: unknown) {
      if (!isOAuthPopupPayload(data)) return
      if (import.meta.env.DEV) {
        console.log('[DevConnect OAuth] Parent received popup result', data)
      }
      finish(payloadToPopupResult(data))
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      handlePayload(event.data)
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== OAUTH_LOCAL_STORAGE_KEY || !event.newValue) return
      try {
        handlePayload(JSON.parse(event.newValue) as OAuthPopupPayload)
      } catch {
        // ignore parse errors
      }
    }

    const storagePoll = window.setInterval(() => {
      if (settled) return
      const stored = consumeStoredOAuthPopupResult()
      if (stored) {
        handlePayload(stored)
      }
    }, 400)

    try {
      broadcastChannel = new BroadcastChannel(OAUTH_BROADCAST_CHANNEL)
      broadcastChannel.onmessage = (event: MessageEvent<OAuthPopupPayload>) => {
        handlePayload(event.data)
      }
    } catch {
      broadcastChannel = null
    }

    let closeGraceScheduled = false

    const closedCheck = window.setInterval(() => {
      if (settled || !popup.closed || closeGraceScheduled) return
      closeGraceScheduled = true
      window.setTimeout(() => {
        if (settled) return
        const stored = consumeStoredOAuthPopupResult()
        if (stored) {
          handlePayload(stored)
          return
        }
        fail('OAuth window closed before connection completed')
      }, 1200)
    }, 400)

    window.addEventListener('message', onMessage)
    window.addEventListener('storage', onStorage)
  })
}
