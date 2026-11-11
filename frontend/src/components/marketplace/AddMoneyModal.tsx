import { useState } from 'react'
import { Loader2, Wallet, X } from 'lucide-react'
import { useAddWalletMoneyMutation } from '../../api/walletApi'
import { formatInr } from '../../lib/money'

interface AddMoneyModalProps {
  onClose: () => void
  onSuccess?: () => void
  title?: string
}

const QUICK_AMOUNTS = [50_000, 100_000, 200_000]

export function AddMoneyModal({ onClose, onSuccess, title = 'Insufficient wallet balance' }: AddMoneyModalProps) {
  const [addMoney, { isLoading }] = useAddWalletMoneyMutation()
  const [custom, setCustom] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function recharge(amountCents: number) {
    setError(null)
    try {
      await addMoney({ amountCents }).unwrap()
      onSuccess?.()
      onClose()
    } catch {
      setError('Could not add money. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#161722] border border-[#2d2e3e] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#6366f1]" />
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[#8b8ca8] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[#8b8ca8] mb-4">Add money to your wallet to start premium mentor calls.</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {QUICK_AMOUNTS.map((cents) => (
            <button
              key={cents}
              type="button"
              disabled={isLoading}
              onClick={() => void recharge(cents)}
              className="py-2.5 rounded-xl text-sm font-semibold dc-gradient-btn text-white disabled:opacity-50"
            >
              +{formatInr(cents)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-3">
          <input
            type="number"
            min={100}
            placeholder="Custom amount (₹)"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="flex-1 h-10 px-3 rounded-lg bg-[#0b0c14] border border-[#2d2e3e] text-sm text-white"
          />
          <button
            type="button"
            disabled={isLoading || !custom}
            onClick={() => void recharge(Math.round(Number(custom) * 100))}
            className="px-4 rounded-lg text-sm font-semibold bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/40 disabled:opacity-40"
          >
            Add
          </button>
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[#8b8ca8]">
            <Loader2 className="w-4 h-4 animate-spin" /> Processing…
          </div>
        )}
      </div>
    </div>
  )
}
