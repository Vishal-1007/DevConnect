import {
  TALENT_POOL_CANDIDATES,
  type SavedTalentCandidate,
  type TalentSource,
} from '../data/recruiterTalentPoolData'

const STORAGE_KEY = 'dc_recruiter_talent_pool'

export type TalentFilterState = {
  search: string
  skill: string
  experience: string
  location: string
  minDevScore: number
}

export const DEFAULT_TALENT_FILTERS: TalentFilterState = {
  search: '',
  skill: 'All Skills',
  experience: 'All Experience',
  location: 'All Locations',
  minDevScore: 0,
}

function parseYears(exp: string): number {
  const m = exp.match(/[\d.]+/)
  return m ? parseFloat(m[0]) : 0
}

function matchesExperience(exp: string, filter: string): boolean {
  const years = parseYears(exp)
  if (filter === 'All Experience') return true
  if (filter === '0-2 Years') return years <= 2
  if (filter === '2-5 Years') return years > 2 && years <= 5
  if (filter === '5+ Years') return years >= 5
  return true
}

export function loadTalentPool(): SavedTalentCandidate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedTalentCandidate[]) : structuredClone(TALENT_POOL_CANDIDATES)
  } catch {
    return structuredClone(TALENT_POOL_CANDIDATES)
  }
}

export function saveTalentPool(candidates: SavedTalentCandidate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates))
}

export function filterTalentPool(
  candidates: SavedTalentCandidate[],
  filters: TalentFilterState,
): SavedTalentCandidate[] {
  let list = [...candidates]

  const q = filters.search.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q)),
    )
  }

  if (filters.skill !== 'All Skills') {
    list = list.filter((c) => c.skills.some((s) => s.toLowerCase() === filters.skill.toLowerCase()))
  }

  if (filters.experience !== 'All Experience') {
    list = list.filter((c) => matchesExperience(c.experience, filters.experience))
  }

  if (filters.location !== 'All Locations') {
    list = list.filter((c) => c.location === filters.location)
  }

  if (filters.minDevScore > 0) {
    list = list.filter((c) => c.devScore >= filters.minDevScore)
  }

  return list.sort((a, b) => b.devScore - a.devScore)
}

export function removeFromTalentPool(
  candidates: SavedTalentCandidate[],
  poolId: string,
): SavedTalentCandidate[] {
  const next = candidates.filter((c) => c.poolId !== poolId)
  saveTalentPool(next)
  return next
}

export function addToTalentPool(
  candidates: SavedTalentCandidate[],
  entry: SavedTalentCandidate,
): SavedTalentCandidate[] {
  if (candidates.some((c) => c.poolId === entry.poolId || c.candidateId === entry.candidateId)) {
    return candidates
  }
  const next = [entry, ...candidates]
  saveTalentPool(next)
  return next
}

export function computeTalentOverview(candidates: SavedTalentCandidate[]) {
  const high = candidates.filter((c) => c.devScore >= 800).length
  const good = candidates.filter((c) => c.devScore >= 600 && c.devScore < 800).length
  const average = candidates.filter((c) => c.devScore < 600).length

  return {
    total: candidates.length,
    high,
    good,
    average,
  }
}

export function computeDevScoreDistribution(candidates: SavedTalentCandidate[]) {
  const total = candidates.length || 1
  const tiers = [
    { label: '900+', sub: 'Top 5%', min: 900, max: 1001 },
    { label: '800-899', sub: '', min: 800, max: 899 },
    { label: '600-799', sub: '', min: 600, max: 799 },
    { label: 'Below 600', sub: '', min: 0, max: 599 },
  ]

  return tiers.map((tier) => {
    const count = candidates.filter((c) => c.devScore >= tier.min && c.devScore <= tier.max).length
    return {
      ...tier,
      count,
      percent: Math.round((count / total) * 100),
    }
  })
}

export function getRecentlyAdded(candidates: SavedTalentCandidate[], limit = 3) {
  return [...candidates]
    .sort((a, b) => new Date(b.addedOn).getTime() - new Date(a.addedOn).getTime())
    .slice(0, limit)
}

export function formatTodayEntry(
  candidateId: string,
  name: string,
  role: string,
  avatar: string,
  source: TalentSource = 'Manual',
): SavedTalentCandidate {
  const today = new Date()
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const display = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return {
    poolId: `tp-${Date.now()}`,
    candidateId,
    name,
    role,
    avatar,
    devScore: 800,
    percentile: 'Top 20%',
    skills: ['Java', 'React'],
    experience: '2 Years',
    location: 'Bangalore',
    locationDisplay: 'Bangalore, India',
    status: 'Open to Work',
    rating: 4.5,
    reviewCount: 10,
    verified: false,
    aiMatch: 80,
    breakdown: { aiInterview: 78, codingScore: 750, projectScore: 80, mentorRating: 4.5 },
    addedOn: key,
    addedOnDisplay: display,
    source,
  }
}
