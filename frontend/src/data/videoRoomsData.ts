export const VIDEO_ROOM_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All topics' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'architecture', label: 'System Design' },
  { id: 'interview-prep', label: 'Interview Prep' },
  { id: 'devops', label: 'DevOps' },
  { id: 'career', label: 'Career' },
  { id: 'general', label: 'General' },
]

export const categoryLabels: Record<string, string> = Object.fromEntries(
  VIDEO_ROOM_CATEGORIES.filter((c) => c.id !== 'all').map((c) => [c.id, c.label])
)

export const statusLabels: Record<string, string> = {
  live: 'Live now',
  ended: 'Ended',
}
