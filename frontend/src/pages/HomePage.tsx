import { Navigate } from 'react-router-dom'
import { useGetMeQuery } from '../api/authApi'
import { useAppSelector } from '../hooks'
import { resolveAuthenticatedHomePath } from '../lib/roles'

export function HomePage() {
  const token = useAppSelector((s) => s.auth.accessToken)
  const account = useAppSelector((s) => s.auth.account)
  const { data: me, isLoading } = useGetMeQuery(undefined, { skip: !token })

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const roles = account?.roles ?? me?.roles
  if (isLoading && !roles) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[#8b8ca8]">
        Loading…
      </div>
    )
  }

  return <Navigate to={resolveAuthenticatedHomePath(roles)} replace />
}
