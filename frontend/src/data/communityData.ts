export const FEED_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'general', label: 'General' },
  { id: 'java', label: 'Java' },
  { id: 'react', label: 'React' },
  { id: 'spring-boot', label: 'Spring Boot' },
  { id: 'system-design', label: 'System Design' },
  { id: 'career', label: 'Career' },
  { id: 'interview', label: 'Interview Experience' },
  { id: 'project', label: 'Project Showcase' },
  { id: 'mentorship', label: 'Mentorship' },
  { id: 'frontend', label: 'Frontend' },
] as const

export const FEED_TABS = [
  { id: 'all', label: 'All Posts' },
  { id: 'following', label: 'Following' },
  { id: 'popular', label: 'Popular' },
  { id: 'latest', label: 'Latest' },
] as const

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  FEED_CATEGORIES.filter((c) => c.id !== 'all').map((c) => [c.id, c.label])
)

export function developerBadge(points: number): { label: string; color: string } {
  if (points >= 5000) return { label: 'Top Mentor', color: 'text-amber-400' }
  if (points >= 2000) return { label: 'Expert', color: 'text-violet-300' }
  if (points >= 500) return { label: 'Pro Developer', color: 'text-emerald-400' }
  return { label: 'Beginner Developer', color: 'text-[#8b8ca8]' }
}

export const FALLBACK_TRENDING = [
  { tag: 'java', postCount: 2400 },
  { tag: 'react', postCount: 1800 },
  { tag: 'system-design', postCount: 950 },
  { tag: 'springboot', postCount: 720 },
  { tag: 'interview', postCount: 610 },
]
