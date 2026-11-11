import { useState } from 'react'
import { Bell, Check, Loader2, Trash2 } from 'lucide-react'
import {
  useDeleteNotificationMutation,
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  type NotificationFilter,
} from '../api/notificationsApi'
import { useNotificationStream } from '../hooks/useNotificationStream'
import { formatRelativeTime } from '../lib/formatTime'

const FILTERS: { value: NotificationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

export function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>('all')
  useNotificationStream()

  const { data: notifications = [], isLoading, isFetching } = useListNotificationsQuery({
    limit: 100,
    filter,
  })
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation()
  const [deleteNotification] = useDeleteNotificationMutation()

  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell size={22} className="text-violet-400" />
            Notifications
          </h1>
          <p className="text-xs text-[#8b8ca8] mt-1">
            {unreadCount > 0 ? `${unreadCount} unread in this view` : 'Stay updated on platform activity'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={markingAll}
            className="text-xs font-semibold text-[#818cf8] hover:text-white disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              filter === item.value
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                : 'bg-[#161722] border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
        {isFetching && !isLoading && (
          <Loader2 size={14} className="text-violet-400 animate-spin self-center" />
        )}
      </div>

      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="text-violet-400 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-[#8b8ca8] text-center py-16">No notifications in this view.</p>
        ) : (
          <div className="divide-y divide-[#2d2e3e]">
            {notifications.map((notification) => {
              const unread = !notification.readAt
              return (
                <div
                  key={notification.id}
                  className={`px-5 py-4 flex items-start gap-4 ${unread ? 'bg-[#6366f1]/5' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{notification.title}</p>
                      <span className="text-[10px] uppercase tracking-wide text-[#5c5d72]">
                        {notification.type.replace(/_/g, ' ')}
                      </span>
                      {unread && (
                        <span className="text-[10px] font-semibold text-violet-400">Unread</span>
                      )}
                    </div>
                    <p className="text-sm text-[#b4b5c8] mt-1 leading-relaxed">{notification.body}</p>
                    <p className="text-[10px] text-[#5c5d72] mt-2">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {unread && (
                      <button
                        type="button"
                        onClick={() => void markRead(notification.id)}
                        className="p-2 rounded-lg text-[#818cf8] hover:bg-[#6366f1]/15"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void deleteNotification(notification.id)}
                      className="p-2 rounded-lg text-[#8b8ca8] hover:text-red-400 hover:bg-red-500/10"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
