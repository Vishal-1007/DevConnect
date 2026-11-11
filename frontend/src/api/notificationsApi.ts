import type { AppNotification } from './types'
import { devConnectApi } from './baseApi'

export type NotificationFilter = 'all' | 'unread' | 'read'

export const notificationsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listNotifications: build.query<AppNotification[], { limit?: number; filter?: NotificationFilter } | void>({
      query: (args) => {
        const limit = args?.limit ?? 50
        const filter = args?.filter && args.filter !== 'all' ? `&filter=${args.filter}` : ''
        return `/api/notifications?limit=${limit}${filter}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Notifications' as const, id })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),
    getUnreadNotificationCount: build.query<{ count: number }, void>({
      query: () => '/api/notifications/unread-count',
      providesTags: [{ type: 'Notifications', id: 'UNREAD' }],
    }),
    markNotificationRead: build.mutation<AppNotification, string>({
      query: (id) => ({
        url: `/api/notifications/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Notifications', id },
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'UNREAD' },
      ],
    }),
    markAllNotificationsRead: build.mutation<number, void>({
      query: () => ({
        url: '/api/notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'UNREAD' },
      ],
    }),
    deleteNotification: build.mutation<void, string>({
      query: (id) => ({
        url: `/api/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Notifications', id },
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'UNREAD' },
      ],
    }),
  }),
})

export const {
  useListNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi
