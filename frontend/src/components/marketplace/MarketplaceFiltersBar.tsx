import { Search } from 'lucide-react'
import {
  DEFAULT_FILTERS,
  EXPERIENCE_FILTERS,
  RATING_FILTERS,
  SKILL_FILTERS,
  type MarketplaceFilters,
  type SortOption,
} from './marketplaceUtils'

interface Props {
  filters: MarketplaceFilters
  onChange: (filters: MarketplaceFilters) => void
}

export function MarketplaceFiltersBar({ filters, onChange }: Props) {
  function patch(partial: Partial<MarketplaceFilters>) {
    onChange({ ...filters, ...partial })
  }

  function toggleSkill(skill: string) {
    const skills = filters.skills.includes(skill)
      ? filters.skills.filter((s) => s !== skill)
      : [...filters.skills, skill]
    patch({ skills })
  }

  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#12131c]/60 backdrop-blur-xl p-4 mb-5 space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c5d72]" />
          <input
            value={filters.search}
            onChange={(e) => patch({ search: e.target.value })}
            placeholder="Search mentors by name, skill, company…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0b0c14] border border-[#2d2e3e] text-sm text-white placeholder-[#5c5d72] focus:outline-none focus:border-[#6366f1]/50"
          />
        </div>
        <select
          value={filters.sort}
          onChange={(e) => patch({ sort: e.target.value as SortOption })}
          className="px-3 py-2 rounded-xl bg-[#0b0c14] border border-[#2d2e3e] text-sm text-white"
        >
          <option value="top_rated">Top Rated</option>
          <option value="most_popular">Most Popular</option>
          <option value="most_sessions">Most Sessions</option>
          <option value="lowest_price">Lowest Price</option>
          <option value="highest_price">Highest Price</option>
          <option value="recently_active">Recently Active</option>
        </select>
        {(filters.search || filters.skills.length || filters.minExperience || filters.minRating || filters.availability !== 'all' || filters.priceRange !== 'all') && (
          <button type="button" onClick={() => onChange(DEFAULT_FILTERS)} className="text-xs text-[#818cf8] hover:text-white px-2">
            Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] text-[#5c5d72] uppercase tracking-wide self-center mr-1">Skills</span>
        {SKILL_FILTERS.map((skill) => (
          <button
            key={skill}
            type="button"
            onClick={() => toggleSkill(skill)}
            className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
              filters.skills.includes(skill)
                ? 'bg-[#6366f1]/20 text-[#c7d2fe] border-[#6366f1]/40'
                : 'bg-[#0b0c14] text-[#8b8ca8] border-[#2d2e3e] hover:border-[#6366f1]/30'
            }`}
          >
            {skill}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-[#5c5d72] uppercase">Experience</span>
          {EXPERIENCE_FILTERS.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => patch({ minExperience: filters.minExperience === y ? null : y })}
              className={`px-2 py-0.5 rounded-lg border ${filters.minExperience === y ? 'border-[#6366f1]/40 bg-[#6366f1]/15 text-[#c7d2fe]' : 'border-[#2d2e3e] text-[#8b8ca8]'}`}
            >
              {y}+ Years
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-[#5c5d72] uppercase">Rating</span>
          {RATING_FILTERS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => patch({ minRating: filters.minRating === r ? null : r })}
              className={`px-2 py-0.5 rounded-lg border ${filters.minRating === r ? 'border-amber-500/40 bg-amber-500/15 text-amber-300' : 'border-[#2d2e3e] text-[#8b8ca8]'}`}
            >
              {r}+
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-[#5c5d72] uppercase">Availability</span>
          {[
            ['all', 'All'],
            ['online', 'Online Now'],
            ['instant', 'Instant Call'],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => patch({ availability: val as MarketplaceFilters['availability'] })}
              className={`px-2 py-0.5 rounded-lg border ${filters.availability === val ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' : 'border-[#2d2e3e] text-[#8b8ca8]'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-[#5c5d72] uppercase">Price</span>
          {[
            ['all', 'All'],
            ['10-20', '₹10–20'],
            ['20-50', '₹20–50'],
            ['50+', '₹50+'],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => patch({ priceRange: val as MarketplaceFilters['priceRange'] })}
              className={`px-2 py-0.5 rounded-lg border ${filters.priceRange === val ? 'border-[#6366f1]/40 bg-[#6366f1]/15 text-[#c7d2fe]' : 'border-[#2d2e3e] text-[#8b8ca8]'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
