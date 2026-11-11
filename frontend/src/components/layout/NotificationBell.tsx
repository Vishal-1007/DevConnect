import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  Check,
  CreditCard,
  GraduationCap,
  Loader2,
  Megaphone,
  Radio,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import {
  useGetUnreadNotificationCountQuery,
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../../api/notificationsApi'
import { useNotificationStream } from '../../hooks/useNotificationStream'
import { formatRelativeTime } from '../../lib/formatTime'

type NotificationBellProps = {
  viewAllPath?: string
}

export function NotificationBell({ viewAllPath = '/notifications' }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useNotificationStream()

  const { data: notifications = [], isLoading, isFetching } = useListNotificationsQuery({ limit: 20 })
  const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined, { pollingInterval: 60000 })
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation()

  const unreadCount = unreadData?.count ?? notifications.filter((n) => !n.readAt).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleMarkRead(id: string) {
    await markRead(id)
  }

  async function handleMarkAllRead() {
    await markAllRead()
  }

  function notificationIcon(type: string) {
    const normalized = type.toLowerCase()
    if (normalized.includes('payment')) {
      return normalized.includes('fail')
        ? <XCircle size={14} className="text-red-400" />
        : <CreditCard size={14} className="text-emerald-400" />
    }
    if (normalized.includes('learning_resource') || normalized.includes('course_update')) {
      return <BookOpen size={14} className="text-sky-400" />
    }
    if (normalized.includes('learning_stream') || normalized.includes('stream')) {
      return <Radio size={14} className="text-violet-400" />
    }
    if (normalized.includes('mentor')) {
      return <GraduationCap size={14} className="text-amber-400" />
    }
    if (normalized.includes('system') || normalized.includes('alert')) {
      return <ShieldAlert size={14} className="text-orange-400" />
    }
    if (normalized.includes('promotional') || normalized.includes('announcement')) {
      return <Megaphone size={14} className="text-indigo-400" />
    }
    return <Bell size={14} className="text-[#818cf8]" />
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`p-2 rounded-lg transition-colors relative ${
          open ? 'text-white bg-[#1c1d2a]' : 'text-[#8b8ca8] hover:text-white hover:bg-[#1c1d2a]'
        }`}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#6366f1] text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl bg-[#161722] border border-[#2d2e3e] shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2e3e]">
            <div>
              <h2 className="text-sm font-semibold text-white">Notifications</h2>
              <p className="text-xs text-[#8b8ca8]">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isFetching && !isLoading && (
                <Loader2 size={14} className="text-[#6366f1] animate-spin" />
              )}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void handleMarkAllRead()}
                  disabled={markingAll}
                  className="text-[10px] text-[#818cf8] hover:text-white font-semibold disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={22} className="text-[#6366f1] animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-[#8b8ca8] text-center py-10 px-4">No notifications yet.</p>
            ) : (
              notifications.slice(0, 8).map((notification) => {
                const unread = !notification.readAt
                return (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-[#2d2e3e] last:border-b-0 ${
                      unread ? 'bg-[#6366f1]/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white flex items-center gap-1.5">
                          {notificationIcon(notification.type)}
                          {notification.title}
                        </p>
                        <p className="text-xs text-[#b4b5c8] mt-1 leading-relaxed line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-[10px] text-[#5c5d72] mt-2">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                      {unread && (
                        <button
                          type="button"
                          onClick={() => void handleMarkRead(notification.id)}
                          className="shrink-0 p-1.5 rounded-md text-[#818cf8] hover:bg-[#6366f1]/15"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="px-4 py-3 border-t border-[#2d2e3e] bg-[#12131c]">
            <Link
              to={viewAllPath}
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold text-[#818cf8] hover:text-white"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
