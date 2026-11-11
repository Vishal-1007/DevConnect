export const DISCUSSION_TOPICS = [
  { id: 'all', label: 'All topics' },
  { id: 'interview-prep', label: 'Interview Prep' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'career', label: 'Career' },
  { id: 'general', label: 'General' },
] as const

export const topicLabels: Record<string, string> = Object.fromEntries(
  DISCUSSION_TOPICS.filter((t) => t.id !== 'all').map((t) => [t.id, t.label])
)

topicLabels.general = 'General'
