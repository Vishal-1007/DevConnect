import { useEffect, useState } from 'react'
import { AlertTriangle, PhoneOff, Wallet } from 'lucide-react'
import { useEndPaidCallMutation, useGetPaidCallQuery } from '../../api/walletApi'
import { formatDuration, formatInr } from '../../lib/money'
import { AddMoneyModal } from './AddMoneyModal'

interface CallBillingWidgetProps {
  sessionId: string
  mentorName: string
  onEnded?: () => void
}

export function CallBillingWidget({ sessionId, mentorName, onEnded }: CallBillingWidgetProps) {
  const { data: session } = useGetPaidCallQuery(sessionId, { pollingInterval: 5_000 })
  const [endCall] = useEndPaidCallMutation()
  const [elapsed, setElapsed] = useState(0)
  const [showAddMoney, setShowAddMoney] = useState(false)

  useEffect(() => {
    if (!session?.startTime) return
    const start = new Date(session.startTime).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session?.startTime])

  useEffect(() => {
    if (session?.status !== 'ACTIVE') {
      onEnded?.()
    }
  }, [session?.status, onEnded])

  if (!session) return null

  async function handleEnd() {
    await endCall(sessionId)
    onEnded?.()
  }

  return (
    <>
      <div className="rounded-xl bg-[#161722]/95 border border-[#6366f1]/40 p-4 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-[#8b8ca8]">Premium call with</p>
            <p className="text-sm font-semibold text-white">{mentorName}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {session.callType}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <p className="text-[#8b8ca8] text-xs">Call Duration</p>
            <p className="text-white font-mono font-semibold">{formatDuration(elapsed)}</p>
          </div>
          <div>
            <p className="text-[#8b8ca8] text-xs">Price / Minute</p>
            <p className="text-emerald-400 font-semibold">{formatInr(session.pricePerMinuteCents)}</p>
          </div>
          <div>
            <p className="text-[#8b8ca8] text-xs flex items-center gap-1"><Wallet className="w-3 h-3" /> Balance</p>
            <p className="text-white font-semibold">{formatInr(session.walletBalanceCents)}</p>
          </div>
          <div>
            <p className="text-[#8b8ca8] text-xs">Total Spent</p>
            <p className="text-amber-400 font-semibold">{formatInr(session.amountDeductedCents)}</p>
          </div>
        </div>

        {session.lowBalanceWarning && (
          <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              Your balance is running low
            </div>
            <p className="text-xs text-[#8b8ca8] mb-2">
              {session.lowBalanceSecondsRemaining ?? 30} seconds remaining before auto-disconnect
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddMoney(true)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold dc-gradient-btn text-white">
                Add Money
              </button>
              <button type="button" onClick={() => void handleEnd()} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-red-300 border border-red-500/30">
                End Call
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleEnd()}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-red-300 border border-red-500/30 hover:bg-red-500/10"
        >
          <PhoneOff className="w-4 h-4" /> End Call
        </button>
      </div>

      {showAddMoney && <AddMoneyModal onClose={() => setShowAddMoney(false)} />}
    </>
  )
}
