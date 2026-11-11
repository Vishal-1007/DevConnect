import {
  DEFAULT_RECRUITER_SETTINGS,
  type RecruiterSettingsData,
} from '../data/recruiterSettingsData'

const STORAGE_KEY = 'devconnect-recruiter-settings'

function normalizeSettings(raw: Partial<RecruiterSettingsData> | null): RecruiterSettingsData {
  if (!raw) return DEFAULT_RECRUITER_SETTINGS

  return {
    team: {
      ...DEFAULT_RECRUITER_SETTINGS.team,
      ...raw.team,
      members: raw.team?.members ?? DEFAULT_RECRUITER_SETTINGS.team.members,
    },
    account: {
      ...DEFAULT_RECRUITER_SETTINGS.account,
      ...raw.account,
    },
    security: {
      ...DEFAULT_RECRUITER_SETTINGS.security,
      ...raw.security,
      loginActivity:
        raw.security?.loginActivity ?? DEFAULT_RECRUITER_SETTINGS.security.loginActivity,
    },
    hiringPrefs: {
      ...DEFAULT_RECRUITER_SETTINGS.hiringPrefs,
      ...raw.hiringPrefs,
      skillsMatchThreshold:
        raw.hiringPrefs?.skillsMatchThreshold ??
        DEFAULT_RECRUITER_SETTINGS.hiringPrefs.skillsMatchThreshold,
    },
  }
}

export function loadRecruiterSettings(): RecruiterSettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_RECRUITER_SETTINGS
    return normalizeSettings(JSON.parse(raw) as Partial<RecruiterSettingsData>)
  } catch {
    return DEFAULT_RECRUITER_SETTINGS
  }
}

export function saveRecruiterSettings(data: RecruiterSettingsData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function updateRecruiterSettings(
  current: RecruiterSettingsData,
  patch: Partial<RecruiterSettingsData>,
): RecruiterSettingsData {
  const next = normalizeSettings({ ...current, ...patch })
  saveRecruiterSettings(next)
  return next
}
