import { Link, Navigate, useParams } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useListMyMockInterviewRequestsQuery } from '../api/mockInterviewApi'

export function InterviewRoomPage() {
  const { bookingId = '' } = useParams<{ bookingId: string }>()
  const { data: requests = [], isLoading } = useListMyMockInterviewRequestsQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-[#8b8ca8] gap-2">
        <Loader2 className="animate-spin" size={20} /> Loading interview room…
      </div>
    )
  }

  const booking = requests.find((r) => r.id === bookingId)
  if (booking?.sessionCode) {
    return <Navigate to={`/mock-interviews/session/${booking.sessionCode}`} replace />
  }

  return (
    <div className="p-6 max-w-lg mx-auto text-center">
      <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
      <p className="text-white font-semibold mb-1">Interview room unavailable</p>
      <p className="text-sm text-[#8b8ca8] mb-4">
        This booking was not found or the session has not been created yet.
      </p>
      <Link to="/mock-interviews" className="text-sm text-[#818cf8] hover:underline">
        Back to Mock Interviews
      </Link>
    </div>
  )
}
