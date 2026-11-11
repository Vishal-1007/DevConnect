import {
  DEFAULT_COMPANY_PROFILE,
  type CompanyProfileData,
} from '../data/recruiterCompanyProfileData'

const STORAGE_KEY = 'dc_recruiter_company_profile'

export function loadCompanyProfile(): CompanyProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw
      ? { ...DEFAULT_COMPANY_PROFILE, ...(JSON.parse(raw) as Partial<CompanyProfileData>) }
      : structuredClone(DEFAULT_COMPANY_PROFILE)
  } catch {
    return structuredClone(DEFAULT_COMPANY_PROFILE)
  }
}

export function saveCompanyProfile(profile: CompanyProfileData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function computeProfileCompletion(profile: CompanyProfileData): number {
  const checks = [
    !!profile.name,
    !!profile.about,
    !!profile.tagline,
    !!profile.website,
    !!profile.emailDomain,
    !!profile.industry,
    !!profile.social.linkedin,
    profile.hiring.roles.length > 0,
    profile.hiring.skills.length > 0,
  ]
  const done = checks.filter(Boolean).length
  return Math.round((done / checks.length) * 100)
}

export function updateCompanyProfile(
  profile: CompanyProfileData,
  patch: Partial<CompanyProfileData>,
): CompanyProfileData {
  const next = { ...profile, ...patch }
  next.profileCompletion = computeProfileCompletion(next)
  saveCompanyProfile(next)
  return next
}
