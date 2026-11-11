import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useGetMentorAccessQuery } from '../api/mentorApi'

export function MentorProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { data: access, isLoading } = useGetMentorAccessQuery()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b0c14]">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    )
  }

  if (!access?.canAccess) {
    return (
      <Navigate
        to="/mentors"
        replace
        state={{
          mentorAccessDenied: true,
          status: access?.status ?? null,
          message: access?.message ?? 'Mentor workspace access requires admin approval.',
          from: location.pathname,
        }}
      />
    )
  }

  return <>{children}</>
}
