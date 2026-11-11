export type SettingsTabId = 'account' | 'team' | 'security' | 'integrations' | 'preferences'

export type TeamRole = 'Admin' | 'Recruiter' | 'Viewer'

export type TeamMember = {
  id: string
  name: string
  role: string
  accessRole: TeamRole
  avatar: string
  email: string
}

export type LoginActivity = {
  id: string
  device: string
  location: string
  date: string
}

export type RecruiterSettingsData = {
  team: {
    members: TeamMember[]
  }
  account: {
    name: string
    email: string
    phone: string
    designation: string
    company: string
    avatar: string
    photoUrl?: string | null
  }
  security: {
    twoFactorEnabled: boolean
    loginActivity: LoginActivity[]
  }
  hiringPrefs: {
    minDevScore: number
    preferredSkills: string[]
    preferredExperience: string[]
    autoShortlistEnabled: boolean
    autoShortlistThreshold: number
    skillsMatchThreshold: number
  }
}

export const SKILL_OPTIONS = ['Java', 'Spring Boot', 'React', 'AWS', 'Python', 'Node.js']
export const EXPERIENCE_OPTIONS = ['Freshers', '0-2 Years', '3-5 Years', '5+ Years']

export const TEAM_ROLE_PERMISSIONS: Record<
  TeamRole,
  { title: string; permissions: string[] }
> = {
  Admin: {
    title: 'Admin',
    permissions: ['Manage billing', 'Invite members', 'Post jobs', 'Manage candidates'],
  },
  Recruiter: {
    title: 'Recruiter',
    permissions: ['Post jobs', 'View candidates', 'Schedule interviews'],
  },
  Viewer: {
    title: 'Viewer',
    permissions: ['View candidates only'],
  },
}

export function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export const DEFAULT_RECRUITER_SETTINGS: RecruiterSettingsData = {
  team: {
    members: [
      {
        id: '1',
        name: 'Vishal Gupta',
        role: 'Technical Recruiter',
        accessRole: 'Admin',
        avatar: 'VG',
        email: 'vishal@infosys.com',
      },
      {
        id: '2',
        name: 'Rahul Sharma',
        role: 'HR Recruiter',
        accessRole: 'Recruiter',
        avatar: 'RS',
        email: 'rahul@infosys.com',
      },
      {
        id: '3',
        name: 'Sneha Iyer',
        role: 'Talent Acquisition',
        accessRole: 'Viewer',
        avatar: 'SI',
        email: 'sneha@infosys.com',
      },
    ],
  },
  account: {
    name: 'Vishal Gupta',
    email: 'vishal@infosys.com',
    phone: '+91 98765 43210',
    designation: 'Technical Recruiter',
    company: 'Infosys',
    avatar: 'VG',
    photoUrl: null,
  },
  security: {
    twoFactorEnabled: true,
    loginActivity: [
      { id: '1', device: 'Chrome on Windows', location: 'Bangalore, India', date: 'Today, 10:30 PM' },
      { id: '2', device: 'Safari on iPhone', location: 'Bangalore, India', date: '25 May 2026, 6:15 PM' },
      { id: '3', device: 'Chrome on MacOS', location: 'Mumbai, India', date: '22 May 2026, 2:40 PM' },
    ],
  },
  hiringPrefs: {
    minDevScore: 850,
    preferredSkills: ['Java', 'Spring Boot', 'React', 'AWS'],
    preferredExperience: ['0-2 Years', '3-5 Years'],
    autoShortlistEnabled: true,
    autoShortlistThreshold: 900,
    skillsMatchThreshold: 80,
  },
}
