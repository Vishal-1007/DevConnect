/** Date helpers for booking — never use toISOString() for day boundaries (UTC shift bug). */

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`
}

export function monthDateRange(year: number, month: number): { fromDate: string; toDate: string } {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return {
    fromDate: toDateKey(year, month, 1),
    toDate: toDateKey(year, month, lastDay),
  }
}

export function formatDisplayDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

/** Convert HH:mm (mentor timezone) to 12-hour display */
export function formatSlotTime(time24: string): string {
  const parts = time24.trim().split(':')
  const h = parseInt(parts[0] ?? '0', 10)
  const m = parseInt(parts[1] ?? '0', 10)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`
}
