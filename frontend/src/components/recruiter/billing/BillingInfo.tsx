import { Building2, CreditCard, Mail, Receipt } from 'lucide-react'
import type { RecruiterBillingData } from '../../../data/recruiterBillingData'

type Props = {
  billingInfo: RecruiterBillingData['billingInfo']
  onUpdate?: () => void
}

export function BillingInfo({ billingInfo, onUpdate }: Props) {
  const fields = [
    { icon: Building2, label: 'Company', value: billingInfo.company },
    { icon: Mail, label: 'Billing Email', value: billingInfo.email },
    { icon: Receipt, label: 'GST Number', value: billingInfo.gstNumber },
    { icon: CreditCard, label: 'Payment Method', value: billingInfo.paymentMethod },
  ]

  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
      <h3 className="mb-4 text-sm font-semibold text-white">Billing Information</h3>
      <div className="space-y-3">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#2d2e3e]/60 bg-[#0b0c14]/40">
              <Icon size={14} className="text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] text-[#8b8ca8]">{label}</p>
              <p className="text-sm font-medium text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onUpdate}
        className="mt-4 w-full rounded-xl border border-[#2d2e3e] bg-white/5 py-2.5 text-sm font-medium text-white hover:border-violet-500/40"
      >
        Update Billing Info
      </button>
    </div>
  )
}
