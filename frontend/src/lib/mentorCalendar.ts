import type { MentorshipBooking } from '../api/adminBookingsApi'

function formatIcsDate(iso: string) {
  const d = new Date(iso)
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function downloadBookingsCalendar(bookings: MentorshipBooking[], timezone: string) {
  const upcoming = bookings.filter((b) =>
    ['pending', 'confirmed'].includes(b.status) && new Date(b.scheduledAt).getTime() > Date.now(),
  )

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DevConnect//Mentor Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:DevConnect Mentor Sessions',
    'X-WR-TIMEZONE:' + timezone,
  ]

  for (const b of upcoming) {
    const start = new Date(b.scheduledAt)
    const end = new Date(start.getTime() + b.durationMinutes * 60_000)
    const title = (b as MentorshipBooking & { requestMessage?: string }).requestMessage
      || b.notes?.trim()
      || `Session with ${b.learnerDisplayName}`
    lines.push(
      'BEGIN:VEVENT',
      'UID:' + b.id + '@devconnect.app',
      'DTSTAMP:' + formatIcsDate(new Date().toISOString()),
      'DTSTART:' + formatIcsDate(start.toISOString()),
      'DTEND:' + formatIcsDate(end.toISOString()),
      'SUMMARY:' + escapeIcs(title),
      'DESCRIPTION:' + escapeIcs(`Learner: ${b.learnerDisplayName} · ${b.durationLabel} · ${b.amountLabel}`),
      'STATUS:CONFIRMED',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'devconnect-mentor-bookings.ics'
  a.click()
  URL.revokeObjectURL(url)
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function requestBrowserReminder(title: string, scheduledAt: string) {
  if (!('Notification' in window)) return
  const fireAt = new Date(scheduledAt).getTime() - 15 * 60_000
  const delay = fireAt - Date.now()
  if (delay <= 0) return

  const schedule = () => {
    setTimeout(() => {
      new Notification('DevConnect Session Reminder', {
        body: `${title} starts in 15 minutes`,
        icon: '/favicon.ico',
      })
    }, delay)
  }

  if (Notification.permission === 'granted') {
    schedule()
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((p) => { if (p === 'granted') schedule() })
  }
}
