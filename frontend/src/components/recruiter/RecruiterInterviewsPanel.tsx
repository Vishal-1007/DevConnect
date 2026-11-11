import { Calendar, Download, Video } from 'lucide-react'
import { formatDisplayDate, formatSlotTime } from '../../lib/bookingDates'
import { downloadInterviewIcs, type ScheduledInterview } from '../../lib/recruiterInterviews'

type Props = {
  interviews: ScheduledInterview[]
}

export function RecruiterInterviewsPanel({ interviews }: Props) {
  const upcoming = interviews
    .filter((i) => i.status === 'Scheduled' && new Date(i.scheduledAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  if (upcoming.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#2d2e3e] bg-[#161722]/40 p-8 text-center">
        <Calendar size={32} className="mb-3 text-violet-400/60" />
        <h2 className="text-lg font-semibold text-white">No interviews scheduled</h2>
        <p className="mt-2 max-w-md text-sm text-[#8b8ca8]">
          Open a candidate profile and use Schedule Interview to book a slot.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Upcoming Interviews</h2>
        <p className="text-sm text-[#8b8ca8]">{upcoming.length} scheduled session{upcoming.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-3">
        {upcoming.map((interview) => (
          <div
            key={interview.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-4 backdrop-blur-md"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
                <Calendar size={18} className="text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-white">{interview.candidateName}</p>
                <p className="text-xs text-[#8b8ca8]">{interview.jobTitle} · {interview.interviewType}</p>
                <p className="mt-1 text-sm text-violet-300">
                  {formatDisplayDate(interview.date)} at {formatSlotTime(interview.time)}
                  <span className="text-[#8b8ca8]"> · {interview.durationMinutes} min</span>
                </p>
                {interview.notes && (
                  <p className="mt-1 text-[11px] italic text-[#8b8ca8]">&ldquo;{interview.notes}&rdquo;</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-[#2d2e3e] bg-white/5 px-3 py-2 text-xs text-[#c4c5d6] hover:text-white"
              >
                <Video size={13} />
                Join
              </button>
              <button
                type="button"
                onClick={() => downloadInterviewIcs(interview)}
                className="flex items-center gap-1.5 rounded-lg border border-[#2d2e3e] bg-white/5 px-3 py-2 text-xs text-[#c4c5d6] hover:text-white"
              >
                <Download size={13} />
                .ics
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
