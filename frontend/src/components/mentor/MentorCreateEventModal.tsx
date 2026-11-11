import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { useCreateHostedEventMutation } from '../../api/mentorEventsApi'
import { EVENT_CATEGORIES, EVENT_TYPES, PAID_PRICE_PRESETS } from '../../data/eventsData'
import { extractApiError } from '../../lib/extractApiError'

function defaultStartLocal() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(18, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}

function defaultEndLocal() {
  const d = new Date(defaultStartLocal())
  d.setHours(d.getHours() + 2)
  return d.toISOString().slice(0, 16)
}

interface MentorCreateEventModalProps {
  onClose: () => void
  onCreated: () => void
}

export function MentorCreateEventModal({ onClose, onCreated }: MentorCreateEventModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState('workshop')
  const [category, setCategory] = useState('backend')
  const [format, setFormat] = useState('online')
  const [locationOrLink, setLocationOrLink] = useState('')
  const [startsAt, setStartsAt] = useState(defaultStartLocal())
  const [endsAt, setEndsAt] = useState(defaultEndLocal())
  const [maxAttendees, setMaxAttendees] = useState('100')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [topicsCovered, setTopicsCovered] = useState('')
  const [requirements, setRequirements] = useState('')
  const [paid, setPaid] = useState(false)
  const [priceInr, setPriceInr] = useState(199)
  const [error, setError] = useState<string | null>(null)

  const [createEvent, { isLoading }] = useCreateHostedEventMutation()

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-xs focus:outline-none focus:border-violet-500'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.')
      return
    }
    try {
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        eventType,
        category,
        format,
        locationOrLink: locationOrLink.trim() || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        maxAttendees: Number(maxAttendees) || 100,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        topicsCovered: topicsCovered.trim() || undefined,
        requirements: requirements.trim() || undefined,
        paid,
        priceInr: paid ? priceInr : undefined,
      }).unwrap()
      onCreated()
      onClose()
    } catch (err) {
      setError(extractApiError(err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 overflow-y-auto">
      <div className="bg-[#161722] border border-violet-500/30 rounded-2xl w-full max-w-2xl shadow-2xl my-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#2d2e3e]">
          <div>
            <h3 className="text-sm font-bold text-white">Create Event</h3>
            <p className="text-xs text-[#8b8ca8] mt-0.5">Submitted events require admin approval before publishing</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#5c5d72] hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{error}</div>
          )}

          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" required />
          <textarea
            className={`${inputClass} resize-none min-h-[80px]`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            required
          />

          <div className="grid sm:grid-cols-3 gap-3">
            <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputClass}>
              {EVENT_TYPES.filter((t) => t.id !== 'all').map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {EVENT_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className={inputClass}>
              <option value="online">Online</option>
              <option value="in-person">Offline</option>
            </select>
          </div>

          <input
            className={inputClass}
            value={locationOrLink}
            onChange={(e) => setLocationOrLink(e.target.value)}
            placeholder="Zoom / Google Meet / DevConnect Video Room link"
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} required />
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} required />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="number"
              min={1}
              max={1000}
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              className={inputClass}
              placeholder="Max participants"
            />
            <input
              className={inputClass}
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="Thumbnail URL (optional)"
            />
          </div>

          <textarea className={`${inputClass} resize-none`} rows={2} value={topicsCovered} onChange={(e) => setTopicsCovered(e.target.value)} placeholder="Topics covered" />
          <textarea className={`${inputClass} resize-none`} rows={2} value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Requirements" />

          <div className="rounded-xl border border-[#2d2e3e] p-4 space-y-3">
            <p className="text-xs font-semibold text-white">Pricing</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs text-[#b4b5c8] cursor-pointer">
                <input type="radio" checked={!paid} onChange={() => setPaid(false)} className="accent-violet-500" />
                Free event
              </label>
              <label className="flex items-center gap-2 text-xs text-[#b4b5c8] cursor-pointer">
                <input type="radio" checked={paid} onChange={() => setPaid(true)} className="accent-violet-500" />
                Paid event
              </label>
            </div>
            {paid && (
              <div className="flex flex-wrap gap-2">
                {PAID_PRICE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriceInr(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      priceInr === p
                        ? 'bg-violet-600/30 border-violet-500/50 text-violet-200'
                        : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
                    }`}
                  >
                    ₹{p}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  value={priceInr}
                  onChange={(e) => setPriceInr(Number(e.target.value) || 99)}
                  className={`${inputClass} w-24`}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-xs text-[#8b8ca8] border border-[#2d2e3e]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg dc-gradient-btn text-white text-xs font-semibold disabled:opacity-50"
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              Submit for approval
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
