import { useMemo, useState } from 'react'
import {
  Bell,
  Bookmark,
  Briefcase,
  ChevronDown,
  Search,
  Sparkles,
} from 'lucide-react'
import {
  DUMMY_JOBS,
  USER_DEV_SCORE,
  type JobListing,
  type JobTab,
} from '../../data/jobsData'
import {
  countActiveFilters,
  describeActiveFilters,
  matchesFilters,
  type JobFilters,
} from '../../lib/jobFilterLogic'
import { JobCard } from './JobCard'
import { JobDetails } from './JobDetails'
import { JobFilter } from './JobFilter'
import { RecommendedJobs } from './RecommendedJobs'
import { ApplicationStatus } from './ApplicationStatus'
import { RecruiterVisibility } from './RecruiterVisibility'
import { avatarUrl } from '../../lib/avatar'

const INITIAL_FILTERS: JobFilters = {
  search: '',
  role: 'All Roles',
  locations: [],
  experience: 'All Experience',
  jobType: 'All Types',
  skills: [],
  minDevScore: 0,
}

const TABS: { id: JobTab; label: string }[] = [
  { id: 'all', label: 'All Jobs' },
  { id: 'recommended', label: 'Recommended For You' },
  { id: 'remote', label: 'Remote' },
  { id: 'internship', label: 'Internship' },
]

function matchesTab(job: JobListing, tab: JobTab): boolean {
  if (tab === 'recommended') return job.recommended
  if (tab === 'remote') return job.remote || job.location === 'Remote'
  if (tab === 'internship') return job.internship
  return true
}

function sortJobs(list: JobListing[], sortBy: 'relevant' | 'match' | 'recent') {
  if (sortBy === 'match') {
    return [...list].sort((a, b) => b.matchPercent - a.matchPercent)
  }
  if (sortBy === 'recent') {
    const order = ['2h ago', '3h ago', '5h ago', '6h ago', '1d ago', '2d ago', '3d ago', '4d ago']
    return [...list].sort((a, b) => order.indexOf(a.postedAt) - order.indexOf(b.postedAt))
  }
  return [...list].sort((a, b) => b.matchPercent - a.matchPercent)
}

