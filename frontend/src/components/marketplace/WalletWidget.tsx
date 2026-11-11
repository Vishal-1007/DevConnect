import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { useGetWalletQuery } from '../../api/walletApi'
import { formatInr } from '../../lib/money'
import { AddMoneyModal } from './AddMoneyModal'

export function WalletWidget() {
  const { data: wallet, isLoading } = useGetWalletQuery(undefined, { pollingInterval: 30_000 })
  const [showAddMoney, setShowAddMoney] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShowAddMoney(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161722] border border-[#2d2e3e] hover:border-[#6366f1]/40 transition-colors"
        title="Wallet balance"
      >
        <Wallet className="w-4 h-4 text-emerald-400" />
        <span className="text-xs text-[#8b8ca8]">Wallet</span>
        <span className="text-sm font-semibold text-emerald-400">
          {isLoading ? '…' : formatInr(wallet?.balanceCents ?? 0)}
        </span>
      </button>

      {showAddMoney && (
        <AddMoneyModal
          title="Add Money to Wallet"
          onClose={() => setShowAddMoney(false)}
        />
      )}
    </>
  )
}
