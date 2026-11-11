import { useMemo, useState } from 'react'
import { Calendar, Check, ChevronLeft, ChevronRight, Clock, Loader2, X } from 'lucide-react'
import { BookingCalendar } from '../mock-interviews/BookingCalendar'
import { formatDisplayDate, formatSlotTime } from '../../lib/bookingDates'
import {
  buildScheduledInterview,
  getAvailableInterviewDates,
  getSlotsForDate,
  INTERVIEW_DURATIONS,
  INTERVIEW_TYPES,
  saveScheduledInterview,
  type ScheduledInterview,
} from '../../lib/recruiterInterviews'
import type { RecruiterCandidate } from '../../data/recruiterData'
import { RECRUITER_JOBS } from '../../data/recruiterData'

type Props = {
  candidate: RecruiterCandidate
  onClose: () => void
  onScheduled?: (interview: ScheduledInterview) => void
}

export function ScheduleInterviewModal({ candidate, onClose, onScheduled }: Props) {
  const availableDates = useMemo(() => getAvailableInterviewDates(), [])
  const jobOptions = useMemo(
    () => [candidate.role, ...RECRUITER_JOBS.map((j) => j.title)],
    [candidate.role],
  )

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [jobTitle, setJobTitle] = useState(jobOptions[0])
  const [interviewType, setInterviewType] = useState<string>(INTERVIEW_TYPES[0])
  const [duration, setDuration] = useState<number>(45)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmed, setConfirmed] = useState<ScheduledInterview | null>(null)

  const slots = useMemo(
    () => (selectedDate ? getSlotsForDate(selectedDate) : []),
    [selectedDate],
  )
  const availableSlots = slots.filter((s) => s.available)

  function handleDateSelect(date: string) {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  function canProceed(): boolean {
    if (step === 1) return !!jobTitle && !!interviewType
    if (step === 2) return !!selectedDate && !!selectedTime
    return true
  }

  async function handleConfirm() {
    if (!selectedDate || !selectedTime) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))

    const interview = buildScheduledInterview(candidate, {
      jobTitle,
      interviewType,
      date: selectedDate,
      time: selectedTime,
      durationMinutes: duration,
      notes,
    })
    saveScheduledInterview(interview)
    setConfirmed(interview)
    setSaving(false)
  }

  function handleDone() {
    if (confirmed) onScheduled?.(confirmed)
    onClose()
  }

  if (confirmed) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-[#2d2e3e] bg-[#161722] p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <Check size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Interview Scheduled</h2>
            <p className="mt-2 text-sm text-[#8b8ca8]">
              {candidate.name} · {formatDisplayDate(confirmed.date)} at {formatSlotTime(confirmed.time)}
            </p>
            <p className="mt-1 text-xs text-violet-300">
              {confirmed.jobTitle} · {confirmed.interviewType} · {confirmed.durationMinutes} min
            </p>
            <p className="mt-3 text-[11px] text-[#5c5d72]">
              Calendar file downloaded. Candidate will receive a notification.
            </p>
            <button
              type="button"
              onClick={handleDone}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#2d2e3e] bg-[#161722] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="schedule-interview-title"
      >
        <div className="flex items-center justify-between border-b border-[#2d2e3e] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
              {candidate.avatar}
            </div>
            <div>
              <h2 id="schedule-interview-title" className="text-base font-bold text-white">
                Schedule Interview
              </h2>
              <p className="text-xs text-[#8b8ca8]">with {candidate.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8b8ca8] hover:bg-[#2d2e3e]/50 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-5 py-3">
          <div className="flex items-center gap-2">
            {(['Details', 'Date & Time', 'Confirm'] as const).map((label, i) => {
              const n = (i + 1) as 1 | 2 | 3
              const done = step > n
              const active = step === n
              return (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      done
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : active
                          ? 'bg-[#6366f1] text-white'
                          : 'bg-[#2d2e3e]/50 text-[#5c5d72]'
                    }`}
                  >
                    {done ? <Check size={12} /> : n}
                  </div>
                  <span className={`hidden text-[10px] sm:inline ${active ? 'text-white' : 'text-[#5c5d72]'}`}>
                    {label}
                  </span>
                  {i < 2 && <div className="h-px flex-1 bg-[#2d2e3e]" />}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {step === 1 && (
            <>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">Job Role</label>
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

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">Interview Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {INTERVIEW_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInterviewType(type)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
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

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">Duration</label>
                <div className="flex gap-2">
                  {INTERVIEW_DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold transition ${
                        duration === d
                          ? 'border-[#6366f1] bg-[#6366f1]/15 text-white'
                          : 'border-[#2d2e3e] text-[#8b8ca8] hover:border-violet-500/40'
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <BookingCalendar
                selectedDate={selectedDate}
                availableDates={availableDates}
                onSelectDate={handleDateSelect}
                footerHint="Select an available weekday to schedule the interview"
              />

              {selectedDate && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#8b8ca8]">
                    <Clock size={13} />
                    Available Slots — {formatDisplayDate(selectedDate)}
                  </p>
                  {availableSlots.length === 0 ? (
                    <p className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14] py-4 text-center text-sm text-[#8b8ca8]">
                      No slots on this date. Pick another day.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition ${
                            !slot.available
                              ? 'cursor-not-allowed border-[#2d2e3e]/50 text-[#3d3e52] line-through'
                              : selectedTime === slot.time
                                ? 'border-[#6366f1] bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/25'
                                : 'border-[#2d2e3e] text-[#b4b5c8] hover:border-[#6366f1]/40 hover:bg-[#6366f1]/10'
                          }`}
                        >
                          {formatSlotTime(slot.time)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {step === 3 && selectedDate && selectedTime && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14] p-4">
                <h3 className="mb-3 text-sm font-bold text-white">Interview Summary</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#8b8ca8]">Candidate</dt>
                    <dd className="font-medium text-white">{candidate.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#8b8ca8]">DevScore</dt>
                    <dd className="font-bold text-violet-300">{candidate.devScore}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#8b8ca8]">Job</dt>
                    <dd className="text-white">{jobTitle}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#8b8ca8]">Type</dt>
                    <dd className="text-white">{interviewType}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#8b8ca8]">Date</dt>
                    <dd className="text-white">{formatDisplayDate(selectedDate)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#8b8ca8]">Time</dt>
                    <dd className="text-white">{formatSlotTime(selectedTime)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#8b8ca8]">Duration</dt>
                    <dd className="text-white">{duration} minutes</dd>
                  </div>
                </dl>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#8b8ca8]">
                  Notes for candidate (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Prepare for system design discussion..."
                  className="w-full resize-none rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white placeholder:text-[#5c5d72] focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-[#2d2e3e] px-5 py-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="flex items-center gap-1 rounded-xl border border-[#2d2e3e] px-4 py-2.5 text-sm font-medium text-[#8b8ca8] hover:text-white"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              disabled={!canProceed()}
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleConfirm()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
              Confirm & Add to Calendar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
