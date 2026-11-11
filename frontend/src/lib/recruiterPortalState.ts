import {
  RECRUITER_JOBS,
  RECRUITER_APPLICATIONS,
  RECRUITER_ACTIVITY,
  type RecruiterJob,
  type RecruiterApplication,
  type RecruiterActivity,
} from '../data/recruiterData'
import type { ScheduledInterview } from './recruiterInterviews'

const JOBS_KEY = 'dc_recruiter_jobs'
const APPLICATIONS_KEY = 'dc_recruiter_applications'
const ACTIVITY_KEY = 'dc_recruiter_activity'
const NOTIFICATIONS_READ_KEY = 'dc_recruiter_notifications_read'

export type RecruiterAnalyticsStats = {
  activeJobs: { value: number; delta: string }
  applications: { value: number; delta: string }
  shortlisted: { value: number; delta: string }
  interviews: { value: number; delta: string }
}

export function loadRecruiterJobs(): RecruiterJob[] {
  try {
    const raw = localStorage.getItem(JOBS_KEY)
    return raw ? (JSON.parse(raw) as RecruiterJob[]) : [...RECRUITER_JOBS]
  } catch {
    return [...RECRUITER_JOBS]
  }
}

export function saveRecruiterJobs(jobs: RecruiterJob[]) {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
}

export function loadRecruiterApplications(): RecruiterApplication[] {
  try {
    const raw = localStorage.getItem(APPLICATIONS_KEY)
    return raw ? (JSON.parse(raw) as RecruiterApplication[]) : [...RECRUITER_APPLICATIONS]
  } catch {
    return [...RECRUITER_APPLICATIONS]
  }
}

export function saveRecruiterApplications(applications: RecruiterApplication[]) {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications))
}

export function loadRecruiterActivity(): RecruiterActivity[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY)
    return raw ? (JSON.parse(raw) as RecruiterActivity[]) : [...RECRUITER_ACTIVITY]
  } catch {
    return [...RECRUITER_ACTIVITY]
  }
}

export function saveRecruiterActivity(activity: RecruiterActivity[]) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity))
}

export function getReadNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_READ_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function markNotificationsRead(ids: string[]) {
  const set = getReadNotificationIds()
  ids.forEach((id) => set.add(id))
  localStorage.setItem(NOTIFICATIONS_READ_KEY, JSON.stringify([...set]))
}

export function computeRecruiterAnalytics(
  jobs: RecruiterJob[],
  applications: RecruiterApplication[],
  interviews: ScheduledInterview[],
  savedCount: number,
): RecruiterAnalyticsStats {
  const activeJobs = jobs.filter((j) => j.status === 'Active')
  const shortlistedApps = applications.filter((a) => a.status === 'Shortlisted').length
  const interviewApps = applications.filter((a) => a.status === 'Interview').length
  const totalInterviews = interviews.length + interviewApps

  const newJobsThisWeek = Math.min(activeJobs.length, 2)

  return {
    activeJobs: {
      value: activeJobs.length,
      delta: `${newJobsThisWeek} new this week`,
    },
    applications: {
      value: applications.length,
      delta: `${applications.filter((a) => a.status === 'Applied').length} pending review`,
    },
    shortlisted: {
      value: shortlistedApps + savedCount,
      delta: 'AI verified candidates',
    },
    interviews: {
      value: totalInterviews,
      delta: totalInterviews === 1 ? 'Scheduled' : `${totalInterviews} scheduled`,
    },
  }
}

export function newActivityId() {
  return `act-${Date.now()}`
}
