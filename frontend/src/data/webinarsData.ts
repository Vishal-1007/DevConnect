export const WEBINAR_SUBTYPES = [
  { id: 'all', label: 'All formats' },
  { id: 'mentor', label: 'Mentor Webinar' },
  { id: 'company', label: 'Company Session' },
  { id: 'live_coding', label: 'Live Coding Stream' },
] as const

export const subtypeLabels: Record<string, string> = {
  mentor: 'Mentor Webinar',
  company: 'Company Session',
  live_coding: 'Live Coding',
}

export const approvalLabels: Record<string, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const streamLabels: Record<string, string> = {
  scheduled: 'Scheduled',
  live: 'Live Now',
  ended: 'Ended',
}

export const approvalColors: Record<string, string> = {
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
}

export const streamColors: Record<string, string> = {
  scheduled: 'blue',
  live: 'green',
  ended: 'gray',
}
