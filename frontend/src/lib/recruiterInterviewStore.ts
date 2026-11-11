import {
  RECRUITER_INTERVIEWS,
  type InterviewStatus,
  type InterviewType,
  type RecruiterInterview,
} from '../data/recruiterInterviewData'
import type { ScheduledInterview } from './recruiterInterviews'
import { loadScheduledInterviews } from './recruiterInterviews'
import { RECRUITER_CANDIDATES } from '../data/recruiterData'
import { loadRecruiterJobs } from './recruiterPortalState'
import {
  applyInterviewCancelledSync,
  applyInterviewScheduledSync,
  applyInterviewUpdatedSync,
  buildInterviewMeetingLink,
} from './interviewIntegrationSync'

const STORAGE_KEY = 'dc_recruiter_interview_records'

export type InterviewTab = 'all' | 'upcoming' | 'completed' | 'cancelled'

export type InterviewFilterState = {
  search: string
  job: string
  interviewType: string
  status: string
  sortBy: 'upcoming' | 'recent' | 'devscore'
}

export const DEFAULT_INTERVIEW_FILTERS: InterviewFilterState = {
  search: '',
  job: 'all',
  interviewType: 'all',
  status: 'all',
  sortBy: 'upcoming',
}

function mapScheduledStatus(status: ScheduledInterview['status']): InterviewStatus {
  if (status === 'Completed') return 'Completed'
  if (status === 'Cancelled') return 'Cancelled'
  return 'Upcoming'
}

function mapScheduledType(type: string): InterviewType {
  const map: Record<string, InterviewType> = {
    Technical: 'Technical Round',
    'Coding Round': 'Coding Test',
    'HR Round': 'HR Round',
    'Final Round': 'Managerial Round',
  }
  return map[type] ?? 'Technical Round'
}

function scheduledToRecruiterInterview(s: ScheduledInterview): RecruiterInterview {
  const candidate = RECRUITER_CANDIDATES.find((c) => c.id === s.candidateId)
  return {
    id: s.id,
    candidateId: s.candidateId,
    candidateName: s.candidateName,
    candidateAvatar: candidate?.avatar ?? s.candidateName.slice(0, 2).toUpperCase(),
    devScore: candidate?.devScore ?? 800,
    verified: candidate?.verified ?? false,
    skills: candidate?.skills ?? [],
    jobTitle: s.jobTitle,
    company: 'Infosys',
    interviewType: mapScheduledType(s.interviewType),
    date: s.date,
    time: s.time,
    durationMinutes: s.durationMinutes,
    status: mapScheduledStatus(s.status),
    platform: 'Google Meet',
    meetingLink: 'https://meet.google.com/new',
    notes: s.notes,
    scheduledAt: s.scheduledAt,
    aiInterviewScore: candidate?.breakdown?.aiInterview,
    codingScore: candidate?.breakdown?.codingScore,
    mentorRating: candidate?.breakdown?.mentorRating,
    aiMatchPercent: candidate?.aiMatch,
    resumeUrl: '#',
    projectLinks: candidate?.projects?.map((p) => ({ name: p.name, url: '#' })),
  }
}

export function loadRecruiterInterviews(): RecruiterInterview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const stored = raw ? (JSON.parse(raw) as RecruiterInterview[]) : [...RECRUITER_INTERVIEWS]
    const scheduled = loadScheduledInterviews().map(scheduledToRecruiterInterview)
    const storedIds = new Set(stored.map((i) => i.id))
    const merged = [...scheduled.filter((s) => !storedIds.has(s.id)), ...stored]
    return merged.sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    )
  } catch {
    return [...RECRUITER_INTERVIEWS]
  }
}

export function saveRecruiterInterviews(interviews: RecruiterInterview[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(interviews))
}

export function addRecruiterInterview(interview: RecruiterInterview): RecruiterInterview[] {
  const meetingLink =
    buildInterviewMeetingLink(interview.platform) ?? interview.meetingLink
  const enriched: RecruiterInterview = { ...interview, meetingLink }
  const next = [enriched, ...loadRecruiterInterviews()]
  saveRecruiterInterviews(next)

  void applyInterviewScheduledSync(enriched).then((syncResult) => {
    const patch: Partial<RecruiterInterview> = {}
    if (syncResult.meetingLink) patch.meetingLink = syncResult.meetingLink
    if (syncResult.googleCalendarEventId) {
      patch.googleCalendarEventId = syncResult.googleCalendarEventId
    }
    if (Object.keys(patch).length > 0) {
      updateRecruiterInterview(enriched.id, patch)
    }
  })

  return next
}

