export interface MentorApplicationAgreements {
  accurateDetails: boolean
  mentorGuidelines: boolean
  terms: boolean
  commission: boolean
}

export interface MentorApplicationFormData {
  fullName: string
  headline: string
  company: string
  designation: string
  experienceRange: string
  location: string
  profilePictureUrl: string
  bio: string
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string
  resumeUrl: string
  companyEmail: string
  govIdUrl: string
  skills: string[]
  categories: string[]
  languages: string[]
  audioPricePerMinuteCents: number
  videoPricePerMinuteCents: number
  mockInterviewPriceCents: number
  resumeReviewPriceCents: number
  instantCallEnabled: boolean
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  upiId: string
  panNumber: string
  agreements: MentorApplicationAgreements
}

export const EMPTY_MENTOR_APPLICATION: MentorApplicationFormData = {
  fullName: '',
  headline: '',
  company: '',
  designation: '',
  experienceRange: '',
  location: '',
  profilePictureUrl: '',
  bio: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  resumeUrl: '',
  companyEmail: '',
  govIdUrl: '',
  skills: [],
  categories: [],
  languages: [],
  audioPricePerMinuteCents: 1500,
  videoPricePerMinuteCents: 2500,
  mockInterviewPriceCents: 150000,
  resumeReviewPriceCents: 50000,
  instantCallEnabled: true,
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  upiId: '',
  panNumber: '',
  agreements: {
    accurateDetails: false,
    mentorGuidelines: false,
    terms: false,
    commission: false,
  },
}

export type OnboardingStepId =
  | 'basic'
  | 'verification'
  | 'expertise'
  | 'pricing'
  | 'payout'
  | 'agreements'
  | 'review'

export interface OnboardingStepMeta {
  id: OnboardingStepId
  label: string
  shortLabel: string
  description: string
  icon: string
}
