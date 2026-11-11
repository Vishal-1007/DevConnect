import { useState, type FormEvent } from 'react'
import { Star } from 'lucide-react'
import {
  useListMentorsQuery,
  useUpsertMyMentorProfileMutation,
} from '../api/mentorApi'
import { avatarUrl } from '../lib/avatar'

export function MentorsPage() {
  const { data: mentors, isLoading } = useListMentorsQuery()
  const [upsertMentor, { isLoading: saving, isSuccess }] = useUpsertMyMentorProfileMutation()
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [available, setAvailable] = useState(true)

  async function handleMentorSubmit(e: FormEvent) {
    e.preventDefault()
    await upsertMentor({
      headline: headline || undefined,
      bio: bio || undefined,
      hourlyRateCents: hourlyRate ? Math.round(parseFloat(hourlyRate) * 100) : undefined,
      available,
    })
  }

  const inputClass =
    'w-full h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]'

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white">Mentorship</h1>
      <p className="text-sm text-[#8b8ca8] mt-1">Browse mentors or register as one</p>

      <div className="mt-6 rounded-xl bg-[#161722] border border-[#2d2e3e] p-5 mb-8">
        <h2 className="font-semibold text-white mb-4">Become a mentor</h2>
        <form onSubmit={handleMentorSubmit} className="space-y-3 max-w-md">
          <input className={inputClass} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline" />
          <textarea
            className={`${inputClass} h-20 py-2 resize-none`}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bio"
          />
          <input
            className={inputClass}
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="Hourly rate (USD)"
          />
          <label className="flex items-center gap-2 text-sm text-[#8b8ca8]">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
            Available for sessions
          </label>
          {isSuccess && <p className="text-sm text-emerald-400">Saved.</p>}
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg dc-gradient-btn text-white text-sm font-semibold">
            Save mentor profile
          </button>
        </form>
      </div>

      <h2 className="font-semibold text-white mb-4">Available mentors</h2>
      {isLoading && <p className="text-[#8b8ca8]">Loading…</p>}
      <div className="grid sm:grid-cols-2 gap-4">
        {mentors?.map((m) => (
          <div key={m.userId} className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4 flex gap-3">
            <img src={avatarUrl(m.headline ?? 'Mentor', 48)} alt="" className="w-12 h-12 rounded-full" />
            <div>
              <p className="font-semibold text-white">{m.headline ?? 'Mentor'}</p>
              <p className="text-xs text-[#8b8ca8] line-clamp-2">{m.bio ?? '—'}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-[#b4b5c8]">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                {m.averageRating.toFixed(1)} · {m.ratingCount} sessions
                {m.available && <span className="text-emerald-400 ml-2">Online</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
