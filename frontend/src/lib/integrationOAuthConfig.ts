import type { RecruiterIntegrationProvider } from '../types/recruiterIntegration'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI?.trim() ?? ''

export type OAuthEnvDiagnostics = {
  clientIdLoaded: boolean
  redirectUriLoaded: boolean
  redirectUri: string
  clientIdPreview: string | null
  warnings: string[]
}

export function getGoogleOAuthEnvDiagnostics(): OAuthEnvDiagnostics {
  const redirectUri =
    GOOGLE_REDIRECT_URI ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/recruiter/oauth/callback`
      : 'http://localhost:5173/recruiter/oauth/callback')

  const warnings: string[] = []
  if (!GOOGLE_CLIENT_ID) {
    warnings.push(
      'VITE_GOOGLE_CLIENT_ID is not set in frontend/.env — backend OAuth will still be attempted',
    )
  }
  if (!GOOGLE_REDIRECT_URI) {
    warnings.push(`VITE_GOOGLE_REDIRECT_URI not set — using ${redirectUri}`)
  }

  return {
    clientIdLoaded: Boolean(GOOGLE_CLIENT_ID),
    redirectUriLoaded: Boolean(GOOGLE_REDIRECT_URI),
    redirectUri,
    clientIdPreview: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.slice(0, 12)}...` : null,
    warnings,
  }
}

export function logOAuthDebug(label: string, payload?: unknown) {
  if (import.meta.env.DEV) {
    console.log(`[DevConnect OAuth] ${label}`, payload ?? '')
  }
}

export function logOAuthError(label: string, payload?: unknown) {
  if (import.meta.env.DEV) {
    console.error(`[DevConnect OAuth] ${label}`, payload ?? '')
  }
}

/** Frontend env hints only — real OAuth config is validated by the backend. */
export function validateOAuthBeforeConnect(provider: RecruiterIntegrationProvider): string | null {
  const diagnostics = getGoogleOAuthEnvDiagnostics()
  logOAuthDebug('Environment diagnostics', { provider, ...diagnostics })
  return null
}

export function getOAuthPopupCallbackUrl(): string {
  return getGoogleOAuthEnvDiagnostics().redirectUri
}

export type IntegrationApiErrorBody = {
  success?: boolean
  message?: string
  error?: string
  details?: string
  status?: number
  path?: string
}

function readErrorBody(data: unknown): IntegrationApiErrorBody | null {
  if (!data) return null
  if (typeof data === 'string') {
    const trimmed = data.trim()
    if (!trimmed) return null
    try {
      const parsed = JSON.parse(trimmed) as IntegrationApiErrorBody
      return parsed.message || parsed.details ? parsed : { message: trimmed }
    } catch {
      return { message: trimmed }
    }
  }
  if (typeof data === 'object') {
    return data as IntegrationApiErrorBody
  }
  return null
}

export function formatIntegrationErrorMessage(
  message: string,
  details?: string | null,
): string {
  const base = message.trim()
  const extra = details?.trim()
  if (!extra || base.includes(extra)) {
    return base
  }
  return `${base} (${extra})`
}

export function parseIntegrationApiError(error: unknown, fallback: string): string {
  logOAuthDebug('Parsing integration API error', error)

  if (error && typeof error === 'object') {
    const candidate = error as {
      status?: number
      data?: unknown
      error?: string | { status?: number; data?: unknown }
    }

    if (candidate.error && typeof candidate.error === 'object') {
      const nested = parseIntegrationApiError(candidate.error, '')
      if (nested) return nested
    }

    if ('data' in candidate) {
      const body = readErrorBody(candidate.data)
      if (body) {
        if (body.success === false && body.message) {
          return formatIntegrationErrorMessage(body.message, body.details)
        }
        if (body.message) {
          return formatIntegrationErrorMessage(body.message, body.details)
        }
        if (body.error && typeof body.error === 'string') {
          return body.error
        }
      }
    }

    if ('status' in candidate && 'data' in candidate) {
      const body = readErrorBody(candidate.data)
      if (body?.message) {
        return formatIntegrationErrorMessage(body.message, body.details)
      }
    }
  }

  if (error instanceof Error && error.message && error.message !== 'Rejected') {
    return error.message
  }

  return fallback
}

export function mapOAuthProviderError(
  provider: RecruiterIntegrationProvider | string | undefined,
  message: string,
  details?: string | null,
): string {
  const formatted = formatIntegrationErrorMessage(message, details)
  const lower = formatted.toLowerCase()
  const providerLabel =
    provider === 'GOOGLE_CALENDAR' || provider === 'GOOGLE'
      ? 'Google Calendar'
      : provider === 'ZOOM'
        ? 'Zoom'
        : provider === 'MICROSOFT_TEAMS'
          ? 'Microsoft Teams'
          : 'Integration'

  if (lower.includes('invalid_grant') || details === 'invalid_grant') {
    return `${providerLabel} OAuth session expired or was already used. Close other OAuth tabs, sign out of ${providerLabel} in this browser, or retry in a private window.`
  }
  if (lower.includes('invalid_redirect_uri') || details === 'invalid_redirect_uri') {
    return `${providerLabel} OAuth failed: invalid redirect_uri — verify the callback URL in your OAuth app settings.`
  }
  if (lower.includes('invalid_client') || details === 'invalid_client') {
    return `${providerLabel} OAuth failed: invalid client secret or client ID on the server.`
  }
  if (lower.includes('access_denied') || details === 'access_denied') {
    return `${providerLabel} authorization was denied.`
  }
  if (lower.includes('popup blocked')) {
    return formatted
  }
  if (lower.includes('oauth window closed before connection completed')) {
    return `${providerLabel} OAuth was cancelled or the popup closed before completion.`
  }
  if (lower.includes('timed out')) {
    return `${providerLabel} OAuth timed out. Please try again.`
  }

  return formatted.startsWith(providerLabel) ? formatted : `${providerLabel}: ${formatted}`
}

export function mapBackendOAuthConfigError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('google client id') || lower.includes('google_client_id')) {
    return 'Missing Google Client ID — set GOOGLE_CLIENT_ID in payment-service environment'
  }
  if (lower.includes('google client secret') || lower.includes('google_client_secret')) {
    return 'Missing Google Client Secret — set GOOGLE_CLIENT_SECRET in payment-service environment'
  }
  if (lower.includes('zoom client id')) {
    return 'Missing Zoom Client ID — set ZOOM_CLIENT_ID in payment-service environment'
  }
  if (lower.includes('zoom client secret')) {
    return 'Missing Zoom Client Secret — set ZOOM_CLIENT_SECRET in payment-service environment'
  }
  if (lower.includes('setup incomplete') || lower.includes('not configured')) {
    return 'OAuth is not configured on the server. Set provider credentials and restart payment-service.'
  }
  return message
}
