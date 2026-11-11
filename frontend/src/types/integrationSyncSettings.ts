import type { RecruiterIntegrationProvider } from './recruiterIntegration'

export type ReminderTime = '10_MINUTES' | '30_MINUTES' | '1_HOUR' | '1_DAY'

export type GoogleCalendarSyncSettings = {
  autoCreateEvents: boolean
  sendCandidateInvite: boolean
  attachMeetingLinks: boolean
  syncUpdates: boolean
  removeCancelledEvents: boolean
  reminderTime: ReminderTime
  workingStart: string
  workingEnd: string
}

export type ZoomSyncSettings = {
  autoCreateMeeting: boolean
  addLinkToInterview: boolean
  enableWaitingRoom: boolean
  enableMeetingPassword: boolean
  enableRecording: boolean
  defaultDurationMinutes: 30 | 45 | 60
}

export type TeamsSyncSettings = {
  createMeetingAutomatically: boolean
  addCandidateToMeeting: boolean
  sendTeamsInvitation: boolean
  notifyRecruiterTeam: boolean
  syncMeetingUpdates: boolean
}

export type IntegrationSyncSettings =
  | GoogleCalendarSyncSettings
  | ZoomSyncSettings
  | TeamsSyncSettings

export type IntegrationSyncSettingsResponse = {
  provider: RecruiterIntegrationProvider
  settings: Record<string, unknown>
}

export const REMINDER_OPTIONS: { value: ReminderTime; label: string }[] = [
  { value: '10_MINUTES', label: '10 minutes' },
  { value: '30_MINUTES', label: '30 minutes' },
  { value: '1_HOUR', label: '1 hour' },
  { value: '1_DAY', label: '1 day' },
]

export const ZOOM_DURATION_OPTIONS: { value: 30 | 45 | 60; label: string }[] = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
]

export function defaultGoogleCalendarSyncSettings(): GoogleCalendarSyncSettings {
  return {
    autoCreateEvents: true,
    sendCandidateInvite: true,
    attachMeetingLinks: true,
    syncUpdates: true,
    removeCancelledEvents: true,
    reminderTime: '30_MINUTES',
    workingStart: '09:00',
    workingEnd: '18:00',
  }
}

export function defaultZoomSyncSettings(): ZoomSyncSettings {
  return {
    autoCreateMeeting: true,
    addLinkToInterview: true,
    enableWaitingRoom: true,
    enableMeetingPassword: true,
    enableRecording: false,
    defaultDurationMinutes: 45,
  }
}

export function defaultTeamsSyncSettings(): TeamsSyncSettings {
  return {
    createMeetingAutomatically: true,
    addCandidateToMeeting: true,
    sendTeamsInvitation: true,
    notifyRecruiterTeam: true,
    syncMeetingUpdates: true,
  }
}

export function defaultSyncSettingsForProvider(
  provider: RecruiterIntegrationProvider,
): Record<string, unknown> {
  switch (provider) {
    case 'GOOGLE_CALENDAR':
      return defaultGoogleCalendarSyncSettings()
    case 'ZOOM':
      return defaultZoomSyncSettings()
    case 'MICROSOFT_TEAMS':
      return defaultTeamsSyncSettings()
  }
}

export function parseGoogleCalendarSyncSettings(
  settings: Record<string, unknown>,
): GoogleCalendarSyncSettings {
  const defaults = defaultGoogleCalendarSyncSettings()
  const reminderTime = settings.reminderTime as ReminderTime
  const validReminder = REMINDER_OPTIONS.some((option) => option.value === reminderTime)
    ? reminderTime
    : defaults.reminderTime

  return {
    autoCreateEvents: Boolean(settings.autoCreateEvents ?? defaults.autoCreateEvents),
    sendCandidateInvite: Boolean(settings.sendCandidateInvite ?? defaults.sendCandidateInvite),
    attachMeetingLinks: Boolean(settings.attachMeetingLinks ?? defaults.attachMeetingLinks),
    syncUpdates: Boolean(settings.syncUpdates ?? defaults.syncUpdates),
    removeCancelledEvents: Boolean(settings.removeCancelledEvents ?? defaults.removeCancelledEvents),
    reminderTime: validReminder,
    workingStart: String(settings.workingStart ?? defaults.workingStart),
    workingEnd: String(settings.workingEnd ?? defaults.workingEnd),
  }
}

export function validateGoogleCalendarSyncSettings(
  settings: GoogleCalendarSyncSettings,
): string | null {
  if (!settings.workingStart || !settings.workingEnd) {
    return 'Please set working availability start and end times'
  }
  if (settings.workingStart >= settings.workingEnd) {
    return 'Working availability start time must be before end time'
  }
  return null
}

export function googleCalendarSyncSettingsToRecord(
  settings: GoogleCalendarSyncSettings,
): Record<string, unknown> {
  return { ...settings }
}

export function parseZoomSyncSettings(settings: Record<string, unknown>): ZoomSyncSettings {
  const defaults = defaultZoomSyncSettings()
  const duration = Number(settings.defaultDurationMinutes ?? defaults.defaultDurationMinutes)
  return {
    autoCreateMeeting: Boolean(settings.autoCreateMeeting ?? defaults.autoCreateMeeting),
    addLinkToInterview: Boolean(settings.addLinkToInterview ?? defaults.addLinkToInterview),
    enableWaitingRoom: Boolean(settings.enableWaitingRoom ?? defaults.enableWaitingRoom),
    enableMeetingPassword: Boolean(settings.enableMeetingPassword ?? defaults.enableMeetingPassword),
    enableRecording: Boolean(settings.enableRecording ?? defaults.enableRecording),
    defaultDurationMinutes: ([30, 45, 60] as const).includes(duration as 30 | 45 | 60)
      ? (duration as 30 | 45 | 60)
      : defaults.defaultDurationMinutes,
  }
}

export function parseTeamsSyncSettings(settings: Record<string, unknown>): TeamsSyncSettings {
  const defaults = defaultTeamsSyncSettings()
  return {
    createMeetingAutomatically: Boolean(
      settings.createMeetingAutomatically ?? defaults.createMeetingAutomatically,
    ),
    addCandidateToMeeting: Boolean(settings.addCandidateToMeeting ?? defaults.addCandidateToMeeting),
    sendTeamsInvitation: Boolean(settings.sendTeamsInvitation ?? defaults.sendTeamsInvitation),
    notifyRecruiterTeam: Boolean(settings.notifyRecruiterTeam ?? defaults.notifyRecruiterTeam),
    syncMeetingUpdates: Boolean(settings.syncMeetingUpdates ?? defaults.syncMeetingUpdates),
  }
}
