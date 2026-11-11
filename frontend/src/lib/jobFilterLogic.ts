import { USER_DEV_SCORE, type JobListing } from '../data/jobsData'

export interface JobFilters {
  search: string
  role: string
  locations: string[]
  experience: string
  jobType: string
  skills: string[]
  minDevScore: number
}

export function parseExperienceYears(exp: string): { min: number; max: number } {
  if (exp === 'Fresher') return { min: 0, max: 0 }
  const range = exp.match(/(\d+)\s*-\s*(\d+)/)
  if (range) return { min: Number(range[1]), max: Number(range[2]) }
  const plus = exp.match(/(\d+)\+/)
  if (plus) return { min: Number(plus[1]), max: 99 }
  return { min: 0, max: 99 }
}

export function matchesExperienceFilter(jobExperience: string, filter: string): boolean {
  if (filter === 'All Experience') return true
  const job = parseExperienceYears(jobExperience)
  switch (filter) {
    case 'Fresher':
      return job.min === 0 && job.max <= 0
    case '0-1 Years':
      return job.max <= 1
    case '1-3 Years':
      return job.min <= 3 && job.max >= 1
    case '3-5 Years':
      return job.min <= 5 && job.max >= 3
    case '5+ Years':
      return job.min >= 5
    default:
      return true
  }
}

export function matchesJobTypeFilter(job: JobListing, jobType: string): boolean {
  if (jobType === 'All Types') return true
  if (jobType === 'Remote') return job.remote || job.location === 'Remote' || job.jobType === 'Remote'
  if (jobType === 'Internship') return job.internship || job.jobType === 'Internship'
  if (jobType === 'Hybrid') return job.jobType === 'Hybrid'
  if (jobType === 'Full-time') return job.jobType === 'Full-time'
  if (jobType === 'Part-time') return job.jobType === 'Part-time'
  return job.jobType === jobType
}

export function matchesDevScoreFilter(job: JobListing, minDevScore: number): boolean {
  if (minDevScore <= 0) {
    return USER_DEV_SCORE >= job.minDevScore
  }
  return job.minDevScore >= minDevScore && USER_DEV_SCORE >= job.minDevScore
}

function matchesLocationFilter(job: JobListing, locations: string[]): boolean {
  if (locations.length === 0) return true
  return locations.some((loc) => {
    if (loc === 'Remote') return job.remote || job.location === 'Remote'
    return job.location === loc
  })
}

function matchesSkillsFilter(job: JobListing, skills: string[]): boolean {
  if (skills.length === 0) return true
  const jobSkills = job.skills.map((s) => s.toLowerCase())
  return skills.some((skill) => jobSkills.includes(skill.toLowerCase()))
}

export function matchesFilters(job: JobListing, filters: JobFilters): boolean {
  const q = filters.search.trim().toLowerCase()
  if (q) {
    const haystack = [job.title, job.company, job.location, job.role, ...job.skills]
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(q)) return false
  }

  if (filters.role !== 'All Roles' && job.role !== filters.role) return false
  if (!matchesLocationFilter(job, filters.locations)) return false
  if (!matchesExperienceFilter(job.experience, filters.experience)) return false
  if (!matchesJobTypeFilter(job, filters.jobType)) return false
  if (!matchesSkillsFilter(job, filters.skills)) return false
  if (!matchesDevScoreFilter(job, filters.minDevScore)) return false

  return true
}

export function countActiveFilters(filters: JobFilters): number {
  let count = 0
  if (filters.search.trim()) count++
  if (filters.role !== 'All Roles') count++
  count += filters.locations.length
  if (filters.experience !== 'All Experience') count++
  if (filters.jobType !== 'All Types') count++
  count += filters.skills.length
  if (filters.minDevScore > 0) count++
  return count
}

export function describeActiveFilters(filters: JobFilters): { id: string; label: string }[] {
  const labels: { id: string; label: string }[] = []
  if (filters.search.trim()) {
    labels.push({ id: 'search', label: `"${filters.search.trim()}"` })
  }
  if (filters.role !== 'All Roles') labels.push({ id: 'role', label: filters.role })
  filters.locations.forEach((loc) => {
    labels.push({ id: `location:${loc}`, label: loc })
  })
  if (filters.experience !== 'All Experience') {
    labels.push({ id: 'experience', label: filters.experience })
  }
  if (filters.jobType !== 'All Types') labels.push({ id: 'jobType', label: filters.jobType })
  filters.skills.forEach((skill) => {
    labels.push({ id: `skill:${skill}`, label: skill })
  })
  if (filters.minDevScore > 0) {
    labels.push({ id: 'minDevScore', label: `DevScore ${filters.minDevScore}+` })
  }
  return labels
}
