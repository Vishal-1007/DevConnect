import { devConnectApi } from './baseApi'

export interface FeatureFlag {
  key: string
  label: string
  description: string
  category: string
  enabled: boolean
  critical: boolean
  updatedByUsername: string
  updatedAt: string
}

export interface FeatureFlagsOverview {
  features: FeatureFlag[]
  enabledCount: number
  totalCount: number
  flags: Record<string, boolean>
}

export const adminFeaturesApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getFeatureFlags: build.query<FeatureFlagsOverview, void>({
      query: () => '/api/users/admin/features',
      providesTags: [{ type: 'AdminFeatures', id: 'LIST' }],
    }),
    toggleFeatureFlag: build.mutation<FeatureFlag, { key: string; enabled: boolean }>({
      query: ({ key, enabled }) => ({
        url: `/api/users/admin/features/${encodeURIComponent(key)}`,
        method: 'PUT',
        body: { enabled },
      }),
      invalidatesTags: [{ type: 'AdminFeatures', id: 'LIST' }, { type: 'PlatformFeatures', id: 'MAP' }],
    }),
  }),
})

export const {
  useGetFeatureFlagsQuery,
  useToggleFeatureFlagMutation,
} = adminFeaturesApi
