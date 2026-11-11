export const EVENT_TYPES = [
  { id: 'all', label: 'All types' },
  { id: 'webinar', label: 'Webinar' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'hackathon', label: 'Hackathon' },
  { id: 'meetup', label: 'Meetup' },
] as const

export const EVENT_CATEGORIES = [
  { id: 'all', label: 'All categories' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'java', label: 'Java' },
  { id: 'react', label: 'React' },
  { id: 'devops', label: 'DevOps' },
  { id: 'system-design', label: 'System Design' },
  { id: 'career', label: 'Career' },
  { id: 'ai', label: 'AI' },
  { id: 'dsa', label: 'DSA' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'interview-prep', label: 'Interview Prep' },
  { id: 'general', label: 'General' },
] as const

export const PAID_PRICE_PRESETS = [99, 199, 499, 999] as const

export const typeLabels: Record<string, string> = {
  webinar: 'Webinar',
  workshop: 'Workshop',
  hackathon: 'Hackathon',
  meetup: 'Meetup',
}

export const typeBadgeColors: Record<string, string> = {
  webinar: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  workshop: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  hackathon: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  meetup: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
}

export const categoryLabels: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  java: 'Java',
  react: 'React',
  devops: 'DevOps',
  'system-design': 'System Design',
  career: 'Career',
  ai: 'AI',
  dsa: 'DSA',
  architecture: 'Architecture',
  'interview-prep': 'Interview Prep',
  general: 'General',
}

export const formatLabels: Record<string, string> = {
  online: 'Online',
  'in-person': 'In person',
}

export const approvalStatusColors: Record<string, string> = {
  approved: 'bg-emerald-500/15 text-emerald-400',
  pending: 'bg-amber-500/15 text-amber-400',
  rejected: 'bg-red-500/15 text-red-400',
}

export function defaultEventThumbnail(category: string, eventType: string): string {
  const seeds: Record<string, string> = {
    webinar: 'technology,conference',
    workshop: 'coding,workshop',
    hackathon: 'hackathon,programming',
    meetup: 'networking,developers',
  }
  const seed = seeds[eventType] ?? 'developer,event'
  return `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=640&h=360&fit=crop&q=80`
}
