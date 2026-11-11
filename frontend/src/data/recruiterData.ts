export type RecruiterCandidate = {
  id: string
  name: string
  role: string
  avatar: string
  devScore: number
  percentile: string
  skills: string[]
  experience: string
  location: string
  status: 'Open to Work' | 'Interviewing' | 'Not Looking'
  rating: number
  verified: boolean
  aiMatch?: number
  breakdown?: {
    aiInterview: number
    codingScore: number
    projectScore: number
    mentorRating: number
  }
  skillLevels?: { skill: string; level: number }[]
  projects?: {
    name: string
    checks: { label: string; done: boolean }[]
  }[]
  mentorFeedback?: string
}

export type RecruiterJob = {
  id: string
  title: string
  company: string
  skills: string[]
  experience: string
  salary: string
  location: string
  minDevScore: number
  applications: number
  status: 'Active' | 'Draft' | 'Closed'
  postedAt: string
}

export type RecruiterApplication = {
  id: string
  candidateId: string
  candidateName: string
  jobTitle: string
  devScore: number
  matchPercent: number
  resumeUrl: string
  status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Interview'
}

export type RecruiterActivity = {
  id: string
  type: 'application' | 'shortlisted' | 'interview' | 'job'
  title: string
  description: string
  timeAgo: string
}

export const RECRUITER_PROFILE = {
  name: 'Infosys Recruiter',
  company: 'Infosys',
  email: 'recruiter@infosys.com',
  initials: 'IR',
  plan: 'Premium Recruiter',
  planValidUntil: 'Dec 2026',
}

export const RECRUITER_ANALYTICS = {
  activeJobs: { value: 12, delta: '2 new this week' },
  applications: { value: 820, delta: '+18% this week' },
  shortlisted: { value: 47, delta: 'AI verified candidates' },
  interviews: { value: 15, delta: 'Scheduled' },
}

export const RECRUITER_CANDIDATES: RecruiterCandidate[] = [
  {
    id: 'c1',
    name: 'Vishal Gupta',
    role: 'Backend Developer',
    avatar: 'VG',
    devScore: 925,
    percentile: 'Top 3%',
    skills: ['Java', 'Spring Boot', 'React', 'AWS'],
    experience: '2 Years',
    location: 'Bangalore',
    status: 'Open to Work',
    rating: 4.8,
    verified: true,
    aiMatch: 96,
    breakdown: { aiInterview: 94, codingScore: 90, projectScore: 92, mentorRating: 4.8 },
    skillLevels: [
      { skill: 'Java', level: 95 },
      { skill: 'Spring Boot', level: 90 },
      { skill: 'React', level: 80 },
    ],
    projects: [
      {
        name: 'E-commerce Backend',
        checks: [
          { label: 'Authentication', done: true },
          { label: 'Database', done: true },
          { label: 'Deployment', done: true },
          { label: 'Clean Code', done: true },
        ],
      },
    ],
    mentorFeedback: 'Strong backend developer with good architecture knowledge',
  },
  {
    id: 'c2',
    name: 'Priya Sharma',
    role: 'Full Stack Developer',
    avatar: 'PS',
    devScore: 898,
    percentile: 'Top 5%',
    skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
    experience: '3 Years',
    location: 'Hyderabad',
    status: 'Open to Work',
    rating: 4.7,
    verified: true,
    aiMatch: 91,
    breakdown: { aiInterview: 88, codingScore: 92, projectScore: 90, mentorRating: 4.7 },
    skillLevels: [
      { skill: 'React', level: 92 },
      { skill: 'Node.js', level: 88 },
      { skill: 'TypeScript', level: 85 },
    ],
    projects: [
      {
        name: 'SaaS Dashboard',
        checks: [
          { label: 'Authentication', done: true },
          { label: 'Database', done: true },
          { label: 'Deployment', done: true },
          { label: 'Clean Code', done: true },
        ],
      },
    ],
    mentorFeedback: 'Excellent frontend patterns and API design skills',
  },
  {
    id: 'c3',
    name: 'Arjun Mehta',
    role: 'Java Full Stack Developer',
    avatar: 'AM',
    devScore: 872,
    percentile: 'Top 8%',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Docker'],
    experience: '2.3 Years',
    location: 'Pune',
    status: 'Interviewing',
    rating: 4.6,
    verified: true,
    aiMatch: 88,
    breakdown: { aiInterview: 86, codingScore: 88, projectScore: 87, mentorRating: 4.6 },
    skillLevels: [
      { skill: 'Java', level: 90 },
      { skill: 'Spring Boot', level: 87 },
      { skill: 'Docker', level: 82 },
    ],
    mentorFeedback: 'Solid fundamentals with growing system design ability',
  },
  {
    id: 'c4',
    name: 'Sneha Reddy',
    role: 'Frontend Developer',
    avatar: 'SR',
    devScore: 845,
    percentile: 'Top 12%',
    skills: ['React', 'Next.js', 'Tailwind', 'GraphQL'],
    experience: '1.5 Years',
    location: 'Bangalore',
    status: 'Open to Work',
    rating: 4.5,
    verified: true,
    aiMatch: 84,
    breakdown: { aiInterview: 82, codingScore: 86, projectScore: 85, mentorRating: 4.5 },
    skillLevels: [
      { skill: 'React', level: 88 },
      { skill: 'Next.js', level: 84 },
      { skill: 'Tailwind', level: 90 },
    ],
    mentorFeedback: 'Creative UI developer with strong component architecture',
  },
  {
    id: 'c5',
    name: 'Rahul Verma',
    role: 'DevOps Engineer',
    avatar: 'RV',
    devScore: 831,
    percentile: 'Top 15%',
    skills: ['AWS', 'Kubernetes', 'CI/CD', 'Terraform'],
    experience: '4 Years',
    location: 'Chennai',
    status: 'Open to Work',
    rating: 4.4,
    verified: false,
    aiMatch: 82,
    breakdown: { aiInterview: 80, codingScore: 84, projectScore: 83, mentorRating: 4.4 },
    skillLevels: [
      { skill: 'AWS', level: 86 },
      { skill: 'Kubernetes', level: 82 },
      { skill: 'Terraform', level: 78 },
    ],
    mentorFeedback: 'Reliable DevOps engineer with production deployment experience',
  },
]

