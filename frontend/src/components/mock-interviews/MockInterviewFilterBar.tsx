import { Calendar, Clock, Filter, IndianRupee, Search, Star, Tag } from 'lucide-react'

export type SortOption = 'top-rated' | 'most-booked' | 'price-low' | 'price-high'

export interface MockInterviewFilters {
  search: string
  availability: '' | 'online' | 'any'
  maxPrice?: number
  minExperience?: number
  minRating?: number
  interviewType?: string
  sort: SortOption
}

interface MockInterviewFilterBarProps {
  filters: MockInterviewFilters
  onChange: (patch: Partial<MockInterviewFilters>) => void
}

const selectClass =
  'h-10 pl-9 pr-3 rounded-lg bg-[#161722] border border-[#2d2e3e] text-white text-xs focus:outline-none focus:border-[#6366f1] appearance-none min-w-[118px]'

export function MockInterviewFilterBar({ filters, onChange }: MockInterviewFilterBarProps) {
  return (
    <section className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[220px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
        <input
          className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#161722] border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]"
          placeholder="Search interviewer, skill, company…"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

        <div className="relative">
          <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#818cf8] pointer-events-none" />
          <select
            className={selectClass}
            value={filters.availability}
            onChange={(e) => onChange({ availability: e.target.value as MockInterviewFilters['availability'] })}
          >
            <option value="">Availability</option>
            <option value="online">Online now</option>
            <option value="any">Any time</option>
          </select>
        </div>

        <div className="relative">
          <IndianRupee size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#818cf8] pointer-events-none" />
          <select
            className={selectClass}
            value={filters.maxPrice ?? ''}
            onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Price</option>
            <option value="50000">Under ₹500</option>
            <option value="100000">Under ₹1,000</option>
            <option value="200000">Under ₹2,000</option>
            <option value="500000">Under ₹5,000</option>
          </select>
        </div>

        <div className="relative">
          <Clock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#818cf8] pointer-events-none" />
          <select
            className={selectClass}
            value={filters.minExperience ?? ''}
            onChange={(e) => onChange({ minExperience: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Experience</option>
            <option value="2">2+ years</option>
            <option value="5">5+ years</option>
            <option value="8">8+ years</option>
          </select>
        </div>

        <div className="relative">
          <Star size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
          <select
            className={selectClass}
            value={filters.minRating ?? ''}
            onChange={(e) => onChange({ minRating: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Rating</option>
            <option value="4">4.0+</option>
            <option value="4.5">4.5+</option>
            <option value="4.8">4.8+</option>
          </select>
        </div>

        <div className="relative">
          <Tag size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#818cf8] pointer-events-none" />
          <select
            className={selectClass}
            value={filters.interviewType ?? ''}
            onChange={(e) => onChange({ interviewType: e.target.value || undefined })}
          >
            <option value="">Interview Type</option>
            <option value="dsa">DSA</option>
            <option value="system-design">System Design</option>
            <option value="backend">Backend</option>
            <option value="frontend">Frontend</option>
            <option value="behavioral">Behavioral</option>
          </select>
        </div>

        <div className="relative">
          <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#818cf8] pointer-events-none" />
          <select
            className={selectClass}
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value as SortOption })}
          >
            <option value="top-rated">Sort: Top Rated</option>
            <option value="most-booked">Most Booked</option>
            <option value="price-low">Lowest Price</option>
            <option value="price-high">Highest Price</option>
          </select>
        </div>
    </section>
  )
}

export function parseExperienceYears(exp: string | null): number {
  if (!exp) return 0
  const m = exp.match(/(\d+)/)
  return m ? Number(m[1]) : 0
}
