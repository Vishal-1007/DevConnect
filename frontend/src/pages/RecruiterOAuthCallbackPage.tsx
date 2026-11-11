import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { recruiterIntegrationsApi } from '../api/recruiterIntegrationsApi'
import { useAppDispatch } from '../hooks'
import { logOAuthDebug, logOAuthError, mapOAuthProviderError } from '../lib/integrationOAuthConfig'
import {
  getOAuthSuccessMessage,
  parseOAuthCallbackParams,
} from '../lib/oauthCallback'
import { publishOAuthPopupResult } from '../lib/oauthPopupBridge'

export function RecruiterOAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const result = parseOAuthCallbackParams(searchParams)
    logOAuthDebug('Callback page received', {
      rawQuery: searchParams.toString(),
      parsed: result,
    })

    const popupMessage =
      result.status === 'success'
        ? (result.message ?? getOAuthSuccessMessage(result.provider))
        : mapOAuthProviderError(
            result.provider,
            result.message ?? result.error ?? 'Integration connection failed',
            result.details,
          )

    const popupResult = {
      status: result.status,
      provider: result.provider,
      message: popupMessage,
      details: result.details,
    }

    if (result.status === 'error') {
      logOAuthError('OAuth callback error', popupResult)
    }

    publishOAuthPopupResult(popupResult)
    logOAuthDebug('Published OAuth popup result', popupResult)

    dispatch(
      recruiterIntegrationsApi.util.invalidateTags([{ type: 'RecruiterIntegrations', id: 'LIST' }]),
    )

    window.setTimeout(() => {
      window.close()
    }, 300)
  }, [dispatch, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0c14] p-6 text-center text-white">
      <div>
        <p className="text-lg font-semibold">Completing connection...</p>
        <p className="mt-2 text-sm text-[#8b8ca8]">This window will close automatically.</p>
      </div>
    </div>
  )
}

/** Alias for OAuth callback route component. */
export const OAuthCallback = RecruiterOAuthCallbackPage
