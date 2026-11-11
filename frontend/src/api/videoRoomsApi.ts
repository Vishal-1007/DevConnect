import type {
  CreateBreakoutRoom,
  CreateVideoRoom,
  UpdateVideoRoomPermissions,
  VideoRoom,
  VideoRoomJoinPreview,
  VideoRoomLimitCheck,
  VideoRoomMessage,
  VideoRoomOrder,
  VideoRoomParticipant,
  VideoRoomUsage,
} from './types'
import { devConnectApi } from './baseApi'

function normalizeParticipant(p: VideoRoomParticipant): VideoRoomParticipant {
  return {
    ...p,
    participantRole: p.participantRole ?? (p.host ? 'HOST' : 'PARTICIPANT'),
    joinStatus: p.joinStatus ?? 'ACTIVE',
    muted: p.muted ?? false,
    cameraEnabled: p.cameraEnabled ?? true,
    canSpeak: p.canSpeak ?? true,
    handRaised: p.handRaised ?? false,
  }
}

export function normalizeVideoRoom(room: VideoRoom): VideoRoom {
  return {
    ...room,
    roomType: room.roomType ?? 'public',
    useCase: room.useCase ?? 'community',
    parentRoomId: room.parentRoomId ?? null,
    chatEnabled: room.chatEnabled ?? true,
    screenShareEnabled: room.screenShareEnabled ?? true,
    breakoutEnabled: room.breakoutEnabled ?? false,
    featured: room.featured ?? false,
    featuredOrder: room.featuredOrder ?? 0,
    visibility: room.visibility ?? 'public',
    moderatorId: room.moderatorId ?? null,
    moderatorDisplayName: room.moderatorDisplayName ?? null,
    participants: (room.participants ?? []).map(normalizeParticipant),
    breakouts: (room.breakouts ?? []).map(normalizeVideoRoom),
    roomCode: room.roomCode ?? null,
    joinUrl: room.joinUrl ?? null,
    joinPath: room.joinPath ?? null,
    expiresAt: room.expiresAt ?? null,
    premiumRoom: room.premiumRoom ?? false,
    remainingSeconds: room.remainingSeconds ?? null,
    viewerHasVideoRoomPremium: room.viewerHasVideoRoomPremium ?? false,
    freeTierRoom: room.freeTierRoom ?? false,
    nextFreeRoomAvailableAt: room.nextFreeRoomAvailableAt ?? null,
    expiredDueToTimeLimit: room.expiredDueToTimeLimit ?? false,
    viewerJoinStatus: room.viewerJoinStatus ?? null,
    waitingParticipants: (room.waitingParticipants ?? []).map(normalizeParticipant),
  }
}

