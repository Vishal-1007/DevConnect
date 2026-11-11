import { Video, GraduationCap, Code2, Users } from 'lucide-react'

export type PlatformSessionTypeId = 'video_call' | 'mentorship' | 'interview' | 'coding'

export const SESSION_TYPES: {
  id: PlatformSessionTypeId | 'all'
  label: string
  description: string
  color: string
}[] = [
  { id: 'all', label: 'All types', description: 'Every live session', color: 'gray' },
  { id: 'video_call', label: 'Video calls', description: 'Community and open calls', color: 'blue' },
  { id: 'mentorship', label: 'Mentorship', description: 'Mentor–mentee sessions', color: 'purple' },
  { id: 'interview', label: 'Interviews', description: 'Technical and HR interviews', color: 'amber' },
  { id: 'coding', label: 'Coding', description: 'Pair programming and DSA', color: 'cyan' },
]

export const SESSION_TYPE_ICONS: Record<string, typeof Video> = {
  video_call: Video,
  mentorship: Users,
  interview: GraduationCap,
  coding: Code2,
}

export function sessionTypeMeta(type: string) {
  return SESSION_TYPES.find((t) => t.id === type) ?? SESSION_TYPES[1]
}

export const MODERATION_STATUS: Record<string, { label: string; color: string }> = {
  clear: { label: 'Clear', color: 'green' },
  review: { label: 'Under review', color: 'amber' },
  flagged: { label: 'Flagged', color: 'red' },
}
