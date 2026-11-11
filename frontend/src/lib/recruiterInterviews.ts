import { toDateKey } from './bookingDates'
import type { RecruiterCandidate } from '../data/recruiterData'
import {
  applyInterviewCancelledSync,
  applyInterviewScheduledSync,
  applyInterviewUpdatedSync,
} from './interviewIntegrationSync'

export type ScheduledInterview = {
  id: string
  candidateId: string
  candidateName: string
  candidateRole: string
  jobTitle: string
  interviewType: string
  date: string
  time: string
  durationMinutes: number
  notes?: string
  status: 'Scheduled' | 'Completed' | 'Cancelled'
  scheduledAt: string
  googleCalendarEventId?: string
}

const STORAGE_KEY = 'dc_recruiter_interviews'

export const INTERVIEW_TYPES = ['Technical', 'Coding Round', 'HR Round', 'Final Round'] as const
export const INTERVIEW_DURATIONS = [30, 45, 60] as const
export const TIME_SLOTS = ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '17:00']

export function getAvailableInterviewDates(daysAhead = 45): Set<string> {
  const set = new Set<string>()
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  for (let i = 0; i < daysAhead; i++) {
    const day = cursor.getDay()
    if (day !== 0) {
      set.add(toDateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return set
}

export function getSlotsForDate(dateKey: string): { time: string; available: boolean }[] {
  const seed = dateKey.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return TIME_SLOTS.map((time, idx) => ({
    time,
    available: (seed + idx) % 5 !== 0,
  }))
}

export function loadScheduledInterviews(): ScheduledInterview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ScheduledInterview[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveScheduledInterview(
  interview: ScheduledInterview,
  candidateEmail?: string | null,
): ScheduledInterview[] {
  const existing = loadScheduledInterviews()
  const next = [interview, ...existing]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

  void applyInterviewScheduledSync(interview, candidateEmail).then((syncResult) => {
    if (syncResult.googleCalendarEventId) {
      updateScheduledInterview(interview.id, {
        googleCalendarEventId: syncResult.googleCalendarEventId,
      })
    }
  })

  return next
}

export function updateScheduledInterview(
  id: string,
  patch: Partial<ScheduledInterview>,
): ScheduledInterview[] {
  const current = loadScheduledInterviews().find((i) => i.id === id)
  const next = loadScheduledInterviews().map((i) => (i.id === id ? { ...i, ...patch } : i))
  const updated = next.find((i) => i.id === id)

  if (updated && current) {
    if (patch.status === 'Cancelled') {
      void applyInterviewCancelledSync(id, updated.googleCalendarEventId ?? current.googleCalendarEventId)
    } else if (
      (patch.date !== undefined ||
        patch.time !== undefined ||
        patch.scheduledAt !== undefined ||
        patch.durationMinutes !== undefined) &&
      (current.scheduledAt !== updated.scheduledAt ||
        current.date !== updated.date ||
        current.time !== updated.time ||
        current.durationMinutes !== updated.durationMinutes)
    ) {
      void applyInterviewUpdatedSync(updated)
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function buildScheduledInterview(
  candidate: RecruiterCandidate,
  payload: {
    jobTitle: string
    interviewType: string
    date: string
    time: string
    durationMinutes: number
    notes?: string
  },
): ScheduledInterview {
  const [y, m, d] = payload.date.split('-').map(Number)
  const [hh, mm] = payload.time.split(':').map(Number)
  const scheduledAt = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0).toISOString()

  return {
    id: `int-${Date.now()}`,
    candidateId: candidate.id,
    candidateName: candidate.name,
    candidateRole: candidate.role,
    jobTitle: payload.jobTitle,
    interviewType: payload.interviewType,
    date: payload.date,
    time: payload.time,
    durationMinutes: payload.durationMinutes,
    notes: payload.notes?.trim() || undefined,
    status: 'Scheduled',
    scheduledAt,
  }
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function formatIcsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function downloadInterviewIcs(interview: ScheduledInterview) {
  const start = new Date(interview.scheduledAt)
  const end = new Date(start.getTime() + interview.durationMinutes * 60_000)
  const summary = `Interview: ${interview.candidateName} — ${interview.jobTitle}`
  const description = [
    `Candidate: ${interview.candidateName}`,
    `Role: ${interview.candidateRole}`,
    `Type: ${interview.interviewType}`,
    interview.notes ? `Notes: ${interview.notes}` : '',
  ].filter(Boolean).join('\\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DevConnect//Recruiter Interviews//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${interview.id}@devconnect.app`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${formatIcsDate(start.toISOString())}`,
    `DTEND:${formatIcsDate(end.toISOString())}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `interview-${interview.candidateName.replace(/\s+/g, '-').toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
