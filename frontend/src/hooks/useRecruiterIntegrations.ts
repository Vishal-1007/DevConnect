import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { mergeIntegrationCatalog } from '../data/recruiterIntegrations'
import {
  useDisconnectRecruiterIntegrationMutation,
  useGetRecruiterIntegrationsQuery,
  useGetIntegrationOAuthConfigQuery,
  useLazyGetIntegrationOAuthUrlQuery,
} from '../api/recruiterIntegrationsApi'
import {
  loadLocalIntegrationStatuses,
  saveIntegrationStatuses,
} from '../lib/recruiterIntegrationsStore'
import {
  getGoogleOAuthEnvDiagnostics,
  logOAuthDebug,
  logOAuthError,
  mapBackendOAuthConfigError,
  mapOAuthProviderError,
  parseIntegrationApiError,
  validateOAuthBeforeConnect,
} from '../lib/integrationOAuthConfig'
import { getOAuthSuccessMessage } from '../lib/oauthCallback'
import { openOAuthPopup } from '../lib/oauthPopup'
import { hasRecruiterRole } from '../lib/roles'
import type { RootState } from '../store'
import type {
  RecruiterIntegrationProvider,
  RecruiterIntegrationStatus,
  RecruiterIntegrationView,
} from '../types/recruiterIntegration'

type UseRecruiterIntegrationsResult = {
  integrations: RecruiterIntegrationView[]
  loading: boolean
  connectingProvider: RecruiterIntegrationProvider | null
  disconnecting: boolean
  canManageIntegrations: boolean
  connect: (integration: RecruiterIntegrationView) => Promise<string | null>
  disconnect: (provider: RecruiterIntegrationProvider) => Promise<void>
  refreshLocal: () => void
  refetchIntegrations: () => void
}

function formatConnectError(
  integration: RecruiterIntegrationView,
  error: unknown,
): string {
  const parsed = parseIntegrationApiError(error, '')
  const raw = parsed || (error instanceof Error ? error.message : '')
  const configured = mapBackendOAuthConfigError(raw)
  return mapOAuthProviderError(integration.provider, configured, undefined)
}

export function useRecruiterIntegrations(): UseRecruiterIntegrationsResult {
  const roles = useSelector((state: RootState) => state.auth.account?.roles)
  const token = useSelector((state: RootState) => state.auth.accessToken)
  const canManageIntegrations = Boolean(token) && hasRecruiterRole(roles)

  const [localStatuses, setLocalStatuses] = useState<RecruiterIntegrationStatus[]>(() =>
    loadLocalIntegrationStatuses(),
  )
  const [connectingProvider, setConnectingProvider] =
    useState<RecruiterIntegrationProvider | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  const {
    data: apiStatuses,
    isLoading: apiLoading,
    refetch,
  } = useGetRecruiterIntegrationsQuery(undefined, {
    skip: !canManageIntegrations,
  })

  const { data: oauthConfig } = useGetIntegrationOAuthConfigQuery(undefined, {
    skip: !canManageIntegrations,
  })

  useEffect(() => {
    if (apiStatuses) {
      setLocalStatuses(apiStatuses)
      saveIntegrationStatuses(apiStatuses)
    }
  }, [apiStatuses])

  useEffect(() => {
    logOAuthDebug('Client env on mount', getGoogleOAuthEnvDiagnostics())
    if (oauthConfig) {
      logOAuthDebug('Backend OAuth config', oauthConfig)
    }
  }, [oauthConfig])

  const refreshLocal = useCallback(() => {
    setLocalStatuses(loadLocalIntegrationStatuses())
  }, [])

  const statuses = canManageIntegrations && apiStatuses ? apiStatuses : localStatuses

  const integrations = useMemo(
    () => mergeIntegrationCatalog(statuses),
    [statuses],
  )

  const [disconnectApi] = useDisconnectRecruiterIntegrationMutation()
  const [fetchOAuthUrl] = useLazyGetIntegrationOAuthUrlQuery()

  const connect = useCallback(
    async (integration: RecruiterIntegrationView): Promise<string | null> => {
      if (!token) {
        throw new Error('Please sign in to connect integrations')
      }
      if (!hasRecruiterRole(roles)) {
        throw new Error('Only recruiters can connect integrations')
      }
      if (!canManageIntegrations) {
        throw new Error('Recruiter access required to connect integrations')
      }

      validateOAuthBeforeConnect(integration.provider)

      setConnectingProvider(integration.provider)
      try {
        logOAuthDebug('Connect started', {
          provider: integration.provider,
          name: integration.name,
        })

        const response = await fetchOAuthUrl(integration.provider).unwrap()
        logOAuthDebug('Authorization URL generated', {
          provider: integration.provider,
          authorizationUrl: response.authorizationUrl,
        })

        if (!response.authorizationUrl) {
          throw new Error(`${integration.name} OAuth URL was not returned by server`)
        }

        const result = await openOAuthPopup(response.authorizationUrl)
        logOAuthDebug('OAuth callback response', {
          provider: integration.provider,
          result,
        })

        await refetch()

        if (result.status === 'success') {
          const message =
            result.message ??
            getOAuthSuccessMessage(result.provider ?? integration.provider)
          logOAuthDebug('Connect succeeded', { provider: integration.provider, message })
          return message
        }

        const failureMessage = mapOAuthProviderError(
          result.provider ?? integration.provider,
          result.message ?? 'Integration connection failed',
          result.details,
        )
        logOAuthError('Connect failed after callback', {
          provider: integration.provider,
          failureMessage,
          result,
        })
        throw new Error(failureMessage)
      } catch (error) {
        const message = formatConnectError(integration, error)
        logOAuthError('Connect failed', {
          provider: integration.provider,
          message,
          error,
        })
        throw new Error(message)
      } finally {
        setConnectingProvider(null)
      }
    },
    [canManageIntegrations, fetchOAuthUrl, refetch, roles, token],
  )

  const disconnect = useCallback(
    async (provider: RecruiterIntegrationProvider) => {
      if (!hasRecruiterRole(roles)) {
        throw new Error('Only recruiters can disconnect integrations')
      }
      if (!canManageIntegrations) {
        throw new Error('Recruiter access required to disconnect integrations')
      }

      setDisconnecting(true)
      try {
        await disconnectApi(provider).unwrap()
        await refetch()
      } catch (error) {
        throw new Error(parseIntegrationApiError(error, `Failed to disconnect ${provider}`))
      } finally {
        setDisconnecting(false)
      }
    },
    [canManageIntegrations, disconnectApi, refetch, roles],
  )

  return {
    integrations,
    loading: canManageIntegrations && apiLoading,
    connectingProvider,
    disconnecting,
    canManageIntegrations,
    connect,
    disconnect,
    refreshLocal,
    refetchIntegrations: () => {
      void refetch()
    },
  }
}
