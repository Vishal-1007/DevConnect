import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useGetMeQuery } from '../api/authApi'
import { useAppSelector } from '../hooks'
import { getSignInMode, hasAdminRole } from '../lib/roles'

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const token = useAppSelector((s) => s.auth.accessToken)
  const account = useAppSelector((s) => s.auth.account)
  const { data: me, isLoading, isError } = useGetMeQuery(undefined, { skip: !token })

  const roles = account?.roles ?? me?.roles

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (isLoading && !roles) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b0c14]">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    )
  }

  if (isError) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (getSignInMode() === 'mentor') {
    return <Navigate to="/mentor/dashboard" replace />
  }

  if (!hasAdminRole(roles)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
