import { X, CheckCircle2, AlertTriangle, Eye } from 'lucide-react'
import { avatarUrl } from '../../lib/avatar'
import type { DevScoreMetrics, RecruiterMatchPreview } from '../../data/candidateProfileData'

type Props = {
  name: string
  title: string
  photoUrl: string | null
  devScore: DevScoreMetrics
  preview: RecruiterMatchPreview
  onClose: () => void
}

export function RecruiterPreview({ name, title, photoUrl, devScore, preview, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#2d2e3e] bg-[#161722] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[#2d2e3e] bg-[#161722]/95 px-5 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-violet-400" />
            <div>
              <h2 className="text-base font-bold text-white">Recruiter View Preview</h2>
              <p className="text-[11px] text-[#8b8ca8]">How hiring managers see your profile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8b8ca8] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <img
              src={photoUrl ?? avatarUrl(name, 56)}
              alt=""
              className="h-14 w-14 rounded-xl object-cover ring-2 ring-violet-500/30"
            />
            <div>
              <p className="text-lg font-bold text-white">{name}</p>
              <p className="text-sm text-violet-300">{title}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-3 text-center">
              <p className="text-[10px] uppercase text-[#8b8ca8]">Hiring Match</p>
              <p className="text-3xl font-bold text-violet-200">{preview.hiringMatch}%</p>
            </div>
            <div className="rounded-xl border border-[#2d2e3e] bg-white/5 p-3 text-center">
              <p className="text-[10px] uppercase text-[#8b8ca8]">DevScore</p>
              <p className="text-3xl font-bold text-white">{devScore.devScore}</p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Strong Areas
            </p>
            <ul className="space-y-1.5">
              {preview.strongAreas.map((area) => (
                <li key={area} className="flex items-center gap-2 text-sm text-white">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  {area}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
              Needs Improvement
            </p>
            <ul className="space-y-1.5">
              {preview.needsImprovement.map((area) => (
                <li key={area} className="flex items-center gap-2 text-sm text-[#c4c5d6]">
                  <AlertTriangle size={14} className="text-amber-400" />
                  {area}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-[#2d2e3e] bg-[#0b0c14]/60 p-2">
              <p className="text-[9px] text-[#8b8ca8]">AI Interview</p>
              <p className="text-sm font-bold text-white">{devScore.aiInterviewScore}%</p>
            </div>
            <div className="rounded-lg border border-[#2d2e3e] bg-[#0b0c14]/60 p-2">
              <p className="text-[9px] text-[#8b8ca8]">Coding</p>
              <p className="text-sm font-bold text-white">{devScore.codingScore}</p>
            </div>
            <div className="rounded-lg border border-[#2d2e3e] bg-[#0b0c14]/60 p-2">
              <p className="text-[9px] text-[#8b8ca8]">Mentor</p>
              <p className="text-sm font-bold text-white">{devScore.mentorRating}/5</p>
            </div>
          </div>

          <p className="text-center text-[11px] text-[#5c5d72]">
            Recruiters discover you via DevScore, verified skills, and AI match ranking.
          </p>
        </div>
      </div>
    </div>
  )
}
