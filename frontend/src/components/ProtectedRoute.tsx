import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '../hooks'
import { useGetMeQuery } from '../api/authApi'

export function ProtectedRoute() {
  const location = useLocation()
  const token = useAppSelector((s) => s.auth.accessToken)
  const { isLoading, isError } = useGetMeQuery(undefined, { skip: !token })

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        Loading…
      </div>
    )
  }

  if (isError) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
