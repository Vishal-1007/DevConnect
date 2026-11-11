import { BadgeCheck, Calendar, MessageCircle, MoreHorizontal, Video } from 'lucide-react'
import { formatDisplayDate, formatSlotTime } from '../../../lib/bookingDates'
import type { RecruiterInterview } from '../../../data/recruiterInterviewData'

type Props = {
  interview: RecruiterInterview
  onView: (interview: RecruiterInterview) => void
}

function statusStyle(status: RecruiterInterview['status']) {
  if (status === 'Upcoming') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (status === 'Cancelled') return 'border-red-500/30 bg-red-500/10 text-red-300'
  return 'border-blue-500/30 bg-blue-500/10 text-blue-300'
}

function relativeDateLabel(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const scheduled = new Date(y, (m ?? 1) - 1, d ?? 1)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  scheduled.setHours(0, 0, 0, 0)
  const diff = Math.round((scheduled.getTime() - today.getTime()) / 86_400_000)
  const timeLabel = formatSlotTime(time)
  if (diff === 0) return `Today, ${timeLabel}`
  if (diff === 1) return `Tomorrow, ${timeLabel}`
  if (diff === -1) return `Yesterday, ${timeLabel}`
  return `${formatDisplayDate(date)}, ${timeLabel}`
}

export function InterviewTable({ interviews, onView }: { interviews: RecruiterInterview[]; onView: (i: RecruiterInterview) => void }) {
  if (interviews.length === 0) {
    return (
      <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 px-6 py-14 text-center backdrop-blur-md">
        <p className="text-sm text-[#8b8ca8]">No interviews match your filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead>
            <tr className="border-b border-[#2d2e3e] text-[11px] uppercase tracking-wide text-[#8b8ca8]">
              <th className="px-4 py-3 font-medium">Candidate</th>
              <th className="px-4 py-3 font-medium">Job Role</th>
              <th className="px-4 py-3 font-medium">Interview Type</th>
              <th className="px-4 py-3 font-medium">Date & Time</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((interview) => (
              <InterviewRow key={interview.id} interview={interview} onView={onView} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#2d2e3e]/60 px-4 py-3 text-xs text-[#8b8ca8]">
        Showing 1 to {interviews.length} of {interviews.length} results
      </div>
    </div>
  )
}

function InterviewRow({ interview, onView }: Props) {
  return (
    <tr
      className="cursor-pointer border-b border-[#2d2e3e]/50 hover:bg-white/[0.02]"
      onClick={() => onView(interview)}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
            {interview.candidateAvatar}
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
              {interview.candidateName}
              {interview.verified && <BadgeCheck size={14} className="text-blue-400" />}
            </p>
            <p className="text-[11px] font-medium text-emerald-400">DevScore {interview.devScore}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="text-sm font-medium text-white">{interview.jobTitle}</p>
        <p className="text-xs text-[#8b8ca8]">{interview.company}</p>
      </td>
      <td className="px-4 py-4">
        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-200">
          {interview.interviewType}
        </span>
      </td>
      <td className="px-4 py-4">
        <p className="flex items-center gap-1.5 text-sm text-white">
          <Calendar size={13} className="text-[#8b8ca8]" />
          {relativeDateLabel(interview.date, interview.time)}
        </p>
        <p className="mt-0.5 text-[11px] text-[#8b8ca8]">{formatDisplayDate(interview.date)}</p>
      </td>
      <td className="px-4 py-4">
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyle(interview.status)}`}>
          {interview.status}
        </span>
      </td>
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => interview.meetingLink && window.open(interview.meetingLink, '_blank')}
            className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] hover:text-white"
            title="Video Call"
          >
            <Video size={14} />
          </button>
          <button
            type="button"
            className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] hover:text-white"
            title="Message"
          >
            <MessageCircle size={14} />
          </button>
          <button
            type="button"
            onClick={() => onView(interview)}
            className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] hover:text-white"
            title="More"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}
