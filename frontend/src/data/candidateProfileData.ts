export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
export type VerificationType = 'ai' | 'mentor' | 'pending' | 'none'
export type NoticePeriod = 'Immediate' | '15 Days' | '30 Days' | '60 Days'
export type ProfessionalStatus = 'Student' | 'Working Professional' | 'Open to Work'
export type EmploymentType = 'Full Time' | 'Internship' | 'Remote' | 'Hybrid'
export type ResumeStatus = 'Verified' | 'Pending'

export interface CandidateSkill {
  id: string
  name: string
  level: SkillLevel
  score: number
  verification: VerificationType
  isPrimary: boolean
}

export interface CandidateProject {
  id: string
  name: string
  technologies: string[]
  description: string
  githubUrl: string
  liveUrl: string
  codeQuality: number
  architecture: number
  aiVerified: boolean
}

export interface WorkExperience {
  id: string
  company: string
  role: string
  startDate: string
  endDate: string
  currentlyWorking: boolean
  responsibilities: string
}

export interface Education {
  id: string
  college: string
  degree: string
  branch: string
  graduationYear: string
  cgpa: string
}

export interface Certification {
  id: string
  name: string
  organization: string
  issueDate: string
  url: string
}

export interface DevScoreMetrics {
  devScore: number
  rank: string
  aiInterviewScore: number
  codingScore: number
  mentorRating: number
  codeReviewScore: number
  projectScore: number
  communityContribution: number
  leaderboardRank: number
}

export interface RecruiterMatchPreview {
  hiringMatch: number
  strongAreas: string[]
  needsImprovement: string[]
}

export interface PrivacySettings {
  allowRecruiterDiscovery: boolean
  showSalary: boolean
  showPhone: boolean
}

export interface ResumeInfo {
  fileName: string
  uploadedAt: string
  status: ResumeStatus
  dataUrl?: string
  mimeType?: string
}

export interface CandidateExtendedProfile {
  photoDataUrl: string | null
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  currentLocation: string
  preferredLocation: string
  noticePeriod: NoticePeriod
  professionalStatus: ProfessionalStatus
  currentCompany: string
  currentRole: string
  totalExperience: string
  expectedSalary: string
  currentSalary: string
  employmentTypes: EmploymentType[]
  openToWork: boolean
  skills: CandidateSkill[]
  projects: CandidateProject[]
  experiences: WorkExperience[]
  education: Education[]
  certifications: Certification[]
  devScore: DevScoreMetrics
  recruiterPreview: RecruiterMatchPreview
  privacy: PrivacySettings
  resume: ResumeInfo | null
}

const STORAGE_KEY = 'dc_candidate_profile'

