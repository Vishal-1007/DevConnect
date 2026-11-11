export type VideoRoomTypeId = 'public' | 'private' | 'interview' | 'study_group'
export type VideoRoomUseCaseId = 'mentoring' | 'workshop' | 'teaching' | 'community'

export const VIDEO_ROOM_TYPES: {
  id: VideoRoomTypeId
  label: string
  description: string
  color: string
}[] = [
  {
    id: 'public',
    label: 'Public Room',
    description: 'Open to all platform members',
    color: '#10b981',
  },
  {
    id: 'private',
    label: 'Private Room',
    description: 'Invite-only or restricted access',
    color: '#f59e0b',
  },
  {
    id: 'interview',
    label: 'Interview Room',
    description: 'Mock interviews and 1:1 evaluations',
    color: '#818cf8',
  },
  {
    id: 'study_group',
    label: 'Study Group',
    description: 'Small cohort learning sessions',
    color: '#06b6d4',
  },
]

export const VIDEO_ROOM_USE_CASES: {
  id: VideoRoomUseCaseId
  label: string
  description: string
}[] = [
  { id: 'mentoring', label: 'Group Mentoring', description: 'Mentor-led Q&A and guidance' },
  { id: 'workshop', label: 'Workshop', description: 'Hands-on labs and demos' },
  { id: 'teaching', label: 'Live Teaching', description: 'Structured lessons and office hours' },
  { id: 'community', label: 'Community Discussion', description: 'Open peer discussions' },
]

export function roomTypeMeta(id: string) {
  return VIDEO_ROOM_TYPES.find((t) => t.id === id) ?? VIDEO_ROOM_TYPES[0]
}

export function useCaseMeta(id: string) {
  return VIDEO_ROOM_USE_CASES.find((u) => u.id === id) ?? VIDEO_ROOM_USE_CASES[3]
}
