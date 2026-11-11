export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function formatEventDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatEventDuration(startIso: string, endIso: string): string {
  const mins = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`
}

export function formatEventCountdown(startIso: string): string | null {
  const diffMs = new Date(startIso).getTime() - Date.now()
  if (diffMs <= 0) return null
  const days = Math.floor(diffMs / 86_400_000)
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000)
  const mins = Math.floor((diffMs % 3_600_000) / 60_000)
  if (days > 0) return `${days} Day${days === 1 ? '' : 's'} ${hours} Hour${hours === 1 ? '' : 's'}`
  if (hours > 0) return `${hours} Hour${hours === 1 ? '' : 's'} ${mins} Min`
  return `${mins} Min`
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatCallDuration(startedAt: number | null): string {
  if (!startedAt) return '00:00'
  const seconds = Math.floor((Date.now() - startedAt) / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
