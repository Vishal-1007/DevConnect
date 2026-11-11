import {
  DEFAULT_RECRUITER_BILLING,
  type RecruiterBillingData,
} from '../data/recruiterBillingData'

const STORAGE_KEY = 'devconnect-recruiter-billing'

export function loadRecruiterBilling(): RecruiterBillingData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw
      ? { ...DEFAULT_RECRUITER_BILLING, ...(JSON.parse(raw) as Partial<RecruiterBillingData>) }
      : DEFAULT_RECRUITER_BILLING
  } catch {
    return DEFAULT_RECRUITER_BILLING
  }
}

export function saveRecruiterBilling(data: RecruiterBillingData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
