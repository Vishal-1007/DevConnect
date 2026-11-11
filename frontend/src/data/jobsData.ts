export type JobTab = 'all' | 'recommended' | 'remote' | 'internship'

export interface JobMatchBreakdown {
  technicalSkills: number
  projects: number
  aiInterviews: number
  mentorReviews: number
}

export interface JobListing {
  id: string
  title: string
  company: string
  companyRating: number
  location: string
  experience: string
  jobType: string
  skills: string[]
  matchPercent: number
  matchReasons: string[]
  matchBreakdown: JobMatchBreakdown
  salaryRange: string
  description: string
  responsibilities: string[]
  minDevScore: number
  postedAt: string
  recommended: boolean
  remote: boolean
  internship: boolean
  role: string
}

export const JOB_ROLES = [
  'All Roles',
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Engineer',
  'Mobile Developer',
] as const

export const JOB_LOCATIONS = [
  'All Locations',
  'Bangalore, India',
  'Hyderabad, India',
  'Pune, India',
  'Mumbai, India',
  'Remote',
  'Chennai, India',
] as const

export const EXPERIENCE_LEVELS = [
  'All Experience',
  'Fresher',
  '0-1 Years',
  '1-3 Years',
  '3-5 Years',
  '5+ Years',
] as const

export const JOB_TYPES = [
  'All Types',
  'Full-time',
  'Internship',
  'Remote',
  'Hybrid',
  'Part-time',
] as const

export const SKILL_OPTIONS = [
  'All Skills',
  'Java',
  'Spring Boot',
  'React',
  'TypeScript',
  'AWS',
  'PostgreSQL',
  'Docker',
  'Kubernetes',
  'Node.js',
] as const

export const DEV_SCORE_OPTIONS = [
  { label: 'Any DevScore', value: 0 },
  { label: '600+', value: 600 },
  { label: '700+', value: 700 },
  { label: '800+', value: 800 },
  { label: '900+', value: 900 },
] as const

export const APPLICATION_STATS = {
  total: 12,
  inReview: 5,
  shortlisted: 3,
  interviewScheduled: 2,
  rejected: 2,
  withdrawn: 0,
} as const

export const RECRUITER_VISIBILITY = {
  profileViews: 156,
  recruiterSearches: 45,
  interviewInvites: 8,
} as const

export const USER_DEV_SCORE = 912

