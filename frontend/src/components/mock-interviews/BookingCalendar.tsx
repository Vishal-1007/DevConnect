import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toDateKey } from '../../lib/bookingDates'

interface BookingCalendarProps {
  selectedDate: string | null
  availableDates: Set<string>
  onSelectDate: (date: string) => void
  onMonthChange?: (year: number, month: number) => void
  minDate?: Date
  footerHint?: string
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = (first.getDay() + 6) % 7
  const days: (Date | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  while (days.length % 7 !== 0) days.push(null)
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

export function BookingCalendar({
  selectedDate,
  availableDates,
  onSelectDate,
  onMonthChange,
  minDate = new Date(),
  footerHint = 'Only days matching mentor weekly availability are selectable',
}: BookingCalendarProps) {
  const today = useMemo(() => {
    const d = new Date(minDate)
    d.setHours(0, 0, 0, 0)
    return d
  }, [minDate])

  const [viewMonth, setViewMonth] = useState(() => {
    const base = selectedDate ? new Date(selectedDate + 'T12:00:00') : today
    return { year: base.getFullYear(), month: base.getMonth() }
  })

  const weeks = useMemo(
    () => buildMonthGrid(viewMonth.year, viewMonth.month),
    [viewMonth.year, viewMonth.month]
  )

  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  function prevMonth() {
    setViewMonth((v) => {
      const d = new Date(v.year, v.month - 1, 1)
      const next = { year: d.getFullYear(), month: d.getMonth() }
      onMonthChange?.(next.year, next.month)
      return next
    })
  }

  function nextMonth() {
    setViewMonth((v) => {
      const d = new Date(v.year, v.month + 1, 1)
      const next = { year: d.getFullYear(), month: d.getMonth() }
      onMonthChange?.(next.year, next.month)
      return next
    })
  }

  return (
    <div className="rounded-xl bg-[#0b0c14] border border-[#2d2e3e] p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 rounded-lg text-[#8b8ca8] hover:text-white hover:bg-[#2d2e3e]/60"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-bold text-white">{monthLabel}</p>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 rounded-lg text-[#8b8ca8] hover:text-white hover:bg-[#2d2e3e]/60"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold uppercase text-[#5c5d72] py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="aspect-square" />
          }
          const key = toDateKey(date.getFullYear(), date.getMonth(), date.getDate())
          const isPast = date < today
          const hasSlots = availableDates.has(key)
          const isSelected = selectedDate === key
          const disabled = isPast || !hasSlots

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(key)}
              className={`aspect-square rounded-lg text-sm font-semibold transition-all ${
                isSelected
                  ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                  : disabled
                    ? 'text-[#3d3e52] cursor-not-allowed'
                    : hasSlots
                      ? 'text-white hover:bg-[#6366f1]/20 border border-transparent hover:border-[#6366f1]/40'
                      : 'text-[#5c5d72] cursor-not-allowed'
              }`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      <p className="text-[10px] text-[#5c5d72] mt-3 text-center">
        {footerHint}
      </p>
    </div>
  )
}

export function dateKeysFromSlots(slots: { date: string; available: boolean }[]): Set<string> {
  const set = new Set<string>()
  for (const s of slots) {
    if (s.available) set.add(s.date)
  }
  return set
}
