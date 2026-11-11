import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { logOAuthDebug } from '../lib/integrationOAuthConfig'
import { getOAuthSuccessMessage, parseOAuthCallbackParams } from '../lib/oauthCallback'
import { publishOAuthPopupResult } from '../lib/oauthPopupBridge'

type Props = {
  status: 'success' | 'error'
}

/**
 * Minimal OAuth result page for popup flows.
 * Notifies the opener via postMessage / BroadcastChannel, then closes.
 */
export function OAuthResultPage({ status }: Props) {
  const [searchParams] = useSearchParams()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const parsed = parseOAuthCallbackParams(searchParams)
    const resultStatus = status === 'success' ? 'success' : 'error'
    const message =
      parsed.message ??
      (resultStatus === 'success'
        ? getOAuthSuccessMessage(parsed.provider)
        : parsed.error ?? 'Integration connection failed')

    const popupResult = {
      status: resultStatus,
      provider: parsed.provider,
      message,
      details: parsed.details,
    }

    logOAuthDebug('OAuth result page', {
      path: status,
      rawQuery: searchParams.toString(),
      popupResult,
    })

    publishOAuthPopupResult(popupResult)

    window.setTimeout(() => {
      window.close()
    }, 300)
  }, [searchParams, status])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0c14] p-6 text-center text-white">
      <div>
        <p className="text-lg font-semibold">
          {status === 'success' ? 'Connection successful' : 'Connection failed'}
        </p>
        <p className="mt-2 text-sm text-[#8b8ca8]">This window will close automatically.</p>
      </div>
    </div>
  )
}

/** @deprecated Use OAuthResultPage — kept for compatibility with user naming. */
export function OAuthSuccess() {
  return <OAuthResultPage status="success" />
}

export function OAuthSuccessPage() {
  return <OAuthResultPage status="success" />
}

export function OAuthErrorPage() {
  return <OAuthResultPage status="error" />
}
