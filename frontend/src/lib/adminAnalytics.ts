import type { AdminAccount } from '../api/types'

export type AnalyticsPeriod = 'week' | 'month' | '30d'

const PERIOD_DAYS: Record<AnalyticsPeriod, number> = {
  week: 7,
  month: 30,
  '30d': 30,
}

export function periodDays(period: AnalyticsPeriod): number {
  return PERIOD_DAYS[period]
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'Just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const day = Math.floor(hr / 24)
  return `${day} day${day === 1 ? '' : 's'} ago`
}

export function formatLastUpdated(updatedAt: Date | null, isFetching: boolean): string {
  if (isFetching) return 'Updating…'
  if (!updatedAt) return '—'
  const sec = Math.floor((Date.now() - updatedAt.getTime()) / 1000)
  if (sec < 10) return 'Just now'
  if (sec < 60) return `${sec}s ago`
  return formatRelativeTime(updatedAt.toISOString())
}

export function bucketByDay<T>(
  items: T[],
  getDate: (item: T) => string,
  days: number
): { values: number[]; labels: string[] } {
  const values = Array.from({ length: days }, () => 0)
  const labels: string[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    labels.push(
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    )
  }

  for (const item of items) {
    const created = new Date(getDate(item))
    if (Number.isNaN(created.getTime())) continue
    const diffDays = Math.floor((now.getTime() - created.getTime()) / 86_400_000)
    if (diffDays >= 0 && diffDays < days) {
      values[days - 1 - diffDays] += 1
    }
  }

  return { values, labels }
}

export function computeDeltaPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function countInRange<T>(
  items: T[],
  getDate: (item: T) => string,
  startMs: number,
  endMs: number
): number {
  return items.filter((item) => {
    const t = new Date(getDate(item)).getTime()
    return t >= startMs && t < endMs
  }).length
}

export function buildRoleDistribution(users: AdminAccount[]) {
  let students = 0
  let mentors = 0
  let admins = 0
  let professionals = 0
  let others = 0

  for (const u of users) {
    const roles = u.roles.toUpperCase()
    if (roles.includes('ADMIN')) admins += 1
    else if (roles.includes('MENTOR')) mentors += 1
    else if (roles.includes('PROFESSIONAL')) professionals += 1
    else if (roles.includes('USER') || roles.includes('STUDENT')) students += 1
    else others += 1
  }

  return [
    { label: 'Students', value: students, color: '#818cf8' },
    { label: 'Mentors', value: mentors, color: '#10b981' },
    { label: 'Admins', value: admins, color: '#f59e0b' },
    { label: 'Professionals', value: professionals, color: '#3b82f6' },
    { label: 'Others', value: others, color: '#8b5cf6' },
  ].filter((s) => s.value > 0)
}

export interface LiveActivityItem {
  id: string
  text: string
  time: string
  color: string
  tab?: string
}

export function buildLiveActivity(
  users: AdminAccount[],
  applications: { id: string; username: string | null; status: string; createdAt: string; headline: string | null }[],
  posts: { id: string; authorDisplayName: string; createdAt: string }[],
  rooms: { id: string; title: string; hostDisplayName: string; createdAt: string }[]
): LiveActivityItem[] {
  const events: { at: string; item: LiveActivityItem }[] = []

  for (const u of users) {
    events.push({
      at: u.createdAt,
      item: {
        id: `user-${u.id}`,
        text: `${u.username} joined the platform`,
        time: formatRelativeTime(u.createdAt),
        color: '#818cf8',
        tab: 'users',
      },
    })
  }

  for (const a of applications) {
    events.push({
      at: a.createdAt,
      item: {
        id: `app-${a.id}`,
        text: `${a.username ?? 'User'} applied for mentorship (${a.status})`,
        time: formatRelativeTime(a.createdAt),
        color: a.status === 'PENDING' ? '#f59e0b' : '#10b981',
        tab: 'requests',
      },
    })
  }

  for (const p of posts.slice(0, 20)) {
    events.push({
      at: p.createdAt,
      item: {
        id: `post-${p.id}`,
        text: `${p.authorDisplayName} published a community post`,
        time: formatRelativeTime(p.createdAt),
        color: '#06b6d4',
        tab: 'discussions',
      },
    })
  }

  for (const r of rooms.slice(0, 15)) {
    events.push({
      at: r.createdAt,
      item: {
        id: `room-${r.id}`,
        text: `${r.hostDisplayName} started room “${r.title}”`,
        time: formatRelativeTime(r.createdAt),
        color: '#ec4899',
        tab: 'rooms',
      },
    })
  }

  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 12)
    .map((e) => e.item)
}

export interface AdminSearchResult {
  id: string
  type: 'user' | 'application' | 'room' | 'post'
  title: string
  subtitle: string
  tab: string
}

export function searchAdminData(
  query: string,
  users: AdminAccount[],
  applications: { id: string; username: string | null; headline: string | null; status: string }[],
  rooms: { id: string; title: string; hostDisplayName: string }[],
  posts: { id: string; authorDisplayName: string; content: string }[]
): AdminSearchResult[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const results: AdminSearchResult[] = []

  for (const u of users) {
    if (u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
      results.push({
        id: u.id,
        type: 'user',
        title: u.username,
        subtitle: u.email,
        tab: 'users',
      })
    }
  }

  for (const a of applications) {
    const hay = `${a.username ?? ''} ${a.headline ?? ''} ${a.status}`.toLowerCase()
    if (hay.includes(q)) {
      results.push({
        id: a.id,
        type: 'application',
        title: a.headline ?? 'Mentor application',
        subtitle: `by ${a.username ?? 'unknown'} · ${a.status}`,
        tab: 'requests',
      })
    }
  }

  for (const r of rooms) {
    if (r.title.toLowerCase().includes(q) || r.hostDisplayName.toLowerCase().includes(q)) {
      results.push({
        id: r.id,
        type: 'room',
        title: r.title,
        subtitle: `Host: ${r.hostDisplayName}`,
        tab: 'rooms',
      })
    }
  }

  for (const p of posts) {
    if (p.content.toLowerCase().includes(q) || p.authorDisplayName.toLowerCase().includes(q)) {
      results.push({
        id: p.id,
        type: 'post',
        title: p.authorDisplayName,
        subtitle: p.content.slice(0, 60),
        tab: 'discussions',
      })
    }
  }

  return results.slice(0, 12)
}
