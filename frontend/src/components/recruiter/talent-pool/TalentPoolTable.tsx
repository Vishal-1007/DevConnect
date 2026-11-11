import { Eye, MessageCircle, MoreHorizontal } from 'lucide-react'
import type { SavedTalentCandidate } from '../../../data/recruiterTalentPoolData'
import {
  CandidateCell,
  DevScoreCell,
  sourceStyle,
  statusStyle,
} from './SavedCandidateCard'

type Props = {
  candidates: SavedTalentCandidate[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onView: (candidate: SavedTalentCandidate) => void
  onMessage: (candidate: SavedTalentCandidate) => void
}

export function TalentPoolTable({
  candidates,
  page,
  pageSize,
  onPageChange,
  onView,
  onMessage,
}: Props) {
  const total = candidates.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const pageItems = candidates.slice(start, start + pageSize)

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 px-6 py-14 text-center backdrop-blur-md">
        <p className="text-sm text-[#8b8ca8]">No candidates match your filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 backdrop-blur-md">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1000px] text-left">
          <thead>
            <tr className="border-b border-[#2d2e3e] text-[11px] uppercase tracking-wide text-[#8b8ca8]">
              <th className="px-4 py-3 font-medium">Candidate</th>
              <th className="px-4 py-3 font-medium">DevScore</th>
              <th className="px-4 py-3 font-medium">Skills</th>
              <th className="px-4 py-3 font-medium">Experience</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Added On</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((candidate) => {
              const visibleSkills = candidate.skills.slice(0, 4)
              const more = candidate.skills.length - visibleSkills.length
              return (
                <tr
                  key={candidate.poolId}
                  className="cursor-pointer border-b border-[#2d2e3e]/50 hover:bg-white/[0.02]"
                  onClick={() => onView(candidate)}
                >
                  <td className="px-4 py-4">
                    <CandidateCell candidate={candidate} />
                  </td>
                  <td className="px-4 py-4">
                    <DevScoreCell score={candidate.devScore} percentile={candidate.percentile} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {visibleSkills.map((s) => (
                        <span key={s} className="rounded-full border border-[#2d2e3e] bg-white/5 px-2 py-0.5 text-[10px] text-[#c4c5d6]">
                          {s}
                        </span>
                      ))}
                      {more > 0 && (
                        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-200">
                          +{more}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-white">{candidate.experience}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-white">{candidate.locationDisplay}</p>
                    <p className={`mt-0.5 flex items-center gap-1 text-[11px] ${statusStyle(candidate.status)}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {candidate.status}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-white">{candidate.addedOnDisplay}</p>
                    <p className={`text-[11px] ${sourceStyle(candidate.source)}`}>{candidate.source}</p>
                  </td>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onMessage(candidate)}
                        className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] hover:text-white"
                        title="Message"
                      >
                        <MessageCircle size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onView(candidate)}
                        className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] hover:text-white"
                        title="View profile"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onView(candidate)}
                        className="rounded-lg border border-[#2d2e3e] bg-white/5 p-2 text-[#8b8ca8] hover:text-white"
                        title="More"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[#2d2e3e]/60 px-4 py-3 text-xs text-[#8b8ca8]">
        <span>
          Showing {start + 1} to {Math.min(start + pageSize, total)} of {total} candidates
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border border-[#2d2e3e] px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`rounded-lg border px-3 py-1.5 ${
                p === page
                  ? 'border-violet-500/50 bg-violet-500/15 text-white'
                  : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-[#2d2e3e] px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
