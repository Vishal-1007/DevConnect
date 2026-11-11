import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import {
  useGetMarketplaceConfigQuery,
  useUpdateMarketplaceConfigMutation,
  useGetPaidCallHistoryQuery,
} from '../../api/walletApi'
import { formatInr } from '../../lib/money'

export function AdminMarketplacePanel() {
  const { data: config, isLoading } = useGetMarketplaceConfigQuery()
  const { data: calls } = useGetPaidCallHistoryQuery()
  const [updateConfig, { isLoading: saving }] = useUpdateMarketplaceConfigMutation()

  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [platformShare, setPlatformShare] = useState('')

  useEffect(() => {
    if (!config) return
    setMinPrice(String(config.minPricePerMinuteCents / 100))
    setMaxPrice(String(config.maxPricePerMinuteCents / 100))
    setPlatformShare(String(config.platformSharePercent))
  }, [config])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await updateConfig({
      minPricePerMinuteCents: Math.round(Number(minPrice) * 100),
      maxPricePerMinuteCents: Math.round(Number(maxPrice) * 100),
      platformSharePercent: Number(platformShare),
    })
  }

  const platformRevenue = (calls ?? []).reduce((s, c) => s + c.platformCommissionCents, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Mentor Marketplace Management</h2>
        <p className="text-sm text-[#8b8ca8]">Configure pricing limits, revenue sharing, and monitor paid calls</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4">
          <p className="text-xs text-[#8b8ca8]">Platform Revenue (calls)</p>
          <p className="text-xl font-bold text-emerald-400">{formatInr(platformRevenue)}</p>
        </div>
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4">
          <p className="text-xs text-[#8b8ca8]">Total Call Sessions</p>
          <p className="text-xl font-bold text-white">{(calls ?? []).length}</p>
        </div>
        <div className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-4">
          <p className="text-xs text-[#8b8ca8]">Active Calls</p>
          <p className="text-xl font-bold text-amber-400">
            {(calls ?? []).filter((c) => c.status === 'ACTIVE').length}
          </p>
        </div>
      </div>

      <form onSubmit={(e) => void handleSave(e)} className="rounded-xl bg-[#161722] border border-[#2d2e3e] p-5 space-y-4 max-w-lg">
        <h3 className="text-sm font-semibold text-white">Marketplace Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-[#8b8ca8]">Min price (₹/min)</span>
            <input
              type="number"
              value={minPrice || (config ? config.minPricePerMinuteCents / 100 : '')}
              onChange={(e) => setMinPrice(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#8b8ca8]">Max price (₹/min)</span>
            <input
              type="number"
              value={maxPrice || (config ? config.maxPricePerMinuteCents / 100 : '')}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-[#8b8ca8]">Platform share (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={platformShare || (config ? config.platformSharePercent : '')}
            onChange={(e) => setPlatformShare(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-white"
          />
        </label>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold dc-gradient-btn text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </form>
    </div>
  )
}
