import { devConnectApi } from './baseApi'

export interface PlatformHealthItem {
  name: string
  status: string
  detail: string
  healthy: boolean
}

export interface PlatformHealth {
  overallStatus: string
  overallLabel: string
  services: PlatformHealthItem[]
}

export const adminPlatformHealthApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getPlatformHealth: build.query<PlatformHealth, void>({
      query: () => '/api/users/admin/platform-health',
      providesTags: [{ type: 'AdminPlatformHealth', id: 'STATUS' }],
    }),
  }),
})

export const { useGetPlatformHealthQuery } = adminPlatformHealthApi
