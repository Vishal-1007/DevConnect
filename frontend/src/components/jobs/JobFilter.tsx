import { Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import {
  DEV_SCORE_OPTIONS,
  EXPERIENCE_LEVELS,
  JOB_LOCATIONS,
  JOB_ROLES,
  JOB_TYPES,
  SKILL_OPTIONS,
} from '../../data/jobsData'
import type { JobFilters } from '../../lib/jobFilterLogic'
import { MultiSelectFilter } from './MultiSelectFilter'

export type { JobFilters }

const LOCATION_OPTIONS = JOB_LOCATIONS.filter((l) => l !== 'All Locations')
const SKILL_FILTER_OPTIONS = SKILL_OPTIONS.filter((s) => s !== 'All Skills')

interface JobFilterProps {
  filters: JobFilters
  activeCount: number
  activeLabels: { id: string; label: string }[]
  onChange: (patch: Partial<JobFilters>) => void
  onSearch: () => void
  onClear: () => void
  onRemoveFilter: (id: string) => void
}

const selectClass =
  'h-10 px-3 rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1] w-full'

export function JobFilter({
  filters,
  activeCount,
  activeLabels,
  onChange,
  onSearch,
  onClear,
  onRemoveFilter,
}: JobFilterProps) {
  const hasActiveFilters = activeCount > 0

  return (
    <div className="dc-glass-card rounded-2xl p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal size={16} className="text-[#818cf8]" />
        <h2 className="text-sm font-semibold text-white">Advanced Filters</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <label className="block text-[10px] font-medium text-[#8b8ca8] mb-1.5 uppercase tracking-wide">
            Job Role
          </label>
          <select
            value={filters.role}
            onChange={(e) => onChange({ role: e.target.value })}
            className={selectClass}
          >
            {JOB_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <MultiSelectFilter
          label="Location"
          placeholder="All Locations"
          options={LOCATION_OPTIONS}
          selected={filters.locations}
          onChange={(locations) => onChange({ locations })}
        />

        <div>
          <label className="block text-[10px] font-medium text-[#8b8ca8] mb-1.5 uppercase tracking-wide">
            Experience
          </label>
          <select
            value={filters.experience}
            onChange={(e) => onChange({ experience: e.target.value })}
            className={selectClass}
          >
            {EXPERIENCE_LEVELS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-[#8b8ca8] mb-1.5 uppercase tracking-wide">
            Job Type
          </label>
          <select
            value={filters.jobType}
            onChange={(e) => onChange({ jobType: e.target.value })}
            className={selectClass}
          >
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <MultiSelectFilter
          label="Skill"
          placeholder="All Skills"
          options={SKILL_FILTER_OPTIONS}
          selected={filters.skills}
          onChange={(skills) => onChange({ skills })}
        />

        <div>
          <label className="block text-[10px] font-medium text-[#8b8ca8] mb-1.5 uppercase tracking-wide">
            Min DevScore
          </label>
          <select
            value={filters.minDevScore}
            onChange={(e) => onChange({ minDevScore: Number(e.target.value) })}
            className={selectClass}
          >
            {DEV_SCORE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {activeLabels.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#2d2e3e]/80">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8b8ca8]">
            Active:
          </span>
          {activeLabels.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onRemoveFilter(chip.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#6366f1]/15 text-[#a5b4fc] border border-[#6366f1]/30 hover:bg-[#6366f1]/25 transition-colors"
            >
              {chip.label}
              <X size={10} />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button
          type="button"
          onClick={onSearch}
          className="flex items-center gap-2 h-10 px-5 rounded-xl dc-gradient-btn text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Search size={14} />
          Search Jobs
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium text-[#8b8ca8] hover:text-white border border-[#2d2e3e] hover:border-[#6366f1]/30 transition-colors"
          >
            <X size={14} />
            Clear Filters
          </button>
        )}
        <span className="text-xs text-[#5c5d72] ml-auto flex items-center gap-1">
          <Filter size={12} />
          DevScore-powered matching
        </span>
      </div>
    </div>
  )
}
