import { useMemo, useState } from 'react'

import { Check, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'

import {

  useBookMockInterviewMutation,

  useGetMockInterviewBookingSummaryQuery,

  type MockInterviewerCard,

} from '../../api/mockInterviewApi'

import { useGetMentorPublicAvailabilityQuery } from '../../api/mentorAvailabilityApi'

import { formatDisplayDate, formatSlotTime, monthDateRange } from '../../lib/bookingDates'

import { openRazorpayCheckout } from '../../lib/razorpayCheckout'

import { extractApiError } from '../../lib/extractApiError'

import { BookingCalendar, dateKeysFromSlots } from './BookingCalendar'



const INTERVIEW_TYPES = [
  'DSA',
  'System Design',
  'Backend',
  'Frontend',
  'Behavioral',
  'Resume Review',
] as const

const DURATIONS = [30, 45, 60] as const



const STEP_LABELS = ['Interview Type', 'Duration', 'Date', 'Time Slot', 'Payment']



interface BookSlotModalProps {

  interviewer: MockInterviewerCard

  onClose: () => void

  onSuccess?: () => void

}



export function BookSlotModal({ interviewer, onClose, onSuccess }: BookSlotModalProps) {

  const [step, setStep] = useState(1)

  const [interviewType, setInterviewType] = useState<string>(INTERVIEW_TYPES[0])

  const [duration, setDuration] = useState<number>(60)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const [calendarMonth, setCalendarMonth] = useState(() => {

    const now = new Date()

    return { year: now.getFullYear(), month: now.getMonth() }

  })

  const [error, setError] = useState<string | null>(null)

  const [paying, setPaying] = useState(false)



  const monthDates = useMemo(

    () => monthDateRange(calendarMonth.year, calendarMonth.month),

    [calendarMonth.year, calendarMonth.month]

  )



  const { data: monthAvailability, isLoading: loadingMonthSlots } = useGetMentorPublicAvailabilityQuery(

    {

      mentorId: interviewer.userId,

      fromDate: monthDates.fromDate,

      toDate: monthDates.toDate,

      durationMinutes: duration,

    },

    { skip: step < 3 }

  )



  const monthSlots = monthAvailability?.slots ?? []

  const availableDates = useMemo(() => dateKeysFromSlots(monthSlots), [monthSlots])



  const { data: dayAvailability, isLoading: loadingDaySlots } = useGetMentorPublicAvailabilityQuery(

    {

      mentorId: interviewer.userId,

      date: selectedDate ?? undefined,

      durationMinutes: duration,

    },

    { skip: step < 4 || !selectedDate }

  )



  const daySlots = dayAvailability?.slots ?? []



  const { data: summary } = useGetMockInterviewBookingSummaryQuery(

    { interviewerId: interviewer.userId, durationMinutes: duration },

    { skip: step < 5 }

  )



  const [bookInterview] = useBookMockInterviewMutation()



  const slotsForDate = daySlots.filter((s) => s.date === selectedDate && s.available)

  const selectedSlotData = slotsForDate.find((s) => s.startAt === selectedSlot)
  const selectedTimeLabel = selectedSlotData ? formatSlotTime(selectedSlotData.time) : '—'



  async function handlePayment() {

    if (!selectedSlot || !summary) return

    setError(null)

    setPaying(true)

    try {

      const payment = await openRazorpayCheckout({

        amount: summary.totalCents / 100,

        currency: summary.currency,

        description: `Mock interview with ${interviewer.name}`,

        keyId: '',

        idempotencyKey: `mock-interview-${interviewer.userId}-${selectedSlot}`,

      })

      await bookInterview({

        interviewerId: interviewer.userId,

        paymentId: payment.id,

        interviewType,

        scheduledAt: selectedSlot,

        durationMinutes: duration,

      }).unwrap()

      onSuccess?.()

      onClose()

    } catch (err) {

      setError(extractApiError(err))

    } finally {

      setPaying(false)

    }

  }



  function handleDateSelect(date: string) {

    setSelectedDate(date)

    setSelectedSlot(null)

  }



  function canProceed(): boolean {

    if (step === 3) return !!selectedDate

    if (step === 4) return !!selectedSlot

    return true

  }



  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>

      <div

        className="w-full max-w-xl rounded-2xl bg-[#161722] border border-[#2d2e3e] shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"

        onClick={(e) => e.stopPropagation()}

        role="dialog"

      >

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2e3e] bg-[#161722]">

          <div>

            <h2 className="text-lg font-bold text-white">Book Interview Slot</h2>

            <p className="text-xs text-[#8b8ca8]">with {interviewer.name}</p>

          </div>

          <button type="button" onClick={onClose} className="p-2 rounded-lg text-[#8b8ca8] hover:text-white hover:bg-[#2d2e3e]/50">

            <X size={18} />

          </button>

        </div>



        <div className="px-6 py-3 border-b border-[#2d2e3e]/60 bg-[#0b0c14]/40">

          <div className="flex items-center justify-between gap-1">

            {STEP_LABELS.map((label, i) => {

              const n = i + 1

              const done = step > n

              const active = step === n

              return (

                <div key={label} className="flex flex-col items-center flex-1 min-w-0">

                  <div

                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${

                      done

                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'

                        : active

                          ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/30'

                          : 'bg-[#2d2e3e]/50 text-[#5c5d72]'

                    }`}

                  >

                    {done ? <Check size={14} /> : n}

                  </div>

                  <span className={`text-[9px] truncate w-full text-center ${active ? 'text-white' : 'text-[#5c5d72]'}`}>

                    {label}

                  </span>

                </div>

              )

            })}

          </div>

        </div>



        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {step === 1 && (

            <div className="grid grid-cols-2 gap-2">

              {INTERVIEW_TYPES.map((type) => (

                <button

                  key={type}

                  type="button"

                  onClick={() => setInterviewType(type)}

                  className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${

                    interviewType === type

                      ? 'border-[#6366f1] bg-[#6366f1]/15 text-white shadow-md shadow-[#6366f1]/10'

                      : 'border-[#2d2e3e] text-[#8b8ca8] hover:border-[#6366f1]/40'

                  }`}

                >

                  {type}

                </button>

              ))}

            </div>

          )}



          {step === 2 && (

            <div className="grid grid-cols-2 gap-3">

              {DURATIONS.map((d) => (

                <button

                  key={d}

                  type="button"

                  onClick={() => {

                    setDuration(d)

                    setSelectedDate(null)

                    setSelectedSlot(null)

                  }}

                  className={`px-4 py-4 rounded-xl border text-sm font-semibold transition-all ${

                    duration === d

                      ? 'border-[#6366f1] bg-[#6366f1]/15 text-white'

                      : 'border-[#2d2e3e] text-[#8b8ca8] hover:border-[#6366f1]/40'

                  }`}

                >

                  {d} minutes

                </button>

              ))}

            </div>

          )}



          {step === 3 && (

            <div className="space-y-3">

              {loadingMonthSlots ? (

                <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#8b8ca8]">

                  <Loader2 size={18} className="animate-spin" /> Loading availability…

                </div>

              ) : monthAvailability && !monthAvailability.acceptingBookings ? (

                <p className="text-sm text-[#8b8ca8] py-4 text-center rounded-xl bg-[#0b0c14] border border-[#2d2e3e]">

                  This mentor has no availability set. Please try another interviewer.

                </p>

              ) : (

                <BookingCalendar

                  selectedDate={selectedDate}

                  availableDates={availableDates}

                  onSelectDate={handleDateSelect}

                  onMonthChange={(year, month) => setCalendarMonth({ year, month })}

                />

              )}

            </div>

          )}



          {step === 4 && (

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8ca8] mb-3">

                Available Slots — {selectedDate ? formatDisplayDate(selectedDate) : ''}

                {dayAvailability?.timezone && (

                  <span className="normal-case font-normal ml-1">({dayAvailability.timezone})</span>

                )}

              </p>

              {loadingDaySlots ? (

                <div className="flex items-center gap-2 text-sm text-[#8b8ca8] py-6">

                  <Loader2 size={16} className="animate-spin" /> Loading slots…

                </div>

              ) : slotsForDate.length === 0 ? (

                <p className="text-sm text-[#8b8ca8] py-4 text-center rounded-xl bg-[#0b0c14] border border-[#2d2e3e]">

                  No slots available on this date. Go back and pick another day.

                </p>

              ) : (

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">

                  {daySlots

                    .filter((s) => s.date === selectedDate)

                    .map((slot) => (

                      <button

                        key={slot.startAt}

                        type="button"

                        disabled={!slot.available}

                        onClick={() => setSelectedSlot(slot.startAt)}

                        className={`px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${

                          !slot.available

                            ? 'border-[#2d2e3e]/50 text-[#3d3e52] cursor-not-allowed line-through'

                            : selectedSlot === slot.startAt

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



          {step === 5 && summary && (

            <div className="rounded-xl bg-[#0b0c14] border border-[#2d2e3e] p-5 space-y-3">

              <h3 className="text-sm font-bold text-white mb-1">Payment Summary</h3>

              <div className="space-y-2.5 text-sm">

                <div className="flex justify-between gap-4">

                  <span className="text-[#8b8ca8]">Mentor</span>

                  <span className="text-white font-medium text-right">{interviewer.name}</span>

                </div>

                <div className="flex justify-between gap-4">

                  <span className="text-[#8b8ca8]">Interview</span>

                  <span className="text-white text-right">{interviewType}</span>

                </div>

                <div className="flex justify-between gap-4">

                  <span className="text-[#8b8ca8]">Date</span>

                  <span className="text-white text-right">{selectedDate ? formatDisplayDate(selectedDate) : '—'}</span>

                </div>

                <div className="flex justify-between gap-4">

                  <span className="text-[#8b8ca8]">Time</span>

                  <span className="text-white text-right">{selectedTimeLabel}</span>

                </div>

                <div className="flex justify-between gap-4">

                  <span className="text-[#8b8ca8]">Duration</span>

                  <span className="text-white text-right">{duration} minutes</span>

                </div>

                <div className="flex justify-between gap-4 pt-2 border-t border-[#2d2e3e]">

                  <span className="text-[#8b8ca8]">Interview fee</span>

                  <span className="text-white">₹{summary.interviewPriceCents / 100}</span>

                </div>

                <div className="flex justify-between gap-4">

                  <span className="text-[#8b8ca8]">Platform fee</span>

                  <span className="text-white">₹{summary.platformFeeCents / 100}</span>

                </div>

                <div className="flex justify-between gap-4 pt-2 border-t border-[#2d2e3e] font-bold text-base">

                  <span className="text-white">Total</span>

                  <span className="text-[#a5b4fc]">₹{summary.totalCents / 100}</span>

                </div>

              </div>

            </div>

          )}



          {error && (

            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>

          )}

        </div>



        <div className="flex gap-3 px-6 py-4 border-t border-[#2d2e3e] bg-[#161722]">

          {step > 1 && (

            <button

              type="button"

              onClick={() => setStep((s) => s - 1)}

              className="flex items-center gap-1 px-4 py-2.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] text-sm font-semibold hover:text-white"

            >

              <ChevronLeft size={16} /> Back

            </button>

          )}

          {step < 5 ? (

            <button

              type="button"

              disabled={!canProceed()}

              onClick={() => setStep((s) => s + 1)}

              className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50"

            >

              Next <ChevronRight size={16} />

            </button>

          ) : (

            <button

              type="button"

              disabled={paying || !selectedSlot}

              onClick={() => void handlePayment()}

              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg dc-gradient-btn text-white text-sm font-semibold disabled:opacity-50"

            >

              {paying ? <Loader2 size={16} className="animate-spin" /> : null}

              Pay & Confirm Booking

            </button>

          )}

        </div>

      </div>

    </div>

  )

}


