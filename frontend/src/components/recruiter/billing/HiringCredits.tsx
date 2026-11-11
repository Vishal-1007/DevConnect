import { Coins } from 'lucide-react'
import type { RecruiterBillingData } from '../../../data/recruiterBillingData'

type Props = {
  credits: RecruiterBillingData['credits']
  onBuyCredits?: (amount: number) => void
}

export function HiringCredits({ credits, onBuyCredits }: Props) {
  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2">
        <Coins size={16} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Hiring Credits</h3>
      </div>

      <p className="text-2xl font-bold text-white">{credits.available} Credits</p>
      <p className="mt-1 text-xs text-[#8b8ca8]">Available</p>

      <ul className="mt-4 space-y-1.5">
        {credits.uses.map((use) => (
          <li key={use} className="text-xs text-[#8b8ca8]">
            • {use}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onBuyCredits?.(500)}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        Buy More Credits
      </button>

      <div className="mt-4 space-y-2 border-t border-[#2d2e3e]/60 pt-4">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[#8b8ca8]">
          Credit Packages
        </p>
        {credits.packages.map((pkg) => (
          <button
            key={pkg.credits}
            type="button"
            onClick={() => onBuyCredits?.(pkg.credits)}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition hover:border-violet-500/40 ${
              pkg.popular
                ? 'border-violet-500/40 bg-violet-500/10'
                : 'border-[#2d2e3e]/60 bg-[#0b0c14]/40'
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-white">{pkg.credits} Credits</p>
              {pkg.label && (
                <p className="text-[10px] text-violet-300">{pkg.label}</p>
              )}
            </div>
            <span className="text-sm font-bold text-white">₹{pkg.price.toLocaleString('en-IN')}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
