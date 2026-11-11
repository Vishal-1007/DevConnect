import { Download } from 'lucide-react'
import type { PaymentRecord } from '../../../data/recruiterBillingData'

type Props = {
  records: PaymentRecord[]
  onDownload?: (invoiceId: string) => void
}

export function PaymentHistory({ records, onDownload }: Props) {
  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
      <h3 className="mb-4 text-sm font-semibold text-white">Payment History</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr className="border-b border-[#2d2e3e]/60">
              <th className="pb-3 pr-3 text-xs font-medium text-[#8b8ca8]">Invoice ID</th>
              <th className="pb-3 px-3 text-xs font-medium text-[#8b8ca8]">Date</th>
              <th className="pb-3 px-3 text-xs font-medium text-[#8b8ca8]">Plan</th>
              <th className="pb-3 px-3 text-xs font-medium text-[#8b8ca8]">Amount</th>
              <th className="pb-3 px-3 text-xs font-medium text-[#8b8ca8]">Status</th>
              <th className="pb-3 pl-3 text-xs font-medium text-[#8b8ca8]">Download</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.invoiceId} className="border-b border-[#2d2e3e]/30 last:border-0">
                <td className="py-3 pr-3 text-xs font-medium text-white">{record.invoiceId}</td>
                <td className="px-3 py-3 text-xs text-[#8b8ca8]">{record.date}</td>
                <td className="px-3 py-3 text-xs text-[#c4c5d6]">{record.plan}</td>
                <td className="px-3 py-3 text-xs font-medium text-white">{record.amount}</td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      record.status === 'Paid'
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : record.status === 'Pending'
                          ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                          : 'border border-red-500/30 bg-red-500/10 text-red-300'
                    }`}
                  >
                    {record.status}
                  </span>
                </td>
                <td className="pl-3 py-3">
                  <button
                    type="button"
                    onClick={() => onDownload?.(record.invoiceId)}
                    className="flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
                  >
                    <Download size={14} />
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
