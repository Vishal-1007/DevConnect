import { devConnectApi } from './baseApi'

export interface NotificationCampaign {
  id: string
  title: string
  body: string
  audience: string
  audienceLabel: string
  notificationType: string
  notificationTypeLabel: string
  status: string
  statusLabel: string
  scheduledAt: string | null
  sentAt: string | null
  sentAtLabel: string
  recipientCount: number
  createdByUsername: string | null
  createdAt: string
}

export interface NotificationAnalytics {
  totalCampaigns: number
  sentCount: number
  scheduledCount: number
  draftCount: number
  totalRecipients: number
  userCount: number
  deliveredCount: number
  readCount: number
  unreadCount: number
}

export interface CreateCampaignPayload {
  title: string
  body: string
  audience: string
  notificationType: string
  sendNow: boolean
  scheduledAt?: string | null
}

export const adminNotificationsApi = devConnectApi.injectEndpoints({
  endpoints: (build) => ({
    listNotificationCampaigns: build.query<NotificationCampaign[], void>({
      query: () => '/api/users/admin/notifications/campaigns',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AdminNotifications' as const, id })),
              { type: 'AdminNotifications', id: 'LIST' },
            ]
          : [{ type: 'AdminNotifications', id: 'LIST' }],
    }),
    getNotificationAnalytics: build.query<NotificationAnalytics, void>({
      query: () => '/api/users/admin/notifications/analytics',
      providesTags: [{ type: 'AdminNotifications', id: 'ANALYTICS' }],
    }),
    createNotificationCampaign: build.mutation<NotificationCampaign, CreateCampaignPayload>({
      query: (body) => ({
        url: '/api/users/admin/notifications/campaigns',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'AdminNotifications', id: 'LIST' },
        { type: 'AdminNotifications', id: 'ANALYTICS' },
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'UNREAD' },
      ],
    }),
    sendNotificationCampaign: build.mutation<NotificationCampaign, string>({
      query: (campaignId) => ({
        url: `/api/users/admin/notifications/campaigns/${campaignId}/send`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'AdminNotifications', id: 'LIST' },
        { type: 'AdminNotifications', id: 'ANALYTICS' },
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'UNREAD' },
      ],
    }),
    cancelNotificationCampaign: build.mutation<void, string>({
      query: (campaignId) => ({
        url: `/api/users/admin/notifications/campaigns/${campaignId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'AdminNotifications', id: 'LIST' }, { type: 'AdminNotifications', id: 'ANALYTICS' }],
    }),
  }),
})

export const {
  useListNotificationCampaignsQuery,
  useGetNotificationAnalyticsQuery,
  useCreateNotificationCampaignMutation,
  useSendNotificationCampaignMutation,
  useCancelNotificationCampaignMutation,
} = adminNotificationsApi