export function updateRecruiterInterview(
  id: string,
  patch: Partial<RecruiterInterview>,
): RecruiterInterview[] {
  const current = loadRecruiterInterviews().find((i) => i.id === id)
  const next = loadRecruiterInterviews().map((i) => (i.id === id ? { ...i, ...patch } : i))
  const updated = next.find((i) => i.id === id)

  if (updated && current) {
    if (patch.status === 'Cancelled') {
      void applyInterviewCancelledSync(id, updated.googleCalendarEventId ?? current.googleCalendarEventId)
    } else if (
      patch.date !== undefined ||
      patch.time !== undefined ||
      patch.scheduledAt !== undefined ||
      patch.durationMinutes !== undefined
    ) {
      if (
        current.scheduledAt !== updated.scheduledAt ||
        current.date !== updated.date ||
        current.time !== updated.time ||
        current.durationMinutes !== updated.durationMinutes
      ) {
        void applyInterviewUpdatedSync(updated)
      }
    }
  }

  saveRecruiterInterviews(next)
  return next
}

export function computeInterviewStats(interviews: RecruiterInterview[]) {
  const upcoming = interviews.filter((i) => i.status === 'Upcoming')
  const completed = interviews.filter((i) => i.status === 'Completed')
  const cancelled = interviews.filter((i) => i.status === 'Cancelled')

  const nextUp = upcoming
    .filter((i) => new Date(i.scheduledAt).getTime() >= Date.now())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]

  let nextUpLabel = 'No upcoming'
  if (nextUp) {
    const d = new Date(nextUp.scheduledAt)
    const isToday = d.toDateString() === new Date().toDateString()
    const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    nextUpLabel = isToday ? `Today, ${time}` : `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`
  }

  return {
    total: interviews.length,
    totalGrowth: '+18% from last month',
    upcoming: upcoming.length,
    nextUpLabel,
    completed: completed.length,
    completedLabel: 'This month',
    cancelled: cancelled.length,
    cancelledLabel: 'This month',
  }
}

export function computeTypeBreakdown(interviews: RecruiterInterview[]) {
  const counts: Record<InterviewType, number> = {
    'Technical Round': 0,
    'HR Round': 0,
    'Managerial Round': 0,
    'Coding Test': 0,
  }
  interviews.forEach((i) => {
    counts[i.interviewType] = (counts[i.interviewType] ?? 0) + 1
  })
  const total = interviews.length || 1
  return (Object.entries(counts) as [InterviewType, number][]).map(([type, count]) => ({
    type,
    count,
    percent: Math.round((count / total) * 100),
  }))
}

export function filterInterviews(
  interviews: RecruiterInterview[],
  tab: InterviewTab,
  filters: InterviewFilterState,
): RecruiterInterview[] {
  let list = [...interviews]

  if (tab === 'upcoming') list = list.filter((i) => i.status === 'Upcoming')
  if (tab === 'completed') list = list.filter((i) => i.status === 'Completed')
  if (tab === 'cancelled') list = list.filter((i) => i.status === 'Cancelled')

  const q = filters.search.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (i) =>
        i.candidateName.toLowerCase().includes(q) ||
        i.jobTitle.toLowerCase().includes(q) ||
        i.interviewType.toLowerCase().includes(q),
    )
  }

  if (filters.job !== 'all') {
    list = list.filter((i) => i.jobTitle === filters.job)
  }

  if (filters.interviewType !== 'all') {
    list = list.filter((i) => i.interviewType === filters.interviewType)
  }

  if (filters.status !== 'all') {
    list = list.filter((i) => i.status === filters.status)
  }

  if (filters.sortBy === 'upcoming') {
    list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  } else if (filters.sortBy === 'recent') {
    list.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  } else {
    list.sort((a, b) => b.devScore - a.devScore)
  }

  return list
}

export function getTodayUpcoming(interviews: RecruiterInterview[]): RecruiterInterview[] {
  const today = new Date().toDateString()
  return interviews
    .filter((i) => i.status === 'Upcoming' && new Date(i.scheduledAt).toDateString() === today)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
}

export function getJobFilterOptions(): string[] {
  const jobs = loadRecruiterJobs().map((j) => j.title)
  const fromInterviews = RECRUITER_INTERVIEWS.map((i) => i.jobTitle)
  return [...new Set([...jobs, ...fromInterviews])]
}