export function JobPortal() {
  const [filters, setFilters] = useState<JobFilters>(INITIAL_FILTERS)
  const [headerSearch, setHeaderSearch] = useState('')
  const [tab, setTab] = useState<JobTab>('all')
  const [sortBy, setSortBy] = useState<'relevant' | 'match' | 'recent'>('relevant')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(['job-1', 'job-6']))
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const activeFilterCount = countActiveFilters(filters)
  const activeFilterLabels = describeActiveFilters(filters)

  const baseFiltered = useMemo(
    () => DUMMY_JOBS.filter((job) => matchesFilters(job, filters)),
    [filters],
  )

  const filteredJobs = useMemo(
    () => sortJobs(baseFiltered.filter((job) => matchesTab(job, tab)), sortBy),
    [baseFiltered, tab, sortBy],
  )

  const tabCounts = useMemo(() => ({
    all: baseFiltered.length,
    recommended: baseFiltered.filter((j) => j.recommended).length,
    remote: baseFiltered.filter((j) => j.remote || j.location === 'Remote').length,
    internship: baseFiltered.filter((j) => j.internship).length,
  }), [baseFiltered])

  const recommendedJobs = useMemo(
    () => baseFiltered.filter((j) => j.recommended).sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 4),
    [baseFiltered],
  )

  const savedJobs = useMemo(
    () => DUMMY_JOBS.filter((j) => savedIds.has(j.id)),
    [savedIds],
  )

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function applyFilterChange(patch: Partial<JobFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  function handleHeaderSearch(e?: React.FormEvent) {
    e?.preventDefault()
    setFilters((prev) => ({ ...prev, search: headerSearch.trim() }))
  }

  function handleClear() {
    setFilters(INITIAL_FILTERS)
    setHeaderSearch('')
  }

  function handleRemoveFilter(id: string) {
    setFilters((prev) => {
      const next = { ...prev }
      if (id.startsWith('location:')) {
        const loc = id.slice('location:'.length)
        next.locations = prev.locations.filter((l) => l !== loc)
        return next
      }
      if (id.startsWith('skill:')) {
        const skill = id.slice('skill:'.length)
        next.skills = prev.skills.filter((s) => s !== skill)
        return next
      }
      switch (id) {
        case 'search':
          next.search = ''
          setHeaderSearch('')
          break
        case 'role':
          next.role = 'All Roles'
          break
        case 'experience':
          next.experience = 'All Experience'
          break
        case 'jobType':
          next.jobType = 'All Types'
          break
        case 'minDevScore':
          next.minDevScore = 0
          break
        default:
          break
      }
      return next
    })
  }

  function toggleSave(jobId: string) {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  function handleApply(job: JobListing) {
    showToast(`Application submitted for ${job.title} at ${job.company}!`)
    setSelectedJob(null)
  }

  return (
    <div className="max-w-[1400px] mx-auto -m-6 p-4 md:p-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm px-4 py-3 rounded-xl text-sm font-medium shadow-lg border bg-emerald-600/20 border-emerald-500/40 text-emerald-300">
          {toast}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#6366f1]/20 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-[#818cf8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Job Portal</h1>
            <p className="text-sm text-[#8b8ca8] mt-1 max-w-xl">
              Discover opportunities matched with your skills and DevConnect score
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                DevScore {USER_DEV_SCORE}
              </span>
              <span className="text-[10px] text-[#5c5d72]">AI-powered job matching active</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#6366f1]/40 text-[#a5b4fc] text-sm font-semibold hover:bg-[#6366f1]/10 transition-colors"
          >
            <Bookmark size={14} />
            Saved Searches
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl dc-gradient-btn text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Bell size={14} />
            Create Job Alert
          </button>
        </div>
      </div>

      <form onSubmit={handleHeaderSearch} className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
          <input
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            placeholder="Search jobs, companies, skills..."
            className="w-full h-11 pl-9 pr-3 rounded-xl bg-[#0b0c14]/80 border border-[#2d2e3e] text-white text-sm focus:outline-none focus:border-[#6366f1]"
          />
        </div>
        <button
          type="submit"
          className="h-11 px-6 rounded-xl dc-gradient-btn text-white text-sm font-semibold shrink-0"
        >
          Search
        </button>
      </form>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-5">
          <JobFilter
            filters={filters}
            activeCount={activeFilterCount}
            activeLabels={activeFilterLabels}
            onChange={applyFilterChange}
            onSearch={handleHeaderSearch}
            onClear={handleClear}
            onRemoveFilter={handleRemoveFilter}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                    tab === t.id
                      ? 'dc-gradient-btn text-white'
                      : 'dc-glass-card text-[#8b8ca8] hover:text-white'
                  }`}
                >
                  {t.label}
                  <span className="ml-1.5 text-[10px] opacity-80">({tabCounts[t.id]})</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#8b8ca8]">
              <span>{filteredJobs.length} jobs found</span>
              {activeFilterCount > 0 && (
                <>
                  <span className="text-[#5c5d72]">|</span>
                  <span className="text-[#818cf8]">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
                </>
              )}
              <span className="text-[#5c5d72]">|</span>
              <label className="flex items-center gap-1.5">
                Sort by:
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="appearance-none pl-3 pr-7 py-1.5 rounded-lg bg-[#161722] border border-[#2d2e3e] text-white text-xs focus:outline-none focus:border-[#6366f1]"
                  >
                    <option value="relevant">Most Relevant</option>
                    <option value="match">Highest Match</option>
                    <option value="recent">Most Recent</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#8b8ca8]" />
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl border border-[#6366f1]/25 bg-gradient-to-r from-[#6366f1]/10 to-transparent">
            <Sparkles size={18} className="text-[#818cf8] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">DevConnect Smart Matching</p>
              <p className="text-xs text-[#8b8ca8] mt-1 leading-relaxed">
                Filters apply instantly. Jobs are ranked by your DevScore — built from AI interviews,
                coding challenges, projects, and mentor reviews.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-16 dc-glass-card rounded-2xl">
                <Briefcase className="w-12 h-12 text-[#6366f1] mx-auto mb-3 opacity-60" />
                <p className="text-white font-medium">No jobs match your filters</p>
                <p className="text-sm text-[#8b8ca8] mt-1 max-w-md mx-auto">
                  {activeFilterCount > 0
                    ? 'Try removing a filter or broadening your search criteria.'
                    : 'No jobs in this tab match your profile yet.'}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold dc-gradient-btn text-white"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  saved={savedIds.has(job.id)}
                  onViewDetails={setSelectedJob}
                  onApply={handleApply}
                  onToggleSave={toggleSave}
                />
              ))
            )}
          </div>
        </div>

        <aside className="w-full xl:w-80 shrink-0 space-y-4">
          <RecommendedJobs jobs={recommendedJobs} onSelect={setSelectedJob} />

          <div className="dc-glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Saved Jobs</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#6366f1]/20 text-[#a5b4fc]">
                {savedJobs.length}
              </span>
            </div>
            <div className="space-y-2">
              {savedJobs.length === 0 ? (
                <p className="text-xs text-[#8b8ca8]">No saved jobs yet.</p>
              ) : (
                savedJobs.slice(0, 5).map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#1c1d2a] transition-colors text-left"
                  >
                    <img src={avatarUrl(job.company, 32)} alt="" className="w-8 h-8 rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{job.title}</p>
                      <p className="text-[10px] text-[#8b8ca8] truncate">{job.company}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <ApplicationStatus />
          <RecruiterVisibility />
        </aside>
      </div>

      {selectedJob && (
        <JobDetails
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={handleApply}
        />
      )}
    </div>
  )
}
