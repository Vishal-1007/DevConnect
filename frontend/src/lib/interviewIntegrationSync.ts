import type { RecruiterInterview } from '../data/recruiterInterviewData'
import { apiUrl } from '../config'
import { isIntegrationConnected } from './recruiterIntegrationsStore'
import { loadRecruiterSettings } from './recruiterSettingsStore'
import type { ScheduledInterview } from './recruiterInterviews'

const ACCESS_KEY = 'devconnect_access_token'

type CalendarInterviewPayload = {
  interviewId: string
  candidateName: string
  candidateEmail?: string | null
  recruiterEmail?: string | null
  jobTitle: string
  interviewType?: string
  company?: string
  notes?: string
  meetingLink?: string
  scheduledAt: string
  durationMinutes: number
}

type CalendarApiResult = {
  googleCalendarEventId: string | null
  meetingLink: string | null
  calendarEventCreated: boolean
  candidateInviteSent: boolean
  message: string
}

export type InterviewSyncResult = {
  calendarEventCreated: boolean
  candidateInviteSent: boolean
  meetingLink?: string
  googleCalendarEventId?: string
  error?: string
}

function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY)
  } catch {
    return null
  }
}

export function isGoogleCalendarConnected() {
  return isIntegrationConnected('GOOGLE_CALENDAR')
}

export function isZoomConnected() {
  return isIntegrationConnected('ZOOM')
}

export function isTeamsConnected() {
  return isIntegrationConnected('MICROSOFT_TEAMS')
}

function deriveCandidateEmail(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, '.')}@candidate.devconnect.com`
}

function deriveRecruiterEmail(): string | null {
  const settingsEmail = loadRecruiterSettings().account.email?.trim()
  if (settingsEmail) return settingsEmail
  return null
}

function buildPayload(
  interview: RecruiterInterview | ScheduledInterview,
  meetingLink?: string,
): CalendarInterviewPayload {
  const recruiterInterview = interview as RecruiterInterview
  return {
    interviewId: interview.id,
    candidateName: interview.candidateName,
    candidateEmail: recruiterInterview.candidateEmail ?? deriveCandidateEmail(interview.candidateName),
    recruiterEmail: deriveRecruiterEmail(),
    jobTitle: interview.jobTitle,
    interviewType: 'interviewType' in interview ? interview.interviewType : recruiterInterview.interviewType,
    company: 'company' in recruiterInterview ? recruiterInterview.company : undefined,
    notes: interview.notes,
    meetingLink,
    scheduledAt: interview.scheduledAt,
    durationMinutes: interview.durationMinutes,
  }
}

async function calendarRequest(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: CalendarInterviewPayload,
): Promise<CalendarApiResult | null> {
  const token = getAccessToken()
  if (!token) return null

  try {
    const response = await fetch(apiUrl(path), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const text = await response.text()
      let message = 'Google Calendar sync failed'
      try {
        const parsed = JSON.parse(text) as { message?: string }
        if (parsed.message) message = parsed.message
      } catch {
        if (text) message = text
      }
      throw new Error(message)
    }

    const text = await response.text()
    return text ? (JSON.parse(text) as CalendarApiResult) : null
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Google Calendar sync failed')
  }
}

export function buildInterviewMeetingLink(_platform?: string): string | undefined {
  if (!isGoogleCalendarConnected()) return undefined
  if (isZoomConnected()) {
    return undefined
  }
  if (isTeamsConnected()) {
    return undefined
  }
  return undefined
}

export async function applyInterviewScheduledSync(
  interview: RecruiterInterview | ScheduledInterview,
  candidateEmail?: string | null,
): Promise<InterviewSyncResult> {
  const result: InterviewSyncResult = {
    calendarEventCreated: false,
    candidateInviteSent: false,
  }

  if (!isGoogleCalendarConnected()) {
    result.meetingLink = buildInterviewMeetingLink(
      'platform' in interview ? (interview as RecruiterInterview).platform : undefined,
    )
    return result
  }

  try {
    const payload = buildPayload(interview, interview.meetingLink)
    if (candidateEmail) {
      payload.candidateEmail = candidateEmail
    }

    const apiResult = await calendarRequest('POST', '/api/recruiter/calendar/events', payload)
    if (!apiResult) {
      result.error = 'Unable to sync with Google Calendar (not authenticated)'
      return result
    }

    result.calendarEventCreated = apiResult.calendarEventCreated
    result.candidateInviteSent = apiResult.candidateInviteSent
    result.meetingLink = apiResult.meetingLink ?? undefined
    result.googleCalendarEventId = apiResult.googleCalendarEventId ?? undefined
    return result
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Google Calendar sync failed'
    return result
  }
}

export async function applyInterviewUpdatedSync(
  interview: RecruiterInterview | ScheduledInterview,
): Promise<boolean> {
  if (!isIntegrationConnected('GOOGLE_CALENDAR')) return false

  const googleEventId =
    'googleCalendarEventId' in interview ? interview.googleCalendarEventId : undefined
  if (!googleEventId) return false

  try {
    const apiResult = await calendarRequest(
      'PUT',
      `/api/recruiter/calendar/events/${encodeURIComponent(googleEventId)}`,
      buildPayload(interview, interview.meetingLink),
    )
    return Boolean(apiResult?.calendarEventCreated)
  } catch {
    return false
  }
}

export async function applyInterviewCancelledSync(
  interviewId: string,
  googleCalendarEventId?: string,
): Promise<boolean> {
  if (!isIntegrationConnected('GOOGLE_CALENDAR')) return false
  if (!googleCalendarEventId) return false

  try {
    const apiResult = await calendarRequest(
      'DELETE',
      `/api/recruiter/calendar/events/${encodeURIComponent(googleCalendarEventId)}`,
    )
    return Boolean(apiResult?.calendarEventCreated)
  } catch {
    return false
  }
}
