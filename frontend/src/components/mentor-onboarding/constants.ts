import type { OnboardingStepMeta } from './types'

export const ONBOARDING_STEPS: OnboardingStepMeta[] = [
  { id: 'basic', label: 'Basic Information', shortLabel: 'Basic Info', description: 'Tell us about yourself', icon: 'user' },
  { id: 'verification', label: 'Professional Verification', shortLabel: 'Verification', description: 'Verify your credentials', icon: 'shield' },
  { id: 'expertise', label: 'Expertise & Skills', shortLabel: 'Expertise', description: 'Showcase your skills', icon: 'sparkles' },
  { id: 'pricing', label: 'Services & Pricing', shortLabel: 'Pricing', description: 'Set your rates', icon: 'indian-rupee' },
  { id: 'payout', label: 'Payout Details', shortLabel: 'Payout', description: 'Secure payment setup', icon: 'landmark' },
  { id: 'agreements', label: 'Agreements', shortLabel: 'Agreements', description: 'Review policies', icon: 'file-check' },
  { id: 'review', label: 'Review & Submit', shortLabel: 'Review', description: 'Final review', icon: 'send' },
]

export const EXPERIENCE_OPTIONS = ['0-2 Years', '2-5 Years', '5-8 Years', '8-12 Years', '12+ Years']

export const SKILL_OPTIONS = [
  'Java', 'Spring Boot', 'React', 'AWS', 'DevOps', 'Kubernetes',
  'DSA', 'System Design', 'AI/ML', 'Node.js', 'Python', 'TypeScript',
  'Docker', 'PostgreSQL', 'Microservices', 'GraphQL',
]

export const CATEGORY_OPTIONS = [
  'Mock Interviews', 'Career Guidance', 'Resume Review',
  'Pair Programming', 'Architecture Guidance', 'Code Review',
]

export const LANGUAGE_OPTIONS = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Spanish',
]

export const TRUST_ITEMS = [
  { title: 'Trusted Platform', subtitle: 'Verified mentor ecosystem', icon: 'shield' },
  { title: '10K+ Active Learners', subtitle: 'Growing developer community', icon: 'users' },
  { title: '4.9 Average Rating', subtitle: 'Top-rated mentorship', icon: 'star' },
  { title: 'Secure & Safe', subtitle: 'Encrypted payouts & calls', icon: 'lock' },
]

export const BENEFIT_ITEMS = [
  { title: 'Earn Money', description: 'Get paid per session and instant calls.', icon: 'wallet', color: 'from-emerald-500/20 to-teal-500/10' },
  { title: 'Build Your Brand', description: 'Grow your professional visibility.', icon: 'badge', color: 'from-violet-500/20 to-purple-500/10' },
  { title: 'Help Developers', description: 'Guide learners and make impact.', icon: 'heart', color: 'from-pink-500/20 to-rose-500/10' },
  { title: 'Flexible & Independent', description: 'Work on your own schedule.', icon: 'clock', color: 'from-amber-500/20 to-orange-500/10' },
]

export const MIN_BIO_LENGTH = 150
export const PLATFORM_COMMISSION = 0.5
