import { Check, X } from 'lucide-react'
import type { FeatureComparisonRow } from '../../../data/recruiterBillingData'

type Props = {
  rows: FeatureComparisonRow[]
}

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check size={16} className="mx-auto text-emerald-400" />
    ) : (
      <X size={16} className="mx-auto text-red-400/60" />
    )
  }
  return <span className="text-xs text-[#c4c5d6]">{value}</span>
}

export function FeatureComparison({ rows }: Props) {
  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
      <h3 className="mb-4 text-sm font-semibold text-white">Feature Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left">
          <thead>
            <tr className="border-b border-[#2d2e3e]/60">
              <th className="pb-3 pr-4 text-xs font-medium text-[#8b8ca8]">Feature</th>
              <th className="pb-3 px-3 text-center text-xs font-medium text-[#8b8ca8]">Free</th>
              <th className="pb-3 px-3 text-center text-xs font-medium text-violet-300">Pro</th>
              <th className="pb-3 pl-3 text-center text-xs font-medium text-[#8b8ca8]">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-b border-[#2d2e3e]/30 last:border-0">
                <td className="py-3 pr-4 text-xs font-medium text-white">{row.feature}</td>
                <td className="px-3 py-3 text-center">
                  <CellValue value={row.free} />
                </td>
                <td className="px-3 py-3 text-center">
                  <CellValue value={row.pro} />
                </td>
                <td className="pl-3 py-3 text-center">
                  <CellValue value={row.enterprise} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
