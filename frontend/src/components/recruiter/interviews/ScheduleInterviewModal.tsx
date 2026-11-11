import { useMemo, useState } from 'react'
import { Calendar, Check, Loader2, X } from 'lucide-react'
import { BookingCalendar } from '../../mock-interviews/BookingCalendar'
import { formatDisplayDate, formatSlotTime } from '../../../lib/bookingDates'
import {
  getAvailableInterviewDates,
  getSlotsForDate,
  INTERVIEW_DURATIONS,
} from '../../../lib/recruiterInterviews'
import {
  INTERVIEW_TYPE_OPTIONS,
  MEETING_PLATFORMS,
  type InterviewType,
  type MeetingPlatform,
  type RecruiterInterview,
} from '../../../data/recruiterInterviewData'
import { RECRUITER_CANDIDATES } from '../../../data/recruiterData'
import { loadRecruiterJobs } from '../../../lib/recruiterPortalState'
import { addRecruiterInterview } from '../../../lib/recruiterInterviewStore'

type Props = {
  onClose: () => void
  onScheduled: (interviews: RecruiterInterview[]) => void
}

function isoAt(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0).toISOString()
}

export function ScheduleInterviewModal({ onClose, onScheduled }: Props) {
  const availableDates = useMemo(() => getAvailableInterviewDates(), [])
  const candidates = RECRUITER_CANDIDATES
  const jobOptions = useMemo(() => loadRecruiterJobs().map((j) => j.title), [])

  const [candidateId, setCandidateId] = useState(candidates[0]?.id ?? '')
  const [jobTitle, setJobTitle] = useState(jobOptions[0] ?? 'Backend Developer')
  const [interviewType, setInterviewType] = useState<InterviewType>(INTERVIEW_TYPE_OPTIONS[0])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [duration, setDuration] = useState(45)
  const [platform, setPlatform] = useState<MeetingPlatform>('Google Meet')
  const [interviewerName, setInterviewerName] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const candidate = candidates.find((c) => c.id === candidateId) ?? candidates[0]
  const slots = useMemo(
    () => (selectedDate ? getSlotsForDate(selectedDate) : []),
    [selectedDate],
  )

  async function handleSchedule() {
    if (!candidate || !selectedDate || !selectedTime) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))

    const interview: RecruiterInterview = {
      id: `int-${Date.now()}`,
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateAvatar: candidate.avatar,
      devScore: candidate.devScore,
      verified: candidate.verified,
      skills: candidate.skills,
      jobTitle,
      company: 'Infosys',
      interviewType,
      date: selectedDate,
      time: selectedTime,
      durationMinutes: duration,
      status: 'Upcoming',
      platform,
      meetingLink: platform === 'Google Meet' ? 'https://meet.google.com/new' : '#',
      interviewerName: interviewerName.trim() || undefined,
      notes: notes.trim() || undefined,
      scheduledAt: isoAt(selectedDate, selectedTime),
      aiInterviewScore: candidate.breakdown?.aiInterview,
      codingScore: candidate.breakdown?.codingScore,
      mentorRating: candidate.breakdown?.mentorRating,
      aiMatchPercent: candidate.aiMatch,
      resumeUrl: '#',
      projectLinks: candidate.projects?.map((p) => ({ name: p.name, url: '#' })),
    }

    const next = addRecruiterInterview(interview)
    setSaving(false)
    setConfirmed(true)
    onScheduled(next)
  }

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl border border-[#2d2e3e] bg-[#161722] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20">
              <Check size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Interview Scheduled</h2>
            <p className="mt-2 text-sm text-[#8b8ca8]">
              {candidate?.name} · {selectedDate && formatDisplayDate(selectedDate)}
              {selectedTime && ` at ${formatSlotTime(selectedTime)}`}
            </p>
            <button type="button" onClick={onClose} className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] py-2.5 text-sm font-semibold text-white">
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  const canSubmit = candidateId && jobTitle && selectedDate && selectedTime

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#2d2e3e] bg-[#161722] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-[#2d2e3e] px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Schedule Interview</h2>
            <p className="text-xs text-[#8b8ca8]">Book a slot with a verified candidate</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#8b8ca8] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">Select Candidate</label>
              <select
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                className="w-full rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · DevScore {c.devScore}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">Select Job</label>
              <select
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                {jobOptions.map((title) => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">Interview Type</label>
            <div className="grid grid-cols-2 gap-2">
              {INTERVIEW_TYPE_OPTIONS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInterviewType(type)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                    interviewType === type
                      ? 'border-[#6366f1] bg-[#6366f1]/15 text-white'
                      : 'border-[#2d2e3e] text-[#8b8ca8] hover:border-violet-500/40'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <BookingCalendar
            selectedDate={selectedDate}
            availableDates={availableDates}
            onSelectDate={(d) => { setSelectedDate(d); setSelectedTime(null) }}
            footerHint="Select an available weekday"
          />

          {selectedDate && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8b8ca8]">
                Time — {formatDisplayDate(selectedDate)}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {slots.filter((s) => s.available).map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedTime(slot.time)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                      selectedTime === slot.time
                        ? 'border-[#6366f1] bg-[#6366f1] text-white'
                        : 'border-[#2d2e3e] text-[#b4b5c8] hover:border-violet-500/40'
                    }`}
                  >
                    {formatSlotTime(slot.time)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">Duration</label>
            <div className="flex gap-2">
              {INTERVIEW_DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-semibold ${
                    duration === d ? 'border-[#6366f1] bg-[#6366f1]/15 text-white' : 'border-[#2d2e3e] text-[#8b8ca8]'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">Meeting Platform</label>
            <div className="flex gap-2">
              {MEETING_PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-semibold ${
                    platform === p ? 'border-[#6366f1] bg-[#6366f1]/15 text-white' : 'border-[#2d2e3e] text-[#8b8ca8]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <input
            placeholder="Interviewer Name"
            value={interviewerName}
            onChange={(e) => setInterviewerName(e.target.value)}
            className="w-full rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
          />

          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="border-t border-[#2d2e3e] px-5 py-4">
          <button
            type="button"
            disabled={!canSubmit || saving}
            onClick={() => void handleSchedule()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
            Schedule Interview
          </button>
        </div>
      </div>
    </div>
  )
}
