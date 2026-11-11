export type CompanyType = 'Startup' | 'Product Based' | 'Service Based' | 'Enterprise'
export type SizeRange = '1-50' | '51-200' | '201-1000' | '1000+'

export type SocialLinks = {
  linkedin: string
  twitter: string
  github: string
  youtube: string
  blog: string
}

export type RecruiterInfo = {
  name: string
  role: string
  email: string
  avatar: string
  verified: boolean
}

export type HiringPreferences = {
  roles: string[]
  skills: string[]
  experience: string[]
  minDevScore: number
}

export type CompanySettings = {
  allowFollow: boolean
  showStatsPublicly: boolean
  allowDirectMessages: boolean
}

export type CompanyStats = {
  activeJobs: number
  activeJobsDelta: string
  totalApplications: number
  applicationsDelta: string
  candidatesHired: number
  hiredDelta: string
  avgHiringRating: number
}

export type TalentInsights = {
  avgApplicantDevScore: number
  aiVerifiedPercent: number
  mentorVerifiedPercent: number
}

export type VerificationCheck = {
  id: string
  label: string
  verified: boolean
}

export type TeamMember = {
  id: string
  name: string
  role: string
  avatar: string
  isAdmin?: boolean
}

export type JobOverview = {
  id: string
  title: string
  applicants: number
  avgDevScore: number
  topMatchPercent: number
}

export type CompanyProfileData = {
  name: string
  logoInitials: string
  verified: boolean
  industry: string
  location: string
  displaySize: string
  website: string
  profileCompletion: number
  emailDomain: string
  foundedYear: string
  headquarters: string
  companyType: CompanyType
  sizeRange: SizeRange
  tagline: string
  about: string
  mission: string
  culture: string
  benefits: string[]
  technologies: string[]
  social: SocialLinks
  recruiter: RecruiterInfo
  hiring: HiringPreferences
  settings: CompanySettings
  stats: CompanyStats
  talentInsights: TalentInsights
  verificationStatus: 'verified' | 'pending'
  verificationChecks: VerificationCheck[]
  team: TeamMember[]
  jobOverviews: JobOverview[]
}

export const HIRING_ROLE_OPTIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Mobile Developer',
  'AI Engineer',
]

export const PREFERRED_SKILL_OPTIONS = [
  'Java',
  'Spring Boot',
  'React',
  'AWS',
  'Python',
  'Node.js',
  'PostgreSQL',
  'TypeScript',
]

export const EXPERIENCE_OPTIONS = [
  'Freshers',
  '0-2 Years',
  '3-5 Years',
  '5+ Years',
]

export const COMPANY_TYPE_OPTIONS: CompanyType[] = [
  'Startup',
  'Product Based',
  'Service Based',
  'Enterprise',
]

export const SIZE_RANGE_OPTIONS: SizeRange[] = [
  '1-50',
  '51-200',
  '201-1000',
  '1000+',
]

export const DEFAULT_COMPANY_PROFILE: CompanyProfileData = {
  name: 'Infosys',
  logoInitials: 'IN',
  verified: true,
  industry: 'Information Technology',
  location: 'Bangalore, India',
  displaySize: '300,000+ Employees',
  website: 'infosys.com',
  profileCompletion: 90,
  emailDomain: '@infosys.com',
  foundedYear: '1981',
  headquarters: 'Bangalore, India',
  companyType: 'Service Based',
  sizeRange: '1000+',
  tagline: 'Navigate your next',
  about:
    'Infosys is a global technology company providing consulting and digital services. We help enterprises navigate their digital transformation journey with AI-powered solutions and world-class engineering talent.',
  mission:
    'To amplify human potential and create the next opportunity for people, businesses, and communities.',
  culture:
    'We foster innovation, continuous learning, and inclusive collaboration. Our culture emphasizes meritocracy, client value, and employee well-being.',
  benefits: ['Health Insurance', 'Remote Flexibility', 'Learning Budget', 'Stock Options'],
  technologies: ['Java', 'Spring Boot', 'React', 'AWS', 'Python', 'Kubernetes'],
  social: {
    linkedin: 'https://linkedin.com/company/infosys',
    twitter: 'https://twitter.com/infosys',
    github: 'https://github.com/infosys',
    youtube: 'https://youtube.com/infosys',
    blog: 'https://blogs.infosys.com',
  },
  recruiter: {
    name: 'Vishal Gupta',
    role: 'Technical Recruiter',
    email: 'vishal@infosys.com',
    avatar: 'VG',
    verified: true,
  },
  hiring: {
    roles: ['Backend Developer', 'Full Stack Developer', 'DevOps Engineer'],
    skills: ['Java', 'Spring Boot', 'React', 'AWS'],
    experience: ['0-2 Years', '3-5 Years'],
    minDevScore: 850,
  },
  settings: {
    allowFollow: true,
    showStatsPublicly: true,
    allowDirectMessages: true,
  },
  stats: {
    activeJobs: 12,
    activeJobsDelta: '+2 this week',
    totalApplications: 820,
    applicationsDelta: '+18% this month',
    candidatesHired: 45,
    hiredDelta: '+5 this month',
    avgHiringRating: 4.8,
  },
  talentInsights: {
    avgApplicantDevScore: 860,
    aiVerifiedPercent: 75,
    mentorVerifiedPercent: 40,
  },
  verificationStatus: 'verified',
  verificationChecks: [
    { id: 'email', label: 'Company Email Verified', verified: true },
    { id: 'domain', label: 'Domain Verified', verified: true },
    { id: 'business', label: 'Business Details Verified', verified: true },
    { id: 'recruiter', label: 'Recruiter Verified', verified: true },
  ],
  team: [
    { id: 't1', name: 'Vishal Gupta', role: 'Technical Recruiter', avatar: 'VG', isAdmin: true },
    { id: 't2', name: 'Rahul Sharma', role: 'HR Manager', avatar: 'RS' },
    { id: 't3', name: 'Anita Desai', role: 'Talent Acquisition Lead', avatar: 'AD' },
  ],
  jobOverviews: [
    { id: 'jo1', title: 'Java Backend Developer', applicants: 120, avgDevScore: 875, topMatchPercent: 96 },
    { id: 'jo2', title: 'Full Stack Engineer', applicants: 89, avgDevScore: 842, topMatchPercent: 91 },
    { id: 'jo3', title: 'Senior Java Developer', applicants: 42, avgDevScore: 910, topMatchPercent: 94 },
  ],
}
