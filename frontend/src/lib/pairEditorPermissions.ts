/**
 * Pair programming editor permissions.
 * Students (driver/navigator) and mentors can edit; observers are read-only.
 * Editor is only locked when the session has ended.
 */
export function canEditPairCode(
  participantRole: string | undefined,
  fallbackRole: string,
  sessionStatus: string | undefined
): boolean {
  if (
    sessionStatus === 'COMPLETED' ||
    sessionStatus === 'CANCELLED' ||
    sessionStatus === 'ENDED'
  ) {
    return false
  }

  const role = (participantRole ?? fallbackRole ?? 'driver').toLowerCase()

  if (role === 'observer' || role === 'viewer') {
    return false
  }

  // Active session: allow editing while participant role is still loading
  if (!participantRole && sessionStatus === 'ACTIVE') {
    return true
  }

  return (
    role === 'driver' ||
    role === 'navigator' ||
    role === 'mentor' ||
    role === 'student'
  )
}

export const MONACO_EDITOR_OPTIONS = {
  readOnly: false,
  fontSize: 14,
  minimap: { enabled: false },
  lineNumbers: 'on' as const,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
}