export const RECRUITER_JOBS: RecruiterJob[] = [
  {
    id: 'j1',
    title: 'Backend Developer',
    company: 'Infosys',
    skills: ['Java', 'Spring Boot', 'MySQL'],
    experience: '0-3 Years',
    salary: '₹8–12 LPA',
    location: 'Bangalore',
    minDevScore: 850,
    applications: 124,
    status: 'Active',
    postedAt: '3 days ago',
  },
  {
    id: 'j2',
    title: 'Full Stack Engineer',
    company: 'Infosys',
    skills: ['React', 'Node.js', 'PostgreSQL'],
    experience: '2-5 Years',
    salary: '₹12–18 LPA',
    location: 'Hyderabad',
    minDevScore: 800,
    applications: 89,
    status: 'Active',
    postedAt: '1 week ago',
  },
  {
    id: 'j3',
    title: 'Senior Java Developer',
    company: 'Infosys',
    skills: ['Java', 'Microservices', 'AWS'],
    experience: '5+ Years',
    salary: '₹18–25 LPA',
    location: 'Pune',
    minDevScore: 900,
    applications: 42,
    status: 'Active',
    postedAt: '2 weeks ago',
  },
]

export const RECRUITER_APPLICATIONS: RecruiterApplication[] = [
  {
    id: 'a1',
    candidateId: 'c1',
    candidateName: 'Vishal Gupta',
    jobTitle: 'Backend Developer',
    devScore: 925,
    matchPercent: 96,
    resumeUrl: '#',
    status: 'Applied',
  },
  {
    id: 'a2',
    candidateId: 'c2',
    candidateName: 'Priya Sharma',
    jobTitle: 'Full Stack Engineer',
    devScore: 898,
    matchPercent: 91,
    resumeUrl: '#',
    status: 'Shortlisted',
  },
  {
    id: 'a3',
    candidateId: 'c3',
    candidateName: 'Arjun Mehta',
    jobTitle: 'Backend Developer',
    devScore: 872,
    matchPercent: 88,
    resumeUrl: '#',
    status: 'Interview',
  },
  {
    id: 'a4',
    candidateId: 'c4',
    candidateName: 'Sneha Reddy',
    jobTitle: 'Full Stack Engineer',
    devScore: 845,
    matchPercent: 84,
    resumeUrl: '#',
    status: 'Applied',
  },
]

export const RECRUITER_ACTIVITY: RecruiterActivity[] = [
  {
    id: 'act1',
    type: 'application',
    title: 'New application received',
    description: 'Vishal Gupta applied for Backend Developer',
    timeAgo: '2 min ago',
  },
  {
    id: 'act2',
    type: 'shortlisted',
    title: 'Candidate shortlisted',
    description: 'Priya Sharma moved to shortlist',
    timeAgo: '15 min ago',
  },
  {
    id: 'act3',
    type: 'interview',
    title: 'Interview scheduled',
    description: 'Arjun Mehta — Backend Developer role',
    timeAgo: '1 hr ago',
  },
  {
    id: 'act4',
    type: 'job',
    title: 'Job posted',
    description: 'Senior Java Developer role published',
    timeAgo: '3 hrs ago',
  },
]

export const DEFAULT_SEARCH_FILTERS = {
  jobRole: 'Backend Developer',
  skills: ['Java', 'Spring Boot', 'React'],
  experience: '0-2 Years',
  location: 'Bangalore',
  minDevScore: 800,
}
