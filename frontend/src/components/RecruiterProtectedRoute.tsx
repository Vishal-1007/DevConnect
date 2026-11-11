import { Navigate, useLocation } from 'react-router-dom'
import { useGetMeQuery } from '../api/authApi'
import { useAppSelector } from '../hooks'
import { hasRecruiterRole } from '../lib/roles'

export function RecruiterProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const token = useAppSelector((s) => s.auth.accessToken)
  const roles = useAppSelector((s) => s.auth.account?.roles)
  const { isLoading, isError } = useGetMeQuery(undefined, { skip: !token })

  const returnPath = `${location.pathname}${location.search}`

  if (!token) {
    return <Navigate to="/login" replace state={{ from: returnPath }} />
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0c14] text-[#8b8ca8]">
        Loading…
      </div>
    )
  }

  if (isError) {
    return <Navigate to="/login" replace state={{ from: returnPath }} />
  }

  if (!hasRecruiterRole(roles)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          recruiterAccessDenied: true,
          from: returnPath,
          message:
            'Only recruiter accounts can access the Recruiter Portal. Sign in with a recruiter account or register as a recruiter.',
        }}
      />
    )
  }

  return <>{children}</>
}
