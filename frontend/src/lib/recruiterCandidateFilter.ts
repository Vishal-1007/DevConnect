import type { RecruiterCandidate } from '../data/recruiterData'
import type { CandidateFilters } from '../components/recruiter/CandidateSearch'

function parseYears(experience: string): number {
  const match = experience.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

function matchesExperience(candidateExp: string, filter: string): boolean {
  const years = parseYears(candidateExp)
  if (filter === '0-2 Years') return years <= 2
  if (filter === '2-5 Years') return years > 2 && years <= 5
  if (filter === '5+ Years') return years >= 5
  return true
}

export function filterRecruiterCandidates(
  candidates: RecruiterCandidate[],
  filters: CandidateFilters,
  searchQuery: string,
): RecruiterCandidate[] {
  let list = [...candidates]

  const q = searchQuery.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q)) ||
        c.location.toLowerCase().includes(q),
    )
  }

  const roleQuery = filters.jobRole.trim().toLowerCase()
  if (roleQuery) {
    list = list.filter(
      (c) =>
        c.role.toLowerCase().includes(roleQuery) ||
        roleQuery.split(/\s+/).every((word) =>
          c.role.toLowerCase().includes(word) ||
          c.skills.some((s) => s.toLowerCase().includes(word)),
        ),
    )
  }

  list = list.filter((c) => c.devScore >= filters.minDevScore)

  if (filters.location) {
    list = list.filter((c) => c.location === filters.location)
  }

  if (filters.skills.length > 0) {
    list = list.filter((c) =>
      filters.skills.some((s) =>
        c.skills.some((cs) => cs.toLowerCase() === s.toLowerCase()),
      ),
    )
  }

  if (filters.experience) {
    list = list.filter((c) => matchesExperience(c.experience, filters.experience))
  }

  return list
}

export type SortOption = 'best-match' | 'devscore' | 'experience'

export function sortRecruiterCandidates(
  candidates: RecruiterCandidate[],
  sortBy: SortOption,
): RecruiterCandidate[] {
  const list = [...candidates]
  if (sortBy === 'devscore') {
    return list.sort((a, b) => b.devScore - a.devScore)
  }
  if (sortBy === 'experience') {
    return list.sort((a, b) => parseYears(b.experience) - parseYears(a.experience))
  }
  return list.sort((a, b) => (b.aiMatch ?? 0) - (a.aiMatch ?? 0))
}
