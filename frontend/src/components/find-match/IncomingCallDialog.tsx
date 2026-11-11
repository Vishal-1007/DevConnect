import { Phone, PhoneOff, Video } from 'lucide-react'
import type { IncomingCall } from '../../hooks/useWebRTC'

interface Props {
  call: IncomingCall
  onAccept: () => void
  onReject: () => void
}

export function IncomingCallDialog({ call, onAccept, onReject }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center animate-bounce-in">
        {/* Pulsing avatar */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-lg">
            {call.fromName[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 border-2 border-[#161722] animate-pulse" />
        </div>

        <div className="flex items-center gap-2 mb-1">
          <Video size={15} className="text-violet-400" />
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Incoming Video Call</p>
        </div>
        <h2 className="text-xl font-bold text-white mb-1">{call.fromName}</h2>
        <p className="text-sm text-[#8b8ca8] mb-8">wants to start a live session with you</p>

        <div className="flex gap-4 w-full">
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white text-sm font-bold transition-all"
          >
            <PhoneOff size={18} />
            Decline
          </button>
          <button
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