export const DUMMY_JOBS: JobListing[] = [
  {
    id: 'job-1',
    title: 'Java Backend Developer',
    company: 'LinkedIn',
    companyRating: 4.4,
    location: 'Bangalore, India',
    experience: '2-4 Yrs',
    jobType: 'Full-time',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'AWS', 'Microservices'],
    matchPercent: 95,
    matchReasons: [
      'Java skill verified',
      'AI interview score 91%',
      'Mentor rating 4.8/5',
    ],
    matchBreakdown: { technicalSkills: 92, projects: 88, aiInterviews: 91, mentorReviews: 4.8 },
    salaryRange: '₹18L – ₹28L / year',
    description:
      'Join our platform engineering team building scalable backend services that power millions of professional connections worldwide.',
    responsibilities: [
      'Design and implement RESTful APIs with Spring Boot',
      'Optimize database queries and caching layers',
      'Collaborate with frontend teams on API contracts',
      'Participate in code reviews and system design discussions',
    ],
    minDevScore: 750,
    postedAt: '2h ago',
    recommended: true,
    remote: false,
    internship: false,
    role: 'Backend Developer',
  },
  {
    id: 'job-2',
    title: 'Software Engineer (Backend)',
    company: 'Paytm',
    companyRating: 4.1,
    location: 'Noida, India',
    experience: '1-3 Yrs',
    jobType: 'Full-time',
    skills: ['Java', 'Spring Boot', 'Kafka', 'Redis', 'MySQL'],
    matchPercent: 91,
    matchReasons: [
      'Spring Boot projects verified',
      'DevScore 912 exceeds requirement',
      'Strong system design score',
    ],
    matchBreakdown: { technicalSkills: 90, projects: 85, aiInterviews: 88, mentorReviews: 4.6 },
    salaryRange: '₹14L – ₹22L / year',
    description:
      'Build high-throughput payment processing systems handling millions of transactions daily in a fast-paced fintech environment.',
    responsibilities: [
      'Develop payment gateway integrations',
      'Write unit and integration tests',
      'Monitor production systems and fix incidents',
      'Work with DevOps on CI/CD pipelines',
    ],
    minDevScore: 700,
    postedAt: '5h ago',
    recommended: true,
    remote: false,
    internship: false,
    role: 'Backend Developer',
  },
  {
    id: 'job-3',
    title: 'Full Stack Developer',
    company: 'Swiggy',
    companyRating: 4.3,
    location: 'Bangalore, India',
    experience: '2-5 Yrs',
    jobType: 'Hybrid',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
    matchPercent: 87,
    matchReasons: [
      'React + Node.js stack match',
      '3 portfolio projects aligned',
      'AI interview score 84%',
    ],
    matchBreakdown: { technicalSkills: 85, projects: 90, aiInterviews: 84, mentorReviews: 4.5 },
    salaryRange: '₹16L – ₹26L / year',
    description:
      'Work on consumer-facing features for India\'s leading food delivery platform. Full ownership from design to deployment.',
    responsibilities: [
      'Build responsive React dashboards',
      'Create Node.js microservices',
      'Implement real-time order tracking features',
      'Mentor junior developers',
    ],
    minDevScore: 720,
    postedAt: '1d ago',
    recommended: true,
    remote: false,
    internship: false,
    role: 'Full Stack Developer',
  },
  {
    id: 'job-4',
    title: 'Frontend Developer (React)',
    company: 'Google',
    companyRating: 4.8,
    location: 'Hyderabad, India',
    experience: '1-3 Yrs',
    jobType: 'Full-time',
    skills: ['React', 'TypeScript', 'CSS', 'Webpack', 'Testing'],
    matchPercent: 82,
    matchReasons: [
      'React skill verified',
      'Code review score 89%',
      'Community contributions noted',
    ],
    matchBreakdown: { technicalSkills: 80, projects: 78, aiInterviews: 86, mentorReviews: 4.7 },
    salaryRange: '₹20L – ₹35L / year',
    description:
      'Develop internal tools and dashboards used by thousands of Googlers. Focus on performance, accessibility, and developer experience.',
    responsibilities: [
      'Build reusable React component libraries',
      'Optimize bundle size and load times',
      'Write comprehensive test suites',
      'Collaborate with UX designers',
    ],
    minDevScore: 800,
    postedAt: '1d ago',
    recommended: false,
    remote: false,
    internship: false,
    role: 'Frontend Developer',
  },
  {
    id: 'job-5',
    title: 'DevOps Engineer',
    company: 'Amazon',
    companyRating: 4.5,
    location: 'Chennai, India',
    experience: '3-5 Yrs',
    jobType: 'Full-time',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    matchPercent: 76,
    matchReasons: [
      'AWS certification path started',
      'Docker projects on profile',
      'DevScore meets threshold',
    ],
    matchBreakdown: { technicalSkills: 72, projects: 70, aiInterviews: 78, mentorReviews: 4.3 },
    salaryRange: '₹18L – ₹30L / year',
    description:
      'Manage cloud infrastructure for e-commerce services at scale. Automate deployments and ensure 99.99% uptime.',
    responsibilities: [
      'Maintain Kubernetes clusters on AWS EKS',
      'Build Terraform modules for infrastructure',
      'Set up monitoring and alerting',
      'Lead incident response procedures',
    ],
    minDevScore: 780,
    postedAt: '2d ago',
    recommended: false,
    remote: false,
    internship: false,
    role: 'DevOps Engineer',
  },
  {
    id: 'job-6',
    title: 'Backend Engineer (Remote)',
    company: 'Atlassian',
    companyRating: 4.6,
    location: 'Remote',
    experience: '2-4 Yrs',
    jobType: 'Remote',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'GraphQL', 'AWS'],
    matchPercent: 93,
    matchReasons: [
      'Remote-ready DevScore profile',
      'Java + Spring verified',
      'AI interview score 90%',
    ],
    matchBreakdown: { technicalSkills: 91, projects: 86, aiInterviews: 90, mentorReviews: 4.8 },
    salaryRange: '₹22L – ₹32L / year',
    description:
      'Remote-first role building collaboration tools used by teams worldwide. Async communication and strong documentation skills valued.',
    responsibilities: [
      'Develop Jira/Confluence backend features',
      'Design GraphQL APIs',
      'Participate in global on-call rotation',
      'Write technical RFCs for new features',
    ],
    minDevScore: 760,
    postedAt: '3h ago',
    recommended: true,
    remote: true,
    internship: false,
    role: 'Backend Developer',
  },
  {
    id: 'job-7',
    title: 'Software Engineering Intern',
    company: 'Microsoft',
    companyRating: 4.7,
    location: 'Hyderabad, India',
    experience: 'Fresher',
    jobType: 'Internship',
    skills: ['Java', 'C#', 'Algorithms', 'Data Structures', 'Git'],
    matchPercent: 89,
    matchReasons: [
      'Strong coding challenge scores',
      'DevScore 912 — top 10%',
      'Mock interview feedback excellent',
    ],
    matchBreakdown: { technicalSkills: 88, projects: 82, aiInterviews: 92, mentorReviews: 4.9 },
    salaryRange: '₹80K / month',
    description:
      '12-week internship program with mentorship from senior engineers. High conversion rate to full-time offers.',
    responsibilities: [
      'Complete assigned feature projects',
      'Attend weekly mentorship sessions',
      'Present final project to leadership',
      'Participate in team standups and reviews',
    ],
    minDevScore: 650,
    postedAt: '6h ago',
    recommended: true,
    remote: false,
    internship: true,
    role: 'Backend Developer',
  },
  {
    id: 'job-8',
    title: 'React Native Developer',
    company: 'Flipkart',
    companyRating: 4.2,
    location: 'Bangalore, India',
    experience: '1-3 Yrs',
    jobType: 'Full-time',
    skills: ['React', 'TypeScript', 'Mobile', 'Redux', 'REST APIs'],
    matchPercent: 79,
    matchReasons: [
      'React expertise verified',
      'Mobile project in portfolio',
      'Peer code review rating high',
    ],
    matchBreakdown: { technicalSkills: 78, projects: 80, aiInterviews: 79, mentorReviews: 4.4 },
    salaryRange: '₹12L – ₹20L / year',
    description:
      'Build mobile shopping experiences for millions of users. Work on performance optimization and offline-first features.',
    responsibilities: [
      'Develop React Native screens',
      'Integrate with backend REST APIs',
      'Fix bugs and improve app performance',
      'Write unit tests for components',
    ],
    minDevScore: 680,
    postedAt: '3d ago',
    recommended: false,
    remote: false,
    internship: false,
    role: 'Frontend Developer',
  },
  {
    id: 'job-9',
    title: 'Data Engineer Intern',
    company: 'Razorpay',
    companyRating: 4.3,
    location: 'Bangalore, India',
    experience: 'Fresher',
    jobType: 'Internship',
    skills: ['Python', 'SQL', 'Spark', 'AWS', 'ETL'],
    matchPercent: 71,
    matchReasons: [
      'SQL skills verified',
      'Analytics project completed',
      'Growing DevScore trajectory',
    ],
    matchBreakdown: { technicalSkills: 68, projects: 74, aiInterviews: 72, mentorReviews: 4.2 },
    salaryRange: '₹50K / month',
    description:
      'Learn data pipeline engineering in a high-growth fintech. Work with senior data engineers on production ETL jobs.',
    responsibilities: [
      'Assist in building data pipelines',
      'Write SQL queries for reporting',
      'Document data schemas',
      'Support data quality checks',
    ],
    minDevScore: 600,
    postedAt: '4d ago',
    recommended: false,
    remote: false,
    internship: true,
    role: 'Data Engineer',
  },
  {
    id: 'job-10',
    title: 'Senior Backend Engineer',
    company: 'Uber',
    companyRating: 4.4,
    location: 'Remote',
    experience: '3-5 Yrs',
    jobType: 'Remote',
    skills: ['Java', 'Spring Boot', 'Kafka', 'Microservices', 'AWS'],
    matchPercent: 88,
    matchReasons: [
      'Microservices project experience',
      'AI system design score 87%',
      'Mentor endorsement received',
    ],
    matchBreakdown: { technicalSkills: 86, projects: 84, aiInterviews: 87, mentorReviews: 4.7 },
    salaryRange: '₹28L – ₹42L / year',
    description:
      'Lead backend development for ride-sharing platform services. Architect scalable solutions for global traffic patterns.',
    responsibilities: [
      'Own microservice architecture decisions',
      'Mentor mid-level engineers',
      'Drive performance optimization initiatives',
      'Lead technical design reviews',
    ],
    minDevScore: 850,
    postedAt: '1d ago',
    recommended: true,
    remote: true,
    internship: false,
    role: 'Backend Developer',
  },
]
