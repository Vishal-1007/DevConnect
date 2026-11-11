/** Sign-in intent persisted across sessions. */
export type SignInMode = 'candidate' | 'mentor' | 'recruiter'

export type SignupRole = SignInMode

export const SIGNIN_MODE_KEY = 'dc_signin_mode'

function normalizeStoredMode(raw: string | null): SignInMode {
  if (raw === 'mentor' || raw === 'developer') return 'mentor'
  if (raw === 'recruiter') return 'recruiter'
  return 'candidate'
}

export function getSignInMode(): SignInMode {
  return normalizeStoredMode(localStorage.getItem(SIGNIN_MODE_KEY))
}

export function setSignInMode(mode: SignInMode) {
  localStorage.setItem(SIGNIN_MODE_KEY, mode)
}

function parseRoles(roles?: string | null): string[] {
  if (!roles) return []
  return roles
    .split(',')
    .map((r) => r.trim().toUpperCase())
    .filter(Boolean)
    .map((role) => (role.startsWith('ROLE_') ? role.slice(5) : role))
}

export function hasAdminRole(roles?: string | null): boolean {
  return parseRoles(roles).includes('ADMIN')
}

export function hasMentorRole(roles?: string | null): boolean {
  return parseRoles(roles).includes('MENTOR')
}

export function hasRecruiterRole(roles?: string | null): boolean {
  const parsed = parseRoles(roles)
  return parsed.includes('RECRUITER') || parsed.includes('ADMIN')
}

/** USER maps to candidate workspace in the product UI. */
export function hasCandidateRole(roles?: string | null): boolean {
  const set = parseRoles(roles)
  return set.includes('USER') || set.includes('CANDIDATE') || set.length === 0
}

export function resolvePostLoginPath(
  roles: string | undefined,
  mode: SignInMode,
  routerFrom?: string,
  mentorAccessGranted?: boolean
): string {
  if (mode === 'mentor' && mentorAccessGranted) return '/mentor/dashboard'
  if (mode === 'recruiter') return '/recruiter/dashboard'
  if (mode === 'candidate' && hasAdminRole(roles)) return '/admin/dashboard'
  if (routerFrom && routerFrom !== '/login' && !routerFrom.startsWith('/register')) {
    return routerFrom
  }
  if (mode === 'candidate') return '/dashboard'
  return '/dashboard'
}

export function resolveSignupRedirect(role: SignupRole): string {
  if (role === 'mentor') return '/mentors'
  if (role === 'recruiter') return '/recruiter/dashboard'
  return '/dashboard'
}

export function resolveAuthenticatedHomePath(roles?: string | null): string {
  const mode = getSignInMode()
  if (mode === 'recruiter') return '/recruiter/dashboard'
  if (mode === 'mentor') return '/mentor/dashboard'
  if (hasAdminRole(roles)) return '/admin/dashboard'
  return '/dashboard'
}

export function mapSignupRoleToApi(role: SignupRole): string {
  switch (role) {
    case 'mentor':
      return 'USER'
    case 'recruiter':
      return 'RECRUITER'
    default:
      return 'USER'
  }
}
