export type TalentSource = 'Search' | 'Job Application' | 'Referral' | 'Manual'

export type SavedTalentCandidate = {
  poolId: string
  candidateId: string
  name: string
  role: string
  avatar: string
  devScore: number
  percentile: string
  skills: string[]
  experience: string
  location: string
  locationDisplay: string
  status: 'Open to Work' | 'Interviewing' | 'Not Looking'
  rating: number
  reviewCount: number
  verified: boolean
  aiMatch?: number
  breakdown?: {
    aiInterview: number
    codingScore: number
    projectScore: number
    mentorRating: number
  }
  mentorFeedback?: string
  resumeUrl?: string
  addedOn: string
  addedOnDisplay: string
  source: TalentSource
}

function daysAgoDisplay(days: number): { key: string; display: string } {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const display = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return { key, display }
}

const d12 = daysAgoDisplay(14)
const d10 = daysAgoDisplay(16)
const d8 = daysAgoDisplay(18)
const d6 = daysAgoDisplay(20)
const d4 = daysAgoDisplay(22)
const d2 = daysAgoDisplay(24)

export const TALENT_POOL_CANDIDATES: SavedTalentCandidate[] = [
  {
    poolId: 'tp-1',
    candidateId: 'c1',
    name: 'Vishal Gupta',
    role: 'Java Backend Developer',
    avatar: 'VG',
    devScore: 925,
    percentile: 'Top 3%',
    skills: ['Java', 'Spring Boot', 'MySQL', 'AWS', 'REST API', 'Docker', 'Microservices'],
    experience: '2.3 Years',
    location: 'Bangalore',
    locationDisplay: 'Bangalore, India',
    status: 'Open to Work',
    rating: 4.8,
    reviewCount: 56,
    verified: true,
    aiMatch: 96,
    breakdown: { aiInterview: 94, codingScore: 890, projectScore: 92, mentorRating: 4.8 },
    mentorFeedback: 'Strong backend developer with good architecture knowledge',
    resumeUrl: '#',
    addedOn: d12.key,
    addedOnDisplay: d12.display,
    source: 'Search',
  },
  {
    poolId: 'tp-2',
    candidateId: 'c2',
    name: 'Ananya Singh',
    role: 'Full Stack Developer',
    avatar: 'AS',
    devScore: 898,
    percentile: 'Top 5%',
    skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'GraphQL', 'Redis'],
    experience: '3 Years',
    location: 'Hyderabad',
    locationDisplay: 'Hyderabad, India',
    status: 'Open to Work',
    rating: 4.7,
    reviewCount: 42,
    verified: true,
    aiMatch: 91,
    breakdown: { aiInterview: 88, codingScore: 875, projectScore: 90, mentorRating: 4.7 },
    resumeUrl: '#',
    addedOn: d10.key,
    addedOnDisplay: d10.display,
    source: 'Job Application',
  },
  {
    poolId: 'tp-3',
    candidateId: 'c3',
    name: 'Rahul Kumar',
    role: 'Java Developer',
    avatar: 'RK',
    devScore: 872,
    percentile: 'Top 8%',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Docker', 'JUnit', 'Maven'],
    experience: '2.3 Years',
    location: 'Pune',
    locationDisplay: 'Pune, India',
    status: 'Interviewing',
    rating: 4.6,
    reviewCount: 38,
    verified: true,
    aiMatch: 88,
    breakdown: { aiInterview: 86, codingScore: 850, projectScore: 87, mentorRating: 4.6 },
    resumeUrl: '#',
    addedOn: d8.key,
    addedOnDisplay: d8.display,
    source: 'Referral',
  },
  {
    poolId: 'tp-4',
    candidateId: 'c4',
    name: 'Sneha Iyer',
    role: 'Frontend Developer',
    avatar: 'SI',
    devScore: 845,
    percentile: 'Top 12%',
    skills: ['React', 'Next.js', 'Tailwind', 'GraphQL', 'TypeScript', 'Figma'],
    experience: '1.5 Years',
    location: 'Bangalore',
    locationDisplay: 'Bangalore, India',
    status: 'Open to Work',
    rating: 4.5,
    reviewCount: 29,
    verified: true,
    aiMatch: 84,
    breakdown: { aiInterview: 82, codingScore: 820, projectScore: 85, mentorRating: 4.5 },
    resumeUrl: '#',
    addedOn: d6.key,
    addedOnDisplay: d6.display,
    source: 'Search',
  },
  {
    poolId: 'tp-5',
    candidateId: 'c5',
    name: 'Rahul Verma',
    role: 'DevOps Engineer',
    avatar: 'RV',
    devScore: 831,
    percentile: 'Top 15%',
    skills: ['AWS', 'Kubernetes', 'CI/CD', 'Terraform', 'Docker', 'Linux'],
    experience: '4 Years',
    location: 'Chennai',
    locationDisplay: 'Chennai, India',
    status: 'Open to Work',
    rating: 4.4,
    reviewCount: 31,
    verified: false,
    aiMatch: 82,
    breakdown: { aiInterview: 80, codingScore: 810, projectScore: 83, mentorRating: 4.4 },
    resumeUrl: '#',
    addedOn: d4.key,
    addedOnDisplay: d4.display,
    source: 'Job Application',
  },
  {
    poolId: 'tp-6',
    candidateId: 'c2',
    name: 'Priya Sharma',
    role: 'Full Stack Engineer',
    avatar: 'PS',
    devScore: 756,
    percentile: 'Top 25%',
    skills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript'],
    experience: '2 Years',
    location: 'Remote',
    locationDisplay: 'Remote, India',
    status: 'Open to Work',
    rating: 4.3,
    reviewCount: 18,
    verified: true,
    aiMatch: 78,
    breakdown: { aiInterview: 75, codingScore: 740, projectScore: 80, mentorRating: 4.3 },
    resumeUrl: '#',
    addedOn: d2.key,
    addedOnDisplay: d2.display,
    source: 'Manual',
  },
]

export const SKILL_FILTER_OPTIONS = [
  'All Skills',
  'Java',
  'Spring Boot',
  'React',
  'Node.js',
  'AWS',
  'PostgreSQL',
  'TypeScript',
]

export const EXPERIENCE_FILTER_OPTIONS = [
  'All Experience',
  '0-2 Years',
  '2-5 Years',
  '5+ Years',
]

export const LOCATION_FILTER_OPTIONS = [
  'All Locations',
  'Bangalore',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Remote',
]

export const DEVSCORE_FILTER_OPTIONS = [
  { label: 'All DevScores', value: 0 },
  { label: '900+', value: 900 },
  { label: '800+', value: 800 },
  { label: '700+', value: 700 },
]
