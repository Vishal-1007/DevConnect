import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Loader2, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { useMyInterviewPurchasesQuery } from '../api/interviewMarketplaceApi'

export function MyInterviewPurchasesPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useMyInterviewPurchasesQuery({ page: 0, size: 50 })
  const purchases = data?.items ?? []

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShoppingBag size={22} className="text-violet-400" /> My Purchases
        </h1>
        <p className="text-sm text-[#8b8ca8] mt-1">Your purchased and enrolled interview question packs.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-violet-400" /></div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#2d2e3e] rounded-2xl">
          <ShoppingBag className="w-10 h-10 text-[#5c5d72] mx-auto mb-3" />
          <p className="text-white font-semibold">No purchases yet</p>
          <button type="button" onClick={() => navigate('/interview-marketplace')} className="mt-4 px-4 py-2 text-sm font-bold dc-gradient-btn text-white rounded-lg">
            Browse Marketplace
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4 bg-[#161722] border border-[#2d2e3e] rounded-xl hover:border-violet-500/30 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-violet-900/30 flex items-center justify-center shrink-0">
                <ShoppingBag size={20} className="text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm truncate">{p.packTitle}</h3>
                <p className="text-xs text-[#8b8ca8]">by {p.mentorName} · {p.amountLabel}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-[#8b8ca8]">
                  <span className="flex items-center gap-1"><Clock size={10} /> Purchased {p.purchasedAtLabel}</span>
                  <span>Expires: {p.expiresAtLabel}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.expired ? (
                  <span className="flex items-center gap-1 text-[11px] text-red-400"><AlertCircle size={12} /> Expired</span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400"><CheckCircle2 size={12} /> Active</span>
                )}
                <button
                  type="button"
                  disabled={!p.hasAccess}
                  onClick={() => navigate(`/interview-marketplace/${p.questionSetId}`)}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg dc-gradient-btn text-white disabled:opacity-40"
                >
                  Open Pack
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
