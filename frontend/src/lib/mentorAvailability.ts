import type { AvailabilitySlot } from '../api/mentorWorkspaceApi'

export const AVAIL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export const DAY_TO_JAVA: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }
export const JAVA_TO_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const HOUR_SLOTS = Array.from({ length: 14 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`)

export const TIMEZONE_OPTIONS = [
  { id: 'Asia/Kolkata', label: 'India (IST)' },
  { id: 'America/New_York', label: 'US Eastern' },
  { id: 'America/Los_Angeles', label: 'US Pacific' },
  { id: 'Europe/London', label: 'UK (GMT/BST)' },
  { id: 'Europe/Berlin', label: 'Central Europe' },
  { id: 'Asia/Singapore', label: 'Singapore' },
  { id: 'UTC', label: 'UTC' },
]

export const SCHEDULE_PRESETS: { id: string; label: string; sub: string; apply: () => Record<string, Set<string>> }[] = [
  {
    id: 'evening-weekdays',
    label: 'Evening Weekdays',
    sub: 'Mon–Fri · 7 PM – 11 PM',
    apply: () => presetGrid([1, 2, 3, 4, 5], 19, 23),
  },
  {
    id: 'morning-weekdays',
    label: 'Morning Weekdays',
    sub: 'Mon–Fri · 9 AM – 12 PM',
    apply: () => presetGrid([1, 2, 3, 4, 5], 9, 12),
  },
  {
    id: 'weekend-intensive',
    label: 'Weekend Intensive',
    sub: 'Sat–Sun · 10 AM – 6 PM',
    apply: () => presetGrid([6, 0], 10, 18),
  },
]

function presetGrid(days: number[], startHour: number, endHour: number): Record<string, Set<string>> {
  const grid: Record<string, Set<string>> = Object.fromEntries(AVAIL_DAYS.map((d) => [d, new Set<string>()]))
  for (const dayNum of days) {
    const day = JAVA_TO_DAY[dayNum] ?? 'Mon'
    for (let h = startHour; h < endHour; h++) {
      grid[day]?.add(`${String(h).padStart(2, '0')}:00`)
    }
  }
  return grid
}

export function slotsToGrid(slots: AvailabilitySlot[]): Record<string, Set<string>> {
  const grid: Record<string, Set<string>> = Object.fromEntries(AVAIL_DAYS.map((d) => [d, new Set<string>()]))
  for (const slot of slots) {
    const day = JAVA_TO_DAY[slot.dayOfWeek] ?? 'Mon'
    const startH = parseInt(slot.startTime.split(':')[0] ?? '0', 10)
    const endH = parseInt(slot.endTime.split(':')[0] ?? '0', 10)
    for (let h = startH; h < endH; h++) {
      grid[day]?.add(`${String(h).padStart(2, '0')}:00`)
    }
  }
  return grid
}

export function gridToSlots(grid: Record<string, Set<string>>) {
  const slots: { dayOfWeek: number; startTime: string; endTime: string }[] = []
  for (const day of AVAIL_DAYS) {
    const hours = [...(grid[day] ?? [])].map((s) => parseInt(s.split(':')[0] ?? '0', 10)).sort((a, b) => a - b)
    if (hours.length === 0) continue
    let start = hours[0]
    let prev = hours[0]
    for (let i = 1; i <= hours.length; i++) {
      const h = hours[i]
      if (h === prev + 1) { prev = h; continue }
      slots.push({
        dayOfWeek: DAY_TO_JAVA[day] ?? 1,
        startTime: `${String(start).padStart(2, '0')}:00`,
        endTime: `${String(prev + 1).padStart(2, '0')}:00`,
      })
      start = h
      prev = h
    }
  }
  return slots
}

export function countSelectedSlots(grid: Record<string, Set<string>>) {
  return AVAIL_DAYS.reduce((sum, day) => sum + (grid[day]?.size ?? 0), 0)
}

export function addDayTimeRange(
  grid: Record<string, Set<string>>,
  day: string,
  startHour: number,
  endHour: number
): Record<string, Set<string>> {
  const next = { ...grid, [day]: new Set(grid[day] ?? []) }
  for (let h = startHour; h < endHour; h++) {
    next[day].add(`${String(h).padStart(2, '0')}:00`)
  }
  return next
}

export function slotsToSummary(slots: AvailabilitySlot[]): string[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return slots.map((s) => {
    const day = dayNames[s.dayOfWeek] ?? 'Day'
    return `${day} ${formatHour12(s.startTime)} – ${formatHour12(s.endTime)}`
  })
}

function formatHour12(time24: string): string {
  const h = parseInt(time24.split(':')[0] ?? '0', 10)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:00 ${suffix}`
}

export const TIME_RANGE_OPTIONS = Array.from({ length: 17 }, (_, i) => {
  const h = i + 7
  return { value: h, label: formatHour12(`${String(h).padStart(2, '0')}:00`) }
})

