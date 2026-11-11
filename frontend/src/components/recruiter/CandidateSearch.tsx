import { Search, SlidersHorizontal } from 'lucide-react'
import { DEFAULT_SEARCH_FILTERS } from '../../data/recruiterData'

export type CandidateFilters = {
  jobRole: string
  skills: string[]
  experience: string
  location: string
  minDevScore: number
}

type Props = {
  filters: CandidateFilters
  onChange: (filters: CandidateFilters) => void
  onSearch: () => void
  onClear: () => void
  resultCount?: number
}

const SKILL_OPTIONS = ['Java', 'Spring Boot', 'React', 'Node.js', 'AWS', 'PostgreSQL', 'TypeScript']
const EXPERIENCE_OPTIONS = ['0-2 Years', '2-5 Years', '5+ Years']
const LOCATION_OPTIONS = ['Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Remote']

export function CandidateSearch({ filters, onChange, onSearch, onClear, resultCount }: Props) {
  function toggleSkill(skill: string) {
    const next = filters.skills.includes(skill)
      ? filters.skills.filter((s) => s !== skill)
      : [...filters.skills, skill]
    onChange({ ...filters, skills: next })
  }

  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/70 p-4 backdrop-blur-md">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={16} className="text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Search Filters</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#8b8ca8]">Job Role</label>
          <input
            value={filters.jobRole}
            onChange={(e) => onChange({ ...filters, jobRole: e.target.value })}
            className="w-full rounded-lg border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#8b8ca8]">Skills</label>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_OPTIONS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                  filters.skills.includes(skill)
                    ? 'border-violet-500/50 bg-violet-500/20 text-violet-200'
                    : 'border-[#2d2e3e] bg-white/5 text-[#8b8ca8] hover:text-white'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#8b8ca8]">Experience</label>
            <select
              value={filters.experience}
              onChange={(e) => onChange({ ...filters, experience: e.target.value })}
              className="w-full rounded-lg border border-[#2d2e3e] bg-[#0b0c14] px-2 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            >
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#8b8ca8]">Location</label>
            <select
              value={filters.location}
              onChange={(e) => onChange({ ...filters, location: e.target.value })}
              className="w-full rounded-lg border border-[#2d2e3e] bg-[#0b0c14] px-2 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            >
              {LOCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[11px] font-medium text-[#8b8ca8]">Minimum DevScore</label>
            <span className="text-xs font-semibold text-violet-300">{filters.minDevScore}+</span>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            step={50}
            value={filters.minDevScore}
            onChange={(e) => onChange({ ...filters, minDevScore: Number(e.target.value) })}
            className="w-full accent-violet-500"
          />
          <div className="mt-0.5 flex justify-between text-[10px] text-[#5c5d72]">
            <span>0</span>
            <span>1000</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSearch}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <Search size={15} />
          Search Candidates
          {resultCount !== undefined && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
              {resultCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            onChange(DEFAULT_SEARCH_FILTERS)
            onClear()
          }}
          className="w-full text-center text-xs text-[#8b8ca8] hover:text-violet-300"
        >
          Clear Filters
        </button>
      </div>
    </div>
  )
}
