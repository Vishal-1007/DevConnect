import { Upload, UserPlus } from 'lucide-react'

type Props = {
  onImport: () => void
  onAdd: () => void
  variant?: 'header' | 'quick'
}

export function TalentActions({ onImport, onAdd, variant = 'header' }: Props) {
  if (variant === 'quick') {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-start gap-3 rounded-xl border border-[#2d2e3e]/60 bg-white/[0.02] p-3 text-left transition hover:border-violet-500/30 hover:bg-violet-500/5"
        >
          <div className="rounded-lg border border-violet-500/25 bg-violet-500/10 p-2">
            <UserPlus size={14} className="text-violet-300" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Add Candidate Manually</p>
            <p className="text-[10px] text-[#8b8ca8]">Save a verified developer to your pool</p>
          </div>
        </button>
        <button
          type="button"
          onClick={onImport}
          className="flex w-full items-start gap-3 rounded-xl border border-[#2d2e3e]/60 bg-white/[0.02] p-3 text-left transition hover:border-violet-500/30 hover:bg-violet-500/5"
        >
          <div className="rounded-lg border border-violet-500/25 bg-violet-500/10 p-2">
            <Upload size={14} className="text-violet-300" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Import Candidates</p>
            <p className="text-[10px] text-[#8b8ca8]">Upload CSV or Resume</p>
          </div>
        </button>
        <button
          type="button"
          className="flex w-full items-start gap-3 rounded-xl border border-[#2d2e3e]/60 bg-white/[0.02] p-3 text-left transition hover:border-violet-500/30 hover:bg-violet-500/5"
        >
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-2">
            <span className="text-xs text-amber-300">🔔</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Create Talent Alert</p>
            <p className="text-[10px] text-[#8b8ca8]">Get notified about matching profiles</p>
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onImport}
        className="flex items-center gap-2 rounded-xl border border-[#2d2e3e] bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:border-violet-500/40"
      >
        <Upload size={16} />
        Import Candidates
      </button>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        <UserPlus size={16} />
        Add Candidate
      </button>
    </div>
  )
}
