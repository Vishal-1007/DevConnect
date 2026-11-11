import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import {
  useGetMyMentorPricingQuery,
  useUpsertMyMentorPricingMutation,
} from '../../api/marketplaceApi'
import { useGetMentorCallEarningsQuery } from '../../api/walletApi'
import { formatInr } from '../../lib/money'
import { RevenueBreakdownCard } from './RevenueBreakdownCard'

export function MentorPricingPanel() {
  const { data: pricing, isLoading } = useGetMyMentorPricingQuery()
  const { data: calls } = useGetMentorCallEarningsQuery()
  const [save, { isLoading: saving }] = useUpsertMyMentorPricingMutation()

  const [audio, setAudio] = useState('')
  const [video, setVideo] = useState('')
  const [designation, setDesignation] = useState('')
  const [company, setCompany] = useState('')
  const [tags, setTags] = useState('')
  const [instant, setInstant] = useState(true)

  useEffect(() => {
    if (!pricing) return
    setAudio(String(pricing.audioPricePerMinuteCents / 100))
    setVideo(String(pricing.videoPricePerMinuteCents / 100))
    setDesignation(pricing.designation ?? '')
    setCompany(pricing.company ?? '')
    setTags(pricing.expertiseTags ?? '')
    setInstant(pricing.instantCallEnabled)
  }, [pricing])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    )
  }

  const totalRevenue = (calls ?? []).reduce((sum, c) => sum + c.amountDeductedCents, 0)
  const mentorEarnings = (calls ?? []).reduce((sum, c) => sum + c.mentorEarningCents, 0)
  const platformShare = (calls ?? []).reduce((sum, c) => sum + c.platformCommissionCents, 0)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await save({
      audioPricePerMinuteCents: Math.round(Number(audio) * 100),
      videoPricePerMinuteCents: Math.round(Number(video) * 100),
      instantCallEnabled: instant,
      designation,
      company,
      expertiseTags: tags,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Pricing & Earnings</h2>
        <p className="text-sm text-[#8b8ca8]">Set per-minute rates for premium marketplace calls</p>
      </div>

      <RevenueBreakdownCard
        totalRevenueCents={totalRevenue}
        platformShareCents={platformShare}
        mentorEarningsCents={mentorEarnings}
        completedCalls={(calls ?? []).filter((c) => c.status === 'ENDED').length}
      />

      <form onSubmit={(e) => void handleSave(e)} className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5 space-y-4 max-w-xl">
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-[#8b8ca8]">Audio rate (₹/min)</span>
            <input
              type="number"
              min={5}
              value={audio || (pricing ? pricing.audioPricePerMinuteCents / 100 : '')}
              onChange={(e) => setAudio(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#8b8ca8]">Video rate (₹/min)</span>
            <input
              type="number"
              min={5}
              value={video || (pricing ? pricing.videoPricePerMinuteCents / 100 : '')}
              onChange={(e) => setVideo(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-[#8b8ca8]">Designation</span>
          <input value={designation || pricing?.designation || ''} onChange={(e) => setDesignation(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white" />
        </label>

        <label className="block text-sm">
          <span className="text-[#8b8ca8]">Company</span>
          <input value={company || pricing?.company || ''} onChange={(e) => setCompany(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white" />
        </label>

        <label className="block text-sm">
          <span className="text-[#8b8ca8]">Expertise tags (comma-separated)</span>
          <input value={tags || pricing?.expertiseTags || ''} onChange={(e) => setTags(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white" />
        </label>

        <label className="flex items-center gap-2 text-sm text-white">
          <input type="checkbox" checked={instant} onChange={(e) => setInstant(e.target.checked)} />
          Enable instant paid calls
        </label>

        <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold dc-gradient-btn text-white disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Pricing
        </button>
      </form>

      {(calls ?? []).length > 0 && (
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Call History</h3>
          <div className="space-y-2">
            {(calls ?? []).slice(0, 10).map((call) => (
              <div key={call.id} className="flex items-center justify-between text-sm py-2 border-b border-[#2d2e3e] last:border-0">
                <span className="text-[#8b8ca8]">{call.callType} · {call.status}</span>
                <span className="text-emerald-400 font-medium">{formatInr(call.mentorEarningCents)} earned</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
