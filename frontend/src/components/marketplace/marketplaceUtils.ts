import type { MentorshipRequest } from '../../api/mentorshipApi'
import type { MarketplaceMentor } from '../../api/marketplaceApi'

export type MentorshipRequestState = 'none' | 'pending' | 'accepted' | 'rejected'

export function getMentorshipRequestState(
  mentorId: string,
  requests: MentorshipRequest[]
): MentorshipRequestState {
  const forMentor = requests.filter((r) => r.mentorId === mentorId)
  if (forMentor.some((r) => r.status === 'ACCEPTED')) return 'accepted'
  if (forMentor.some((r) => r.status === 'PENDING')) return 'pending'
  if (forMentor.some((r) => r.status === 'REJECTED')) return 'rejected'
  return 'none'
}

export function canOpenMentorshipRequestModal(state: MentorshipRequestState): boolean {
  return state === 'none' || state === 'rejected'
}

export type SortOption =
  | 'top_rated'
  | 'most_popular'
  | 'most_sessions'
  | 'lowest_price'
  | 'highest_price'
  | 'recently_active'

export interface MarketplaceFilters {
  search: string
  skills: string[]
  minExperience: number | null
  minRating: number | null
  availability: 'all' | 'online' | 'instant'
  priceRange: 'all' | '10-20' | '20-50' | '50+'
  sort: SortOption
}

export const DEFAULT_FILTERS: MarketplaceFilters = {
  search: '',
  skills: [],
  minExperience: null,
  minRating: null,
  availability: 'all',
  priceRange: 'all',
  sort: 'top_rated',
}

const FAVORITES_KEY = 'dc_saved_mentors'

export function getSavedMentorIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function toggleSavedMentor(mentorId: string): boolean {
  const ids = new Set(getSavedMentorIds())
  if (ids.has(mentorId)) {
    ids.delete(mentorId)
  } else {
    ids.add(mentorId)
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids]))
  return ids.has(mentorId)
}

export function isMentorSaved(mentorId: string): boolean {
  return getSavedMentorIds().includes(mentorId)
}

export function filterAndSortMentors(
  mentors: MarketplaceMentor[],
  filters: MarketplaceFilters
): MarketplaceMentor[] {
  let list = [...mentors]

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase()
    list = list.filter((m) =>
      [m.displayName, m.company, m.designation, ...m.expertiseTags, ...m.categories]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }

  if (filters.skills.length > 0) {
    list = list.filter((m) =>
      filters.skills.some((s) =>
        m.expertiseTags.some((t) => t.toLowerCase().includes(s.toLowerCase()))
      )
    )
  }

  if (filters.minExperience != null) {
    list = list.filter((m) => (m.experienceYears ?? 0) >= filters.minExperience!)
  }

  if (filters.minRating != null) {
    list = list.filter((m) => m.averageRating >= filters.minRating!)
  }

  if (filters.availability === 'online') {
    list = list.filter((m) => m.availabilityStatus === 'AVAILABLE')
  } else if (filters.availability === 'instant') {
    list = list.filter((m) => m.availabilityStatus === 'AVAILABLE' && m.instantCallEnabled)
  }

  if (filters.priceRange === '10-20') {
    list = list.filter((m) => m.videoPricePerMinuteCents >= 1000 && m.videoPricePerMinuteCents <= 2000)
  } else if (filters.priceRange === '20-50') {
    list = list.filter((m) => m.videoPricePerMinuteCents > 2000 && m.videoPricePerMinuteCents <= 5000)
  } else if (filters.priceRange === '50+') {
    list = list.filter((m) => m.videoPricePerMinuteCents > 5000)
  }

  list.sort((a, b) => {
    switch (filters.sort) {
      case 'most_popular':
        return b.ratingCount - a.ratingCount
      case 'most_sessions':
        return b.sessionsCompleted - a.sessionsCompleted
      case 'lowest_price':
        return a.videoPricePerMinuteCents - b.videoPricePerMinuteCents
      case 'highest_price':
        return b.videoPricePerMinuteCents - a.videoPricePerMinuteCents
      case 'recently_active':
        return (a.availabilityStatus === 'AVAILABLE' ? -1 : 1) - (b.availabilityStatus === 'AVAILABLE' ? -1 : 1)
      default:
        return b.averageRating - a.averageRating
    }
  })

  return list
}

export const SKILL_FILTERS = ['Java', 'Spring Boot', 'React', 'Node.js', 'AWS', 'DevOps', 'System Design', 'DSA']
export const EXPERIENCE_FILTERS = [1, 3, 5, 10]
export const RATING_FILTERS = [4, 4.5, 4.8]