export const DEFAULT_CANDIDATE_PROFILE: CandidateExtendedProfile = {
  photoDataUrl: null,
  email: 'vishal.gupta@email.com',
  phone: '+91 98765 43210',
  dateOfBirth: '1998-06-15',
  gender: 'Male',
  currentLocation: 'Bangalore, India',
  preferredLocation: 'Bangalore, Hyderabad, Remote',
  noticePeriod: '30 Days',
  professionalStatus: 'Open to Work',
  currentCompany: 'ABC Technologies',
  currentRole: 'Software Developer',
  totalExperience: '2.3 Years',
  expectedSalary: '₹12 LPA',
  currentSalary: '₹8 LPA',
  employmentTypes: ['Full Time', 'Remote', 'Hybrid'],
  openToWork: true,
  skills: [
    { id: 's1', name: 'Java', level: 'Expert', score: 95, verification: 'ai', isPrimary: true },
    { id: 's2', name: 'Spring Boot', level: 'Advanced', score: 90, verification: 'mentor', isPrimary: true },
    { id: 's3', name: 'React', level: 'Advanced', score: 85, verification: 'ai', isPrimary: true },
    { id: 's4', name: 'AWS', level: 'Intermediate', score: 78, verification: 'pending', isPrimary: false },
    { id: 's5', name: 'Docker', level: 'Intermediate', score: 75, verification: 'pending', isPrimary: false },
    { id: 's6', name: 'SQL', level: 'Advanced', score: 88, verification: 'mentor', isPrimary: false },
  ],
  projects: [
    {
      id: 'p1',
      name: 'E-Commerce Backend System',
      technologies: ['Java', 'Spring Boot', 'React', 'PostgreSQL'],
      description: 'Scalable e-commerce platform with JWT auth, order management, and payment integration.',
      githubUrl: 'https://github.com/vishalgupta/ecommerce-backend',
      liveUrl: 'https://ecommerce-demo.devconnect.app',
      codeQuality: 92,
      architecture: 90,
      aiVerified: true,
    },
    {
      id: 'p2',
      name: 'Task Management API',
      technologies: ['Java', 'Spring Boot', 'MySQL', 'Docker'],
      description: 'RESTful API with role-based access, real-time notifications, and CI/CD pipeline.',
      githubUrl: 'https://github.com/vishalgupta/task-api',
      liveUrl: '',
      codeQuality: 88,
      architecture: 85,
      aiVerified: true,
    },
  ],
  experiences: [
    {
      id: 'e1',
      company: 'ABC Technologies',
      role: 'Software Developer',
      startDate: '2024-01',
      endDate: '',
      currentlyWorking: true,
      responsibilities: 'Built REST APIs, integrated payment gateways, optimized database queries, and mentored junior developers.',
    },
    {
      id: 'e2',
      company: 'TechStart Solutions',
      role: 'Java Intern',
      startDate: '2023-06',
      endDate: '2023-12',
      currentlyWorking: false,
      responsibilities: 'Developed microservices, wrote unit tests, and participated in code reviews.',
    },
  ],
  education: [
    {
      id: 'ed1',
      college: 'RV College of Engineering',
      degree: 'B.E.',
      branch: 'Computer Science',
      graduationYear: '2023',
      cgpa: '8.6',
    },
  ],
  certifications: [
    {
      id: 'c1',
      name: 'AWS Cloud Practitioner',
      organization: 'Amazon Web Services',
      issueDate: '2024-03',
      url: 'https://aws.amazon.com/certification',
    },
    {
      id: 'c2',
      name: 'Oracle Certified Java Programmer',
      organization: 'Oracle',
      issueDate: '2023-08',
      url: 'https://education.oracle.com',
    },
  ],
  devScore: {
    devScore: 912,
    rank: 'Top 3% Java Developers',
    aiInterviewScore: 91,
    codingScore: 884,
    mentorRating: 4.8,
    codeReviewScore: 90,
    projectScore: 92,
    communityContribution: 78,
    leaderboardRank: 24,
  },
  recruiterPreview: {
    hiringMatch: 95,
    strongAreas: ['Backend Development', 'API Design', 'Database'],
    needsImprovement: ['System Design'],
  },
  privacy: {
    allowRecruiterDiscovery: true,
    showSalary: false,
    showPhone: false,
  },
  resume: {
    fileName: 'Vishal_Gupta_Resume.pdf',
    uploadedAt: '2026-06-12',
    status: 'Verified',
  },
}

export function loadCandidateProfile(): CandidateExtendedProfile {
  const base = structuredClone(DEFAULT_CANDIDATE_PROFILE)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<CandidateExtendedProfile>
    return {
      ...base,
      ...parsed,
      skills: parsed.skills ?? base.skills,
      projects: parsed.projects ?? base.projects,
      experiences: (parsed.experiences ?? base.experiences).map((e) => ({
        ...e,
        endDate: e.currentlyWorking ? '' : e.endDate,
      })),
      education: parsed.education ?? base.education,
      certifications: parsed.certifications ?? base.certifications,
      devScore: { ...base.devScore, ...parsed.devScore },
      recruiterPreview: { ...base.recruiterPreview, ...parsed.recruiterPreview },
      privacy: { ...base.privacy, ...parsed.privacy },
    }
  } catch {
    return base
  }
}

export function saveCandidateProfile(profile: CandidateExtendedProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function calcProfileCompletion(
  api: {
    displayName?: string
    role?: string
    bio?: string
    location?: string
    skills?: string[]
    githubUrl?: string
  },
  ext: CandidateExtendedProfile,
): number {
  const checks = [
    !!api.displayName,
    !!api.role,
    !!api.bio,
    !!ext.photoDataUrl || !!api.displayName,
    !!ext.resume,
    !!ext.email,
    !!ext.phone,
    !!ext.currentLocation,
    ext.skills.length >= 3,
    ext.projects.length >= 1,
    ext.experiences.length >= 1,
    ext.education.length >= 1,
    !!api.githubUrl,
    ext.devScore.devScore > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
