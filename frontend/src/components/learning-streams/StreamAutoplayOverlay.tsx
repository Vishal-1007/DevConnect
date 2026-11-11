import { X, Play } from 'lucide-react'
import type { FlatLesson } from '../../hooks/useLessonNavigation'

interface StreamAutoplayOverlayProps {
  countdown: number
  nextLesson: FlatLesson
  onCancel: () => void
  onPlayNow: () => void
}

export function StreamAutoplayOverlay({ countdown, nextLesson, onCancel, onPlayNow }: StreamAutoplayOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-2xl border border-violet-500/30 bg-[#12131c]/90 p-6 text-center shadow-[0_0_40px_rgba(124,58,237,0.25)]">
        <p className="text-sm font-semibold text-white mb-1">Up next</p>
        <p className="text-xs text-violet-300 mb-4 truncate">{nextLesson.title}</p>
        <p className="text-lg text-white mb-5">
          Next lesson starts in <span className="font-bold text-violet-400">{countdown}</span> seconds…
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onPlayNow}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(124,58,237,0.45)]"
          >
            <Play size={14} /> Play Now
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2d2e3e] bg-[#161722]/80 px-4 py-2 text-xs font-semibold text-[#8b8ca8] transition-colors hover:border-violet-500/40 hover:text-white"
          >
            <X size={14} /> Cancel Auto Play
          </button>
        </div>
      </div>
    </div>
  )
}
