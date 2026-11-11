import type { OAuthPopupResult } from './oauthPopup'

export const OAUTH_MESSAGE_TYPE = 'devconnect-oauth-result'
export const OAUTH_BROADCAST_CHANNEL = 'devconnect-oauth'
export const OAUTH_LOCAL_STORAGE_KEY = 'devconnect-oauth-popup-result'

export type OAuthPopupPayload = OAuthPopupResult & {
  type: typeof OAUTH_MESSAGE_TYPE
  timestamp: number
}

export function buildOAuthPopupPayload(result: OAuthPopupResult): OAuthPopupPayload {
  return {
    type: OAUTH_MESSAGE_TYPE,
    timestamp: Date.now(),
    ...result,
  }
}

export function publishOAuthPopupResult(result: OAuthPopupResult): boolean {
  const payload = buildOAuthPopupPayload(result)

  try {
    localStorage.setItem(OAUTH_LOCAL_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage failures
  }

  try {
    const channel = new BroadcastChannel(OAUTH_BROADCAST_CHANNEL)
    channel.postMessage(payload)
    channel.close()
  } catch {
    // ignore broadcast failures
  }

  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(payload, window.location.origin)
    return true
  }

  return false
}

export function consumeStoredOAuthPopupResult(): OAuthPopupPayload | null {
  try {
    const raw = localStorage.getItem(OAUTH_LOCAL_STORAGE_KEY)
    if (!raw) return null
    localStorage.removeItem(OAUTH_LOCAL_STORAGE_KEY)
    return JSON.parse(raw) as OAuthPopupPayload
  } catch {
    return null
  }
}

export function payloadToPopupResult(payload: OAuthPopupPayload): OAuthPopupResult {
  return {
    status: payload.status,
    provider: payload.provider,
    message: payload.message,
    details: payload.details,
  }
}

export function isOAuthPopupPayload(data: unknown): data is OAuthPopupPayload {
  if (!data || typeof data !== 'object') return false
  const candidate = data as { type?: string; status?: string }
  return candidate.type === OAUTH_MESSAGE_TYPE && Boolean(candidate.status)
}
