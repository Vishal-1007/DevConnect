import { devConnectApi } from './baseApi'

export interface SessionReport {
  id: string
  reason: string
  details: string | null
  reporterLabel: string
  createdAt: string
}

export interface PlatformSession {
  id: string
  sessionType: string
  title: string
  description: string | null
  hostId: string
  hostDisplayName: string
  status: string
  participantCount: number
  maxParticipants: number
  qualityScore: number
  durationSeconds: number
  durationLabel: string
  recordingUrl: string | null
  recordingAvailable: boolean
  aiModerationEnabled: boolean
  moderationStatus: string
  reportCount: number
  linkedRoomId: string | null
  linkedMatchRequestId: string | null
  startedAt: string
  endedAt: string | null
  reports: SessionReport[]
}

export interface UpdatePlatformSession {
  qualityScore?: number
  recordingAvailable?: boolean
  recordingUrl?: string
  aiModerationEnabled?: boolean
  moderationStatus?: string
}

export interface CreateSessionReport {
  reason: string
  details?: string
}

function normalizeSession(s: PlatformSession): PlatformSession {
  return {
    ...s,
    sessionType: s.sessionType ?? 'video_call',
    moderationStatus: s.moderationStatus ?? 'clear',
    reports: s.reports ?? [],
    recordingAvailable: s.recordingAvailable ?? false,
    aiModerationEnabled: s.aiModerationEnabled ?? true,
  }
}

export const adminSessionsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listAdminSessions: build.query<
      PlatformSession[],
      { status?: string; sessionType?: string; q?: string; limit?: number } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('status', params.status ?? 'all')
        if (params.sessionType && params.sessionType !== 'all') {
          search.set('sessionType', params.sessionType)
        }
        if (params.q?.trim()) search.set('q', params.q.trim())
        search.set('limit', String(params.limit ?? 100))
        return `/api/users/admin/sessions?${search.toString()}`
      },
      transformResponse: (response: PlatformSession[]) => response.map(normalizeSession),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminSessions' as const, id })),
              { type: 'AdminSessions', id: 'LIST' },
            ]
          : [{ type: 'AdminSessions', id: 'LIST' }],
    }),
    getAdminSession: build.query<PlatformSession, string>({
      query: (id) => `/api/users/admin/sessions/${id}`,
      transformResponse: normalizeSession,
      providesTags: (_r, _e, id) => [{ type: 'AdminSessions', id }],
    }),
    updateAdminSession: build.mutation<PlatformSession, { id: string; body: UpdatePlatformSession }>({
      query: ({ id, body }) => ({
        url: `/api/users/admin/sessions/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AdminSessions', id },
        { type: 'AdminSessions', id: 'LIST' },
      ],
    }),
    endAdminSession: build.mutation<PlatformSession, string>({
      query: (id) => ({
        url: `/api/users/admin/sessions/${id}/end`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AdminSessions', id },
        { type: 'AdminSessions', id: 'LIST' },
        { type: 'VideoRooms', id: 'LIST' },
      ],
    }),
    addSessionReport: build.mutation<PlatformSession, { id: string; body: CreateSessionReport }>({
      query: ({ id, body }) => ({
        url: `/api/users/admin/sessions/${id}/reports`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'AdminSessions', id }, { type: 'AdminSessions', id: 'LIST' }],
    }),
    runSessionAiModeration: build.mutation<PlatformSession, string>({
      query: (id) => ({
        url: `/api/users/admin/sessions/${id}/ai-moderation`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [{ type: 'AdminSessions', id }, { type: 'AdminSessions', id: 'LIST' }],
    }),
  }),
})

export const {
  useListAdminSessionsQuery,
  useGetAdminSessionQuery,
  useUpdateAdminSessionMutation,
  useEndAdminSessionMutation,
  useAddSessionReportMutation,
  useRunSessionAiModerationMutation,
} = adminSessionsApi
