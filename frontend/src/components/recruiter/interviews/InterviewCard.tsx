import { ExternalLink } from 'lucide-react'
import { formatSlotTime } from '../../../lib/bookingDates'
import type { RecruiterInterview } from '../../../data/recruiterInterviewData'

type Props = {
  interview: RecruiterInterview
}

export function InterviewCard({ interview }: Props) {
  const time = formatSlotTime(interview.time)

  return (
    <div className="rounded-xl border border-[#2d2e3e]/80 bg-[#0b0c14]/60 p-3 backdrop-blur-sm">
      <p className="text-sm font-bold text-violet-300">{time}</p>
      <p className="mt-1 text-sm font-semibold text-white">{interview.candidateName}</p>
      <p className="text-xs text-[#8b8ca8]">{interview.jobTitle}</p>
      <p className="mt-1 text-[11px] text-violet-200">{interview.interviewType}</p>
      {interview.meetingLink && interview.status === 'Upcoming' && (
        <a
          href={interview.meetingLink}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-medium text-violet-200 hover:bg-violet-500/20"
        >
          <ExternalLink size={12} />
          {interview.platform}
        </a>
      )}
    </div>
  )
}
