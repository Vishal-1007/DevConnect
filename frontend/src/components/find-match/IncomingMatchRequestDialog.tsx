import { Phone, PhoneOff, Users } from 'lucide-react'

interface Props {
  fromName: string
  criteria?: string | null
  onAccept: () => void
  onReject: () => void
}

export function IncomingMatchRequestDialog({ fromName, criteria, onAccept, onReject }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-lg">
            {fromName[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-[#161722] animate-pulse" />
        </div>

        <div className="flex items-center gap-2 mb-1">
          <Users size={15} className="text-violet-400" />
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Incoming Session Request</p>
        </div>
        <h2 className="text-xl font-bold text-white mb-1">{fromName}</h2>
        <p className="text-sm text-[#8b8ca8] mb-2">wants to connect for a live mentorship session</p>
        {criteria && (
          <p className="text-xs text-[#5c5d72] mb-6 line-clamp-2">{criteria}</p>
        )}

        <div className="flex gap-4 w-full mt-4">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white text-sm font-bold transition-all"
          >
            <PhoneOff size={18} />
            Reject
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-600/25"
          >
            <Phone size={18} />
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
