import { Search } from 'lucide-react'
import { INTERVIEW_TYPE_OPTIONS } from '../../../data/recruiterInterviewData'
import type { InterviewFilterState } from '../../../lib/recruiterInterviewStore'

type Props = {
  filters: InterviewFilterState
  jobOptions: string[]
  onChange: (filters: InterviewFilterState) => void
  onClear: () => void
}

export function InterviewFilters({ filters, jobOptions, onChange, onClear }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-4 backdrop-blur-md">
      <div className="relative min-w-[200px] flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8ca8]" />
        <input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search by candidate name, job role..."
          className="w-full rounded-xl border border-[#2d2e3e] bg-[#0b0c14] py-2.5 pl-9 pr-3 text-sm text-white focus:border-violet-500 focus:outline-none"
        />
      </div>

      <select
        value={filters.job}
        onChange={(e) => onChange({ ...filters, job: e.target.value })}
        className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
      >
        <option value="all">All Jobs</option>
        {jobOptions.map((job) => (
          <option key={job} value={job}>{job}</option>
        ))}
      </select>

      <select
        value={filters.interviewType}
        onChange={(e) => onChange({ ...filters, interviewType: e.target.value })}
        className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
      >
        <option value="all">All Interview Types</option>
        {INTERVIEW_TYPE_OPTIONS.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
      >
        <option value="all">All Status</option>
        <option value="Upcoming">Upcoming</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>

      <button
        type="button"
        onClick={onClear}
        className="text-sm text-[#8b8ca8] hover:text-violet-300"
      >
        Clear Filters
      </button>

      <select
        value={filters.sortBy}
        onChange={(e) => onChange({ ...filters, sortBy: e.target.value as InterviewFilterState['sortBy'] })}
        className="ml-auto rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
      >
        <option value="upcoming">Sort by: Upcoming</option>
        <option value="recent">Sort by: Recent</option>
        <option value="devscore">Sort by: DevScore</option>
      </select>
    </div>
  )
}
