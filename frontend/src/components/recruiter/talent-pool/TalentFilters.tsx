import { Search, SlidersHorizontal } from 'lucide-react'
import {
  DEVSCORE_FILTER_OPTIONS,
  EXPERIENCE_FILTER_OPTIONS,
  LOCATION_FILTER_OPTIONS,
  SKILL_FILTER_OPTIONS,
} from '../../../data/recruiterTalentPoolData'
import type { TalentFilterState } from '../../../lib/recruiterTalentPoolStore'

type Props = {
  filters: TalentFilterState
  onChange: (filters: TalentFilterState) => void
  onMoreFilters?: () => void
}

export function TalentFilters({ filters, onChange, onMoreFilters }: Props) {
  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-4 backdrop-blur-md">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8ca8]" />
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by name, skills, role, location..."
            className="w-full rounded-xl border border-[#2d2e3e] bg-[#0b0c14] py-2.5 pl-9 pr-3 text-sm text-white focus:border-violet-500 focus:outline-none"
          />
        </div>

        <select
          value={filters.skill}
          onChange={(e) => onChange({ ...filters, skill: e.target.value })}
          className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
        >
          {SKILL_FILTER_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        <select
          value={filters.experience}
          onChange={(e) => onChange({ ...filters, experience: e.target.value })}
          className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
        >
          {EXPERIENCE_FILTER_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        <select
          value={filters.location}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
          className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
        >
          {LOCATION_FILTER_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        <select
          value={filters.minDevScore}
          onChange={(e) => onChange({ ...filters, minDevScore: Number(e.target.value) })}
          className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
        >
          {DEVSCORE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={onMoreFilters}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#2d2e3e] bg-white/5 px-4 py-2.5 text-sm text-[#c4c5d6] hover:text-white"
        >
          <SlidersHorizontal size={15} />
          Filters
        </button>
      </div>
    </div>
  )
}
