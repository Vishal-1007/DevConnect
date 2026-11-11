/**
 * MentorAvailabilityPanel — weekly schedule, timezone, vacation mode, auto-scheduling.
 */
import { useEffect, useState } from 'react'
import {
  Check, Loader2, AlertTriangle, Globe, Zap, Clock, CalendarDays,
} from 'lucide-react'
import {
  useGetMentorAvailabilityQuery,
  useSaveMentorAvailabilityMutation,
} from '../../api/mentorWorkspaceApi'
import {
  AVAIL_DAYS, HOUR_SLOTS, TIMEZONE_OPTIONS, SCHEDULE_PRESETS,
  slotsToGrid, gridToSlots, countSelectedSlots, addDayTimeRange,
  slotsToSummary, TIME_RANGE_OPTIONS, DAY_TO_JAVA, JAVA_TO_DAY,
} from '../../lib/mentorAvailability'

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  const m: Record<string, string> = {
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    violet: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    gray: 'bg-[#2d2e3e] text-[#8b8ca8] border-[#3d3e52]',
  }
  return <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${m[color] ?? m.gray}`}>{children}</span>
}

export function MentorAvailabilityPanel() {
  const { data, isLoading } = useGetMentorAvailabilityQuery()
  const [saveAvailability, { isLoading: saving }] = useSaveMentorAvailabilityMutation()

  const [available, setAvailable] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(AVAIL_DAYS.map((d) => [d, new Set<string>()])),
  )
  const [vacationMode, setVacationMode] = useState(false)
  const [autoScheduling, setAutoScheduling] = useState(true)
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [dirty, setDirty] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [addDay, setAddDay] = useState<string>('Mon')
  const [addStart, setAddStart] = useState(10)
  const [addEnd, setAddEnd] = useState(18)
  const [dayEnabled, setDayEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(AVAIL_DAYS.map((d) => [d, true]))
  )

  useEffect(() => {
    if (data) {
      setVacationMode(data.vacationMode)
      setAutoScheduling(data.autoSchedulingEnabled)
      setTimezone(data.timezone || 'Asia/Kolkata')
      const grid = slotsToGrid(data.slots)
      setAvailable(grid)
      setDayEnabled(Object.fromEntries(
        AVAIL_DAYS.map((d) => [d, (grid[d]?.size ?? 0) > 0])
      ))
      setDirty(false)
    }
  }, [data])

  function toggleDayEnabled(day: string) {
    setDayEnabled((prev) => {
      const next = { ...prev, [day]: !prev[day] }
      if (!next[day]) {
        setAvailable((g) => ({ ...g, [day]: new Set<string>() }))
        setDirty(true)
      }
      return next
    })
  }

  function handleAddTimeSlot() {
    if (vacationMode || addEnd <= addStart) return
    setAvailable((prev) => addDayTimeRange(prev, addDay, addStart, addEnd))
    setDayEnabled((prev) => ({ ...prev, [addDay]: true }))
    setDirty(true)
  }

  function toggle(day: string, slot: string) {
    if (vacationMode) return
    setAvailable((prev) => {
      const next = { ...prev }
      const s = new Set(next[day])
      if (s.has(slot)) s.delete(slot)
      else s.add(slot)
      next[day] = s
      return next
    })
    setDirty(true)
  }

  function applyPreset(apply: () => Record<string, Set<string>>) {
    setAvailable(apply())
    setVacationMode(false)
    setDirty(true)
  }

  function selectRow(slot: string) {
    const allSelected = AVAIL_DAYS.every((d) => available[d]?.has(slot))
    setAvailable((prev) => {
      const next = { ...prev }
      for (const day of AVAIL_DAYS) {
        const s = new Set(next[day])
        if (allSelected) s.delete(slot)
        else s.add(slot)
        next[day] = s
      }
      return next
    })
    setDirty(true)
  }

  function selectColumn(day: string) {
    const allSelected = HOUR_SLOTS.every((slot) => available[day]?.has(slot))
    setAvailable((prev) => {
      const next = { ...prev }
      const s = new Set<string>()
      if (!allSelected) HOUR_SLOTS.forEach((slot) => s.add(slot))
      next[day] = s
      return next
    })
    setDirty(true)
  }

  async function handleSave() {
    const slots = gridToSlots(available).filter((s) => dayEnabled[JAVA_TO_DAY[s.dayOfWeek] ?? 'Mon'] !== false)
    await saveAvailability({
      vacationMode,
      autoSchedulingEnabled: autoScheduling,
      timezone,
      slots,
    }).unwrap()
    setDirty(false)
    setSaveMessage('Availability saved — learners will see updated slots immediately.')
    setTimeout(() => setSaveMessage(null), 4000)
  }

  const slotCount = countSelectedSlots(available)

  if (isLoading && !data) {
    return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-violet-400" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Globe size={14} className="text-violet-400" /><p className="text-[10px] text-[#5c5d72]">Timezone</p></div>
          <select
            value={timezone}
            onChange={(e) => { setTimezone(e.target.value); setDirty(true) }}
            className="w-full mt-1 bg-[#12131a] border border-[#2d2e3e] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.id} value={tz.id}>{tz.label}</option>
            ))}
          </select>
        </div>
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-emerald-400" /><p className="text-[10px] text-[#5c5d72]">Working Hours</p></div>
          <p className="text-xs font-semibold text-white mt-1">{data?.workingHoursSummary || 'No hours set'}</p>
          <p className="text-[9px] text-[#5c5d72] mt-1">{slotCount} slots selected</p>
        </div>
        <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1"><Zap size={14} className="text-amber-400" /><p className="text-[10px] text-[#5c5d72]">Auto-Scheduling</p></div>
            <p className="text-xs text-[#8b8ca8]">Students book open slots automatically</p>
          </div>
          <button
            type="button"
            onClick={() => { setAutoScheduling(!autoScheduling); setDirty(true) }}
            className={`relative w-10 rounded-full transition-colors shrink-0 ${autoScheduling ? 'bg-emerald-500' : 'bg-[#2d2e3e]'}`}
            style={{ height: '22px' }}
          >
            <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: autoScheduling ? 'translateX(18px)' : 'translateX(0)' }} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCHEDULE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.apply)}
            className="text-left bg-[#161722] border border-[#2d2e3e] hover:border-violet-500/40 rounded-lg px-3 py-2 transition-colors"
          >
            <p className="text-[11px] font-semibold text-white">{preset.label}</p>
            <p className="text-[9px] text-[#5c5d72]">{preset.sub}</p>
          </button>
        ))}
      </div>

      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Weekly Schedule</h3>
            <p className="text-[10px] text-[#5c5d72] mt-0.5">Students can only book within highlighted slots · {timezone}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8b8ca8]">Vacation Mode</span>
              <button
                type="button"
                onClick={() => { setVacationMode(!vacationMode); setDirty(true) }}
                className={`relative w-10 rounded-full transition-colors ${vacationMode ? 'bg-amber-500' : 'bg-[#2d2e3e]'}`}
                style={{ height: '22px' }}
              >
                <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: vacationMode ? 'translateX(18px)' : 'translateX(0)' }} />
              </button>
            </div>
            {dirty && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-xs font-bold px-3 py-2 rounded-lg"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save Schedule
              </button>
            )}
          </div>
        </div>

        {vacationMode && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle size={13} className="text-amber-400" />
            <p className="text-xs text-amber-400">Vacation mode is ON — no new bookings can be made.</p>
          </div>
        )}
        {!data?.acceptingBookings && !vacationMode && slotCount === 0 && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle size={13} className="text-red-400" />
            <p className="text-xs text-red-400">Select available slots and save — students cannot book until hours are set.</p>
          </div>
        )}
        {data?.acceptingBookings && !vacationMode && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <CalendarDays size={13} className="text-emerald-400" />
            <p className="text-xs text-emerald-400">Accepting bookings · {data.workingHoursSummary}</p>
          </div>
        )}

        {saveMessage && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5 text-xs text-emerald-400">
            {saveMessage}
          </div>
        )}

        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {AVAIL_DAYS.map((day) => (
            <div key={day} className="flex items-center justify-between bg-[#12131a] border border-[#2d2e3e] rounded-lg px-3 py-2">
              <span className="text-xs font-semibold text-white">{day}</span>
              <button
                type="button"
                onClick={() => toggleDayEnabled(day)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  dayEnabled[day] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#2d2e3e] text-[#5c5d72]'
                }`}
              >
                {dayEnabled[day] ? 'Available' : 'Off'}
              </button>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-2 p-3 bg-[#12131a] border border-[#2d2e3e] rounded-lg">
          <div>
            <label className="text-[10px] text-[#5c5d72] block mb-1">Day</label>
            <select
              value={addDay}
              onChange={(e) => setAddDay(e.target.value)}
              className="bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-2 py-1.5 text-xs text-white"
            >
              {AVAIL_DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#5c5d72] block mb-1">Start</label>
            <select
              value={addStart}
              onChange={(e) => setAddStart(Number(e.target.value))}
              className="bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-2 py-1.5 text-xs text-white"
            >
              {TIME_RANGE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#5c5d72] block mb-1">End</label>
            <select
              value={addEnd}
              onChange={(e) => setAddEnd(Number(e.target.value))}
              className="bg-[#0b0c14] border border-[#2d2e3e] rounded-lg px-2 py-1.5 text-xs text-white"
            >
              {TIME_RANGE_OPTIONS.filter((t) => t.value > addStart).map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAddTimeSlot}
            disabled={vacationMode}
            className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold disabled:opacity-50"
          >
            + Add Time Slot
          </button>
        </div>

        {data?.slots && data.slots.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {slotsToSummary(data.slots).map((label) => (
              <span key={label} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-center select-none">
            <thead>
              <tr>
                <th className="pb-3 text-[10px] text-[#5c5d72] w-16">Time</th>
                {AVAIL_DAYS.map((d) => (
                  <th key={d} className="pb-3 w-12">
                    <button type="button" onClick={() => selectColumn(d)} className="text-[10px] font-bold text-[#8b8ca8] hover:text-violet-300">{d}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOUR_SLOTS.map((slot) => (
                <tr key={slot}>
                  <td className="py-0.5 pr-2 text-right">
                    <button type="button" onClick={() => selectRow(slot)} className="text-[10px] text-[#5c5d72] hover:text-white">{slot}</button>
                  </td>
                  {AVAIL_DAYS.map((day) => (
                    <td key={day} className="py-0.5 px-0.5">
                      <button
                        type="button"
                        onClick={() => toggle(day, slot)}
                        disabled={vacationMode || !dayEnabled[day]}
                        className={`w-full h-6 rounded transition-colors ${
                          available[day]?.has(slot) ? 'bg-violet-600 hover:bg-violet-500 shadow-sm shadow-violet-500/20' : 'bg-[#1c1d2a] hover:bg-[#2d2e3e]'
                        } ${vacationMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={`${day} ${slot}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <div className="flex items-center gap-4 text-[10px] text-[#5c5d72]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-600" />Available</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#1c1d2a] border border-[#2d2e3e]" />Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            {autoScheduling ? <Pill color="green">Auto-schedule ON</Pill> : <Pill color="gray">Manual only</Pill>}
            {vacationMode ? <Pill color="amber">Vacation</Pill> : data?.acceptingBookings ? <Pill color="green">Open for booking</Pill> : <Pill color="gray">Not accepting</Pill>}
          </div>
        </div>
      </div>
    </div>
  )
}