export const videoRoomsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    getVideoRoomUsage: build.query<VideoRoomUsage, void>({
      query: () => '/api/users/video-rooms/usage',
      providesTags: ['VideoRoomUsage'],
    }),
    checkVideoRoomLimit: build.query<VideoRoomLimitCheck, void>({
      query: () => '/api/users/video-rooms/check-limit/me',
      providesTags: ['VideoRoomUsage'],
    }),
    getVideoRoomJoinPreview: build.query<VideoRoomJoinPreview, string>({
      query: (roomCode) => `/api/users/video-rooms/join/${encodeURIComponent(roomCode)}/preview`,
    }),
    joinVideoRoomByCode: build.mutation<VideoRoom, string>({
      query: (roomCode) => ({
        url: `/api/users/video-rooms/join/${encodeURIComponent(roomCode)}`,
        method: 'POST',
      }),
      transformResponse: (response: VideoRoom) => normalizeVideoRoom(response),
      invalidatesTags: (_result, _error, roomCode) => [
        { type: 'VideoRooms', id: 'LIST' },
        { type: 'VideoRooms', id: roomCode },
        { type: 'UserStats', id: 'ME' },
      ],
    }),
    createVideoRoomProOrder: build.mutation<VideoRoomOrder, void>({
      query: () => ({
        url: '/api/users/video-rooms/payment/create-order',
        method: 'POST',
      }),
    }),
    confirmVideoRoomProPayment: build.mutation<VideoRoomUsage, { paymentId: string }>({
      query: (body) => ({
        url: '/api/users/video-rooms/payment/confirm',
        method: 'POST',
        body: { paymentId: body.paymentId },
      }),
      invalidatesTags: ['VideoRoomUsage', { type: 'VideoRooms', id: 'LIST' }],
    }),
    getVideoRoomAdminAnalytics: build.query<
      {
        totalRoomsCreated: number
        activeRooms: number
        premiumUsers: number
        completedPayments: number
        revenueCents: number
        expiredRooms: number
      },
      void
    >({
      query: () => '/api/users/admin/video-rooms/analytics',
      providesTags: ['AdminAnalytics'],
    }),
    listLiveVideoRooms: build.query<
      VideoRoom[],
      { category?: string; q?: string; limit?: number } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        if (params.category && params.category !== 'all') search.set('category', params.category)
        if (params.q?.trim()) search.set('q', params.q.trim())
        search.set('limit', String(params.limit ?? 50))
        const qs = search.toString()
        return `/api/users/video-rooms/live${qs ? `?${qs}` : ''}`
      },
      transformResponse: (response: VideoRoom[]) => response.map(normalizeVideoRoom),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'VideoRooms' as const, id })),
              { type: 'VideoRooms', id: 'LIST' },
            ]
          : [{ type: 'VideoRooms', id: 'LIST' }],
    }),
    listVideoRooms: build.query<
      VideoRoom[],
      { status?: string; category?: string; roomType?: string; q?: string; limit?: number } | undefined
    >({
      query: (params = {}) => {
        const search = new URLSearchParams()
        search.set('status', params.status ?? 'live')
        if (params.category && params.category !== 'all') search.set('category', params.category)
        if (params.roomType && params.roomType !== 'all') search.set('roomType', params.roomType)
        if (params.q?.trim()) search.set('q', params.q.trim())
        search.set('limit', String(params.limit ?? 50))
        return `/api/users/video-rooms?${search.toString()}`
      },
      transformResponse: (response: VideoRoom[]) => response.map(normalizeVideoRoom),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'VideoRooms' as const, id })),
              { type: 'VideoRooms', id: 'LIST' },
            ]
          : [{ type: 'VideoRooms', id: 'LIST' }],
    }),
    getVideoRoom: build.query<VideoRoom, string>({
      query: (id) => `/api/users/video-rooms/${id}`,
      transformResponse: (response: VideoRoom) => normalizeVideoRoom(response),
      providesTags: (_result, _error, id) => [{ type: 'VideoRooms', id }],
    }),
    listVideoRoomParticipants: build.query<VideoRoomParticipant[], string>({
      query: (roomId) => `/api/users/video-rooms/${roomId}/participants`,
      providesTags: (_result, _error, roomId) => [{ type: 'VideoRooms', id: roomId }],
    }),
    createVideoRoom: build.mutation<VideoRoom, CreateVideoRoom>({
      query: (body) => ({
        url: '/api/users/video-rooms/create',
        method: 'POST',
        body,
      }),
      transformResponse: (response: VideoRoom) => normalizeVideoRoom(response),
      invalidatesTags: [{ type: 'VideoRooms', id: 'LIST' }, 'VideoRoomUsage'],
    }),
    joinVideoRoom: build.mutation<VideoRoom, { roomId: string; direct?: boolean } | string>({
      query: (arg) => {
        const roomId = typeof arg === 'string' ? arg : arg.roomId
        const direct = typeof arg === 'string' ? false : Boolean(arg.direct)
        const qs = direct ? '?direct=true' : ''
        return {
          url: `/api/users/video-rooms/${roomId}/join${qs}`,
          method: 'POST',
        }
      },
      transformResponse: (response: VideoRoom) => normalizeVideoRoom(response),
      invalidatesTags: (_result, _error, arg) => {
        const roomId = typeof arg === 'string' ? arg : arg.roomId
        return [
          { type: 'VideoRooms', id: roomId },
          { type: 'VideoRooms', id: 'LIST' },
          { type: 'UserStats', id: 'ME' },
        ]
      },
    }),
    approveVideoRoomJoin: build.mutation<VideoRoom, { roomId: string; userId: string }>({
      query: ({ roomId, userId }) => ({
        url: `/api/users/video-rooms/${roomId}/join-requests/${userId}/approve`,
        method: 'POST',
      }),
      transformResponse: (response: VideoRoom) => normalizeVideoRoom(response),
      invalidatesTags: (_result, _error, { roomId }) => [{ type: 'VideoRooms', id: roomId }],
    }),
    rejectVideoRoomJoin: build.mutation<VideoRoom, { roomId: string; userId: string }>({
      query: ({ roomId, userId }) => ({
        url: `/api/users/video-rooms/${roomId}/join-requests/${userId}/reject`,
        method: 'POST',
      }),
      transformResponse: (response: VideoRoom) => normalizeVideoRoom(response),
      invalidatesTags: (_result, _error, { roomId }) => [{ type: 'VideoRooms', id: roomId }],
    }),
    leaveVideoRoom: build.mutation<VideoRoom, string>({
      query: (roomId) => ({
        url: `/api/users/video-rooms/${roomId}/join`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, roomId) => [
        { type: 'VideoRooms', id: roomId },
        { type: 'VideoRooms', id: 'LIST' },
      ],
    }),
    endVideoRoom: build.mutation<VideoRoom, string>({
      query: (roomId) => ({
        url: `/api/users/video-rooms/${roomId}/end`,
        method: 'POST',
      }),
      transformResponse: (response: VideoRoom) => normalizeVideoRoom(response),
      invalidatesTags: (_result, _error, roomId) => [
        { type: 'VideoRooms', id: roomId },
        { type: 'VideoRooms', id: 'LIST' },
      ],
    }),
    updateVideoRoomPermissions: build.mutation<
      VideoRoom,
      { roomId: string; body: UpdateVideoRoomPermissions }
    >({
      query: ({ roomId, body }) => ({
        url: `/api/users/video-rooms/${roomId}/permissions`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: VideoRoom) => normalizeVideoRoom(response),
      async onQueryStarted({ roomId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            videoRoomsApi.util.updateQueryData('getVideoRoom', roomId, () => data)
          )
        } catch {
          /* handled in UI */
        }
      },
      invalidatesTags: (_result, _error, { roomId }) => [
        { type: 'VideoRooms', id: roomId },
        { type: 'VideoRooms', id: 'LIST' },
      ],
    }),
    setParticipantMuted: build.mutation<
      VideoRoom,
      { roomId: string; userId: string; muted: boolean }
    >({
      query: ({ roomId, userId, muted }) => ({
        url: `/api/users/video-rooms/${roomId}/participants/${userId}/mute`,
        method: 'PUT',
        body: { muted },
      }),
      transformResponse: (response: VideoRoom) => normalizeVideoRoom(response),
      invalidatesTags: (_result, _error, { roomId }) => [{ type: 'VideoRooms', id: roomId }],
    }),
    setParticipantCamera: build.mutation<
      VideoRoom,
      { roomId: string; userId: string; enabled: boolean }
    >({
      query: ({ roomId, userId, enabled }) => ({
        url: `/api/users/video-rooms/${roomId}/participants/${userId}/camera`,
        method: 'PUT',
        body: { enabled },
      }),
      transformResponse: (response: VideoRoom) => normalizeVideoRoom(response),
      invalidatesTags: (_result, _error, { roomId }) => [{ type: 'VideoRooms', id: roomId }],
    }),
    removeVideoRoomParticipant: build.mutation<
      VideoRoom,
      { roomId: string; userId: string }
    >({
      query: ({ roomId, userId }) => ({
        url: `/api/users/video-rooms/${roomId}/participants/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { roomId }) => [
        { type: 'VideoRooms', id: roomId },
        { type: 'VideoRooms', id: 'LIST' },
      ],
    }),
    createBreakoutRoom: build.mutation<
      VideoRoom,
      { parentRoomId: string; body: CreateBreakoutRoom }
    >({
      query: ({ parentRoomId, body }) => ({
        url: `/api/users/video-rooms/${parentRoomId}/breakouts`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: VideoRoom) => normalizeVideoRoom(response),
      invalidatesTags: (_result, _error, { parentRoomId }) => [
        { type: 'VideoRooms', id: parentRoomId },
        { type: 'VideoRooms', id: 'LIST' },
      ],
    }),
    listVideoRoomMessages: build.query<VideoRoomMessage[], { roomId: string; limit?: number }>({
      query: ({ roomId, limit }) =>
        `/api/users/video-rooms/${roomId}/messages?limit=${limit ?? 100}`,
      providesTags: (_result, _error, { roomId }) => [{ type: 'VideoRooms', id: `${roomId}-messages` }],
    }),
    sendVideoRoomMessage: build.mutation<
      VideoRoomMessage,
      { roomId: string; content: string }
    >({
      query: ({ roomId, content }) => ({
        url: `/api/users/video-rooms/${roomId}/messages`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (_result, _error, { roomId }) => [
        { type: 'VideoRooms', id: `${roomId}-messages` },
      ],
    }),
  }),
})

export const {
  useGetVideoRoomUsageQuery,
  useCheckVideoRoomLimitQuery,
  useLazyCheckVideoRoomLimitQuery,
  useGetVideoRoomJoinPreviewQuery,
  useJoinVideoRoomByCodeMutation,
  useCreateVideoRoomProOrderMutation,
  useConfirmVideoRoomProPaymentMutation,
  useGetVideoRoomAdminAnalyticsQuery,
  useListLiveVideoRoomsQuery,
  useListVideoRoomsQuery,
  useListVideoRoomParticipantsQuery,
  useGetVideoRoomQuery,
  useCreateVideoRoomMutation,
  useJoinVideoRoomMutation,
  useLeaveVideoRoomMutation,
  useEndVideoRoomMutation,
  useUpdateVideoRoomPermissionsMutation,
  useSetParticipantMutedMutation,
  useSetParticipantCameraMutation,
  useApproveVideoRoomJoinMutation,
  useRejectVideoRoomJoinMutation,
  useRemoveVideoRoomParticipantMutation,
  useCreateBreakoutRoomMutation,
  useListVideoRoomMessagesQuery,
  useSendVideoRoomMessageMutation,
} = videoRoomsApi
