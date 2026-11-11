import type {
  RecruiterIntegrationProvider,
  RecruiterIntegrationStatus,
} from '../types/recruiterIntegration'
import type { IntegrationSyncSettingsResponse } from '../types/integrationSyncSettings'
import { devConnectApi } from './baseApi'

export const recruiterIntegrationsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getRecruiterIntegrations: build.query<RecruiterIntegrationStatus[], void>({
      query: () => '/api/recruiter/integrations',
      providesTags: [{ type: 'RecruiterIntegrations', id: 'LIST' }],
    }),
    disconnectRecruiterIntegration: build.mutation<void, RecruiterIntegrationProvider>({
      query: (provider) => ({
        url: `/api/recruiter/integrations/${provider}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'RecruiterIntegrations', id: 'LIST' }],
    }),
    getIntegrationSyncSettings: build.query<
      IntegrationSyncSettingsResponse,
      RecruiterIntegrationProvider
    >({
      query: (provider) => `/api/recruiter/integrations/${provider}/settings`,
      providesTags: (_result, _error, provider) => [
        { type: 'RecruiterIntegrations', id: `SYNC_${provider}` },
      ],
    }),
    updateIntegrationSyncSettings: build.mutation<
      IntegrationSyncSettingsResponse,
      { provider: RecruiterIntegrationProvider; settings: Record<string, unknown> }
    >({
      query: ({ provider, settings }) => ({
        url: `/api/recruiter/integrations/${provider}/settings`,
        method: 'PUT',
        body: { settings },
      }),
      invalidatesTags: (_result, _error, { provider }) => [
        { type: 'RecruiterIntegrations', id: `SYNC_${provider}` },
      ],
    }),
    getIntegrationOAuthUrl: build.query<
      { authorizationUrl: string },
      RecruiterIntegrationProvider
    >({
      query: (provider) => `/api/recruiter/integrations/${provider}/oauth/url`,
    }),
    getIntegrationOAuthConfig: build.query<
      Record<
        RecruiterIntegrationProvider,
        { configured: boolean; message: string; redirectUri: string }
      >,
      void
    >({
      query: () => '/api/recruiter/integrations/oauth/config',
    }),
    testIntegrationConnection: build.mutation<
      { success: boolean; message: string; connectedEmail: string | null },
      RecruiterIntegrationProvider
    >({
      query: (provider) => ({
        url: `/api/recruiter/integrations/${provider}/test`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'RecruiterIntegrations', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetRecruiterIntegrationsQuery,
  useDisconnectRecruiterIntegrationMutation,
  useGetIntegrationSyncSettingsQuery,
  useUpdateIntegrationSyncSettingsMutation,
  useLazyGetIntegrationOAuthUrlQuery,
  useGetIntegrationOAuthConfigQuery,
  useTestIntegrationConnectionMutation,
} = recruiterIntegrationsApi
