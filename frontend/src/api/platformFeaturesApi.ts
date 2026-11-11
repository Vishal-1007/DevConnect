import { devConnectApi } from './baseApi'

export const platformFeaturesApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getPlatformFeatures: build.query<Record<string, boolean>, void>({
      query: () => '/api/users/platform/features',
      providesTags: [{ type: 'PlatformFeatures', id: 'MAP' }],
    }),
  }),
})

export const { useGetPlatformFeaturesQuery } = platformFeaturesApi

export function isFeatureEnabled(flags: Record<string, boolean> | undefined, key: string): boolean {
  if (!flags) return true
  return flags[key] !== false
}
