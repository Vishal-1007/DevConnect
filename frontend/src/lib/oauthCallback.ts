export const OAUTH_CALLBACK_STORAGE_KEY = 'devconnect-oauth-callback-result'

export type OAuthCallbackResult = {
  status: 'success' | 'error'
  provider?: string
  message?: string
  error?: string
  details?: string
}

function decodeParam(value: string | null): string | undefined {
  if (!value) return undefined
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function isTruthy(value: string | null): boolean {
  return value === 'true' || value === '1' || value === 'yes'
}

export function parseOAuthCallbackParams(searchParams: URLSearchParams): OAuthCallbackResult {
  const oauth = searchParams.get('oauth')
  const successParam = searchParams.get('success')
  const errorParam = searchParams.get('error')
  const provider = searchParams.get('provider') ?? undefined
  const details = decodeParam(searchParams.get('details'))
  const message = decodeParam(searchParams.get('message'))

  const success =
    oauth === 'success' ||
    isTruthy(successParam) ||
    (successParam === null && oauth === null && !errorParam && Boolean(message?.toLowerCase().includes('connected')))

  const explicitError =
    oauth === 'error' ||
    successParam === 'false' ||
    isTruthy(searchParams.get('failed'))

  if (explicitError) {
    return {
      status: 'error',
      provider,
      error: errorParam ?? message,
      details,
      message: message ?? errorParam ?? 'Integration connection failed',
    }
  }

  if (errorParam && !success) {
    return {
      status: 'error',
      provider,
      error: errorParam,
      details,
      message: message ?? errorParam,
    }
  }

  if (success && !explicitError) {
    return {
      status: 'success',
      provider,
      details,
      message: message ?? getOAuthSuccessMessage(provider),
    }
  }

  return {
    status: 'error',
    message: message ?? 'Invalid OAuth callback',
    details,
  }
}

export function normalizeOAuthProvider(provider?: string): string | undefined {
  if (!provider) return undefined
  const upper = provider.toUpperCase()
  if (upper === 'GOOGLE' || upper === 'GOOGLE_CALENDAR') return 'GOOGLE_CALENDAR'
  if (upper === 'ZOOM') return 'ZOOM'
  if (upper === 'TEAMS' || upper === 'MICROSOFT' || upper === 'MICROSOFT_TEAMS') {
    return 'MICROSOFT_TEAMS'
  }
  return upper
}

export function getOAuthSuccessMessage(provider?: string): string {
  switch (normalizeOAuthProvider(provider)) {
    case 'GOOGLE_CALENDAR':
      return 'Google Calendar connected successfully'
    case 'ZOOM':
      return 'Zoom connected successfully'
    case 'MICROSOFT_TEAMS':
      return 'Microsoft Teams connected successfully'
    default:
      return 'Integration connected successfully'
  }
}

export function saveOAuthCallbackResult(result: OAuthCallbackResult) {
  try {
    sessionStorage.setItem(OAUTH_CALLBACK_STORAGE_KEY, JSON.stringify(result))
  } catch {
    // ignore storage failures
  }
}

export function consumeOAuthCallbackResult(): OAuthCallbackResult | null {
  try {
    const raw = sessionStorage.getItem(OAUTH_CALLBACK_STORAGE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(OAUTH_CALLBACK_STORAGE_KEY)
    return JSON.parse(raw) as OAuthCallbackResult
  } catch {
    return null
  }
}

export const RECRUITER_INTEGRATIONS_PATH = '/recruiter/settings?tab=integrations'
