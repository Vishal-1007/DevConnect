import { Calendar, FileText, Star, XCircle } from 'lucide-react'
import type { RecruiterApplication } from '../../data/recruiterData'

type Props = {
  applications: RecruiterApplication[]
  onChange: (applications: RecruiterApplication[]) => void
  statusFilter?: 'all' | 'Applied' | 'Shortlisted' | 'Interview' | 'Rejected'
}

export function RecruiterApplications({ applications, onChange, statusFilter = 'all' }: Props) {
  const filtered =
    statusFilter === 'all'
      ? applications
      : applications.filter((a) => a.status === statusFilter)

  function updateStatus(id: string, status: RecruiterApplication['status']) {
    onChange(applications.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  const filterLabel =
    statusFilter === 'all' ? 'All applications' :
    statusFilter === 'Shortlisted' ? 'Shortlisted candidates' :
    statusFilter === 'Interview' ? 'Interview stage' :
    `${statusFilter} applications`

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Applications</h2>
        <p className="text-sm text-[#8b8ca8]">
          {filterLabel} · {filtered.length} of {applications.length} total
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 backdrop-blur-md">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[#8b8ca8]">
            No applications match this filter.
          </p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2d2e3e] text-[11px] uppercase tracking-wide text-[#8b8ca8]">
                <th className="px-4 py-3 font-medium">Applicant</th>
                <th className="px-4 py-3 font-medium">DevScore</th>
                <th className="px-4 py-3 font-medium">Match %</th>
                <th className="px-4 py-3 font-medium">Resume</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id} className="border-b border-[#2d2e3e]/50 hover:bg-white/[0.02]">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-white">{app.candidateName}</p>
                    <p className="text-xs text-[#8b8ca8]">{app.jobTitle}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-lg border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-sm font-bold text-violet-200">
                      {app.devScore}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-emerald-400">{app.matchPercent}%</td>
                  <td className="px-4 py-4">
                    <a href={app.resumeUrl} className="flex items-center gap-1 text-xs text-violet-300 hover:underline">
                      <FileText size={13} />
                      View
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      app.status === 'Shortlisted'
                        ? 'border-violet-500/30 bg-violet-500/15 text-violet-200'
                        : app.status === 'Rejected'
                          ? 'border-red-500/30 bg-red-500/10 text-red-300'
                          : app.status === 'Interview'
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                            : 'border-[#2d2e3e] bg-white/5 text-[#c4c5d6]'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateStatus(app.id, 'Shortlisted')}
                        className="flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-200 hover:bg-violet-500/20"
                      >
                        <Star size={12} />
                        Shortlist
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(app.id, 'Rejected')}
                        className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/20"
                      >
                        <XCircle size={12} />
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(app.id, 'Interview')}
                        className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300 hover:bg-amber-500/20"
                      >
                        <Calendar size={12} />
                        Interview
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
