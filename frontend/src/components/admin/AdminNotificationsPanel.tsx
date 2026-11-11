import { useState } from 'react'
import {
  Bell,
  CheckCheck,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react'
import {
  useListNotificationCampaignsQuery,
  useGetNotificationAnalyticsQuery,
  useCreateNotificationCampaignMutation,
  useSendNotificationCampaignMutation,
  useCancelNotificationCampaignMutation,
} from '../../api/adminNotificationsApi'

const AUDIENCES = [
  { value: 'ALL_USERS', label: 'All Users' },
  { value: 'LEARNERS', label: 'Learners' },
  { value: 'MENTORS', label: 'Mentors' },
  { value: 'ADMINS', label: 'Admins' },
  { value: 'ACTIVE_USERS', label: 'Active Users' },
]

const NOTIFICATION_TYPES = [
  { value: 'ANNOUNCEMENT', label: 'Announcement / Broadcast' },
  { value: 'OTP', label: 'OTP / Verification' },
  { value: 'BOOKING_REMINDER', label: 'Booking Reminder' },
  { value: 'WEBINAR_ALERT', label: 'Webinar Alert' },
  { value: 'MENTOR_NOTIFICATION', label: 'Mentor Notification' },
  { value: 'SYSTEM_ALERT', label: 'System Alert' },
]

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    green: 'bg-emerald-500/15 text-emerald-400',
    amber: 'bg-amber-500/15 text-amber-400',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[color] ?? map.gray}`}>
      {children}
    </span>
  )
}

export function AdminNotificationsPanel() {
  const { data: campaigns = [], isLoading, isFetching, refetch } = useListNotificationCampaignsQuery(undefined, {
    pollingInterval: 20000,
  })
  const { data: analytics } = useGetNotificationAnalyticsQuery(undefined, { pollingInterval: 20000 })
  const [createCampaign, { isLoading: creating }] = useCreateNotificationCampaignMutation()
  const [sendCampaign, { isLoading: sending }] = useSendNotificationCampaignMutation()
  const [cancelCampaign] = useCancelNotificationCampaignMutation()

  const [showForm, setShowForm] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({
    title: '',
    body: '',
    audience: 'ALL_USERS',
    notificationType: 'ANNOUNCEMENT',
    scheduleMode: 'now' as 'now' | 'schedule',
    scheduledAt: '',
  })

  async function handleSend() {
    if (!form.title.trim() || !form.body.trim()) return
    try {
      await createCampaign({
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience,
        notificationType: form.notificationType,
        sendNow: form.scheduleMode === 'now',
        scheduledAt:
          form.scheduleMode === 'schedule' && form.scheduledAt
            ? new Date(form.scheduledAt).toISOString()
            : null,
      }).unwrap()
      setForm({
        title: '',
        body: '',
        audience: 'ALL_USERS',
        notificationType: 'ANNOUNCEMENT',
        scheduleMode: 'now',
        scheduledAt: '',
      })
      setShowForm(false)
      setSent(true)
      window.setTimeout(() => setSent(false), 3000)
    } catch {
      /* RTK handles error state */
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    )
  }

  const userCount = analytics?.userCount ?? 0

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell size={20} className="text-violet-400" />
            Email & Notifications
          </h2>
          <p className="text-xs text-[#5c5d72] mt-0.5">
            Broadcast messages · campaigns · OTPs · reminders · alerts to {userCount} users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={13} /> New Campaign
          </button>
        </div>
      </div>

      {sent && (
        <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCheck size={15} className="text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-400 font-semibold">
            Campaign queued and delivery logged successfully!
          </p>
        </div>
      )}

      {showForm && (
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">New Broadcast Campaign</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[#5c5d72] mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Notification title…"
                className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#818cf8]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#5c5d72] mb-1">Audience</label>
              <select
                value={form.audience}
                onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#818cf8]"
              >
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#5c5d72] mb-1">Notification Type</label>
              <select
                value={form.notificationType}
                onChange={(e) => setForm((f) => ({ ...f, notificationType: e.target.value }))}
                className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#818cf8]"
              >
                {NOTIFICATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#5c5d72] mb-1">Delivery</label>
              <select
                value={form.scheduleMode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scheduleMode: e.target.value as 'now' | 'schedule' }))
                }
                className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#818cf8]"
              >
                <option value="now">Send immediately</option>
                <option value="schedule">Schedule for later</option>
              </select>
            </div>
          </div>
          {form.scheduleMode === 'schedule' && (
            <div>
              <label className="block text-[10px] text-[#5c5d72] mb-1">Scheduled time</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                className="w-full max-w-xs bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#818cf8]"
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] text-[#5c5d72] mb-1">Message Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Write your message…"
              rows={4}
              className="w-full bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#818cf8] resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg bg-[#1c1d2a] text-[#8b8ca8] hover:text-white text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              {form.scheduleMode === 'now' ? 'Send Now' : 'Schedule'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {[
          { l: 'Total Campaigns', v: analytics?.totalCampaigns ?? campaigns.length },
          { l: 'Sent', v: analytics?.sentCount ?? 0 },
          { l: 'Scheduled', v: analytics?.scheduledCount ?? 0 },
          { l: 'Recipients (sent)', v: analytics?.totalRecipients ?? 0 },
          { l: 'Delivered', v: analytics?.deliveredCount ?? 0 },
          { l: 'Read', v: analytics?.readCount ?? 0 },
          { l: 'Unread', v: analytics?.unreadCount ?? 0 },
        ].map((s) => (
          <div key={s.l} className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{s.v}</p>
            <p className="text-[10px] text-[#8b8ca8] mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2d2e3e]">
          <h3 className="text-sm font-bold text-white">Campaign History</h3>
        </div>
        {campaigns.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[#5c5d72]">No campaigns yet</div>
        ) : (
          <div className="divide-y divide-[#1c1d2a]">
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#1c1d2a]/50">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    c.status === 'SENT' ? 'bg-violet-500/15' : 'bg-[#1c1d2a]'
                  }`}
                >
                  {c.status === 'SENT' ? (
                    <Send size={16} className="text-violet-400" />
                  ) : (
                    <Clock size={16} className="text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-semibold text-white">{c.title}</p>
                    <Pill
                      color={
                        c.status === 'SENT' ? 'green' : c.status === 'SCHEDULED' ? 'amber' : 'gray'
                      }
                    >
                      {c.statusLabel}
                    </Pill>
                    <span className="text-[9px] text-[#5c5d72]">{c.notificationTypeLabel}</span>
                  </div>
                  <p className="text-xs text-[#5c5d72] line-clamp-1">{c.body}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-[10px] text-[#5c5d72]">Audience: {c.audienceLabel}</p>
                  <p className="text-[10px] text-[#5c5d72]">{c.sentAtLabel}</p>
                  {c.status === 'SENT' && (
                    <p className="text-[10px] text-emerald-400">{c.recipientCount} delivered</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {(c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
                    <>
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => void sendCampaign(c.id)}
                        className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold disabled:opacity-50"
                      >
                        Send now
                      </button>
                      <button
                        type="button"
                        onClick={() => void cancelCampaign(c.id)}
                        className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5 justify-end"
                      >
                        <Trash2 size={10} /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
