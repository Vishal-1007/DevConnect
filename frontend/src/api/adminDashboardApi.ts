import type { RootState } from '../store'
import { apiUrl } from '../config'
import { devConnectApi } from './baseApi'

export interface ServiceHealth {
  name: string
  ok: boolean
  detail: string
}

const HEALTH_CHECKS: { name: string; path: string; expectAuth?: boolean }[] = [
  { name: 'API Gateway', path: '/actuator/health' },
  { name: 'Auth Service', path: '/api/auth/admin/users', expectAuth: true },
  { name: 'User Service', path: '/api/users/posts?limit=1', expectAuth: true },
  { name: 'Matching Service', path: '/api/matching/requests?limit=1', expectAuth: true },
  { name: 'Notification Svc', path: '/api/notifications?limit=1', expectAuth: true },
  { name: 'Payment Service', path: '/api/payments/config', expectAuth: true },
  { name: 'Mentor Service', path: '/api/mentors/applications', expectAuth: true },
]

async function probe(
  path: string,
  token: string | null,
  expectAuth?: boolean
): Promise<{ ok: boolean; detail: string }> {
  try {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(apiUrl(path), { headers, signal: AbortSignal.timeout(5000) })
    if (res.ok) return { ok: true, detail: 'Operational' }
    if (expectAuth && (res.status === 401 || res.status === 403)) {
      return { ok: true, detail: 'Operational' }
    }
    return { ok: false, detail: `HTTP ${res.status}` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unreachable'
    return { ok: false, detail: msg }
  }
}

export const adminDashboardApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getSystemHealth: build.query<ServiceHealth[], void>({
      queryFn: async (_arg, api) => {
        const state = api.getState() as RootState
        const token = state.auth.accessToken
        const results = await Promise.all(
          HEALTH_CHECKS.map(async ({ name, path, expectAuth }) => {
            const { ok, detail } = await probe(path, token, expectAuth)
            return { name, ok, detail }
          })
        )
        return { data: results }
      },
    }),
  }),
})

export const { useGetSystemHealthQuery } = adminDashboardApi
