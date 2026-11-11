import { useEffect, useRef, useState } from 'react'

import { Loader2, Save, X } from 'lucide-react'

import {

  useGetIntegrationSyncSettingsQuery,

  useUpdateIntegrationSyncSettingsMutation,

} from '../../../api/recruiterIntegrationsApi'

import {

  loadLocalIntegrationSyncSettings,

  saveLocalIntegrationSyncSettings,

} from '../../../lib/recruiterIntegrationSyncStore'

import type { RecruiterIntegrationView } from '../../../types/recruiterIntegration'

import {

  googleCalendarSyncSettingsToRecord,

  parseGoogleCalendarSyncSettings,

  parseTeamsSyncSettings,

  parseZoomSyncSettings,

  REMINDER_OPTIONS,

  validateGoogleCalendarSyncSettings,

  type GoogleCalendarSyncSettings,

  type TeamsSyncSettings,

  type ZoomSyncSettings,

  ZOOM_DURATION_OPTIONS,

} from '../../../types/integrationSyncSettings'

import { SettingsField, SettingsSelect } from './SettingsLayout'

import { SettingsToggle } from './SettingsControls'



type Props = {

  integration: RecruiterIntegrationView

  onClose: () => void

  onSaved: (integrationName: string) => void

  onSaveError: () => void

}



function SyncToggleRow({

  label,

  description,

  enabled,

  onChange,

}: {

  label: string

  description: string

  enabled: boolean

  onChange: (value: boolean) => void

}) {

  return (

    <div className="flex items-start justify-between gap-4 rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-4 py-3">

      <div className="min-w-0 flex-1">

        <p className="text-sm font-medium text-white">{label}</p>

        <p className="mt-1 text-[11px] leading-relaxed text-[#8b8ca8]">{description}</p>

      </div>

      <SettingsToggle enabled={enabled} onChange={onChange} size="sm" />

    </div>

  )

}



function GoogleCalendarSyncForm({

  settings,

  onChange,

  validationError,

}: {

  settings: GoogleCalendarSyncSettings

  onChange: (next: GoogleCalendarSyncSettings) => void

  validationError?: string | null

}) {

  function patch(partial: Partial<GoogleCalendarSyncSettings>) {

    onChange({ ...settings, ...partial })

  }



  return (

    <div className="space-y-3">

      <SyncToggleRow

        label="Automatically create interview events"

        description="When enabled, DevConnect creates Google Calendar events whenever interviews are scheduled"

        enabled={settings.autoCreateEvents}

        onChange={(autoCreateEvents) => patch({ autoCreateEvents })}

      />

      <SyncToggleRow

        label="Send calendar invites to candidates"

        description="Automatically send interview invites to candidate email"

        enabled={settings.sendCandidateInvite}

        onChange={(sendCandidateInvite) => patch({ sendCandidateInvite })}

      />

      <SyncToggleRow

        label="Attach Zoom/Teams meeting links automatically"

        description="Add connected video meeting links into calendar events"

        enabled={settings.attachMeetingLinks}

        onChange={(attachMeetingLinks) => patch({ attachMeetingLinks })}

      />

      <SyncToggleRow

        label="Sync interview changes"

        description="When interview time/date changes, update calendar automatically"

        enabled={settings.syncUpdates}

        onChange={(syncUpdates) => patch({ syncUpdates })}

      />

      <SyncToggleRow

        label="Remove cancelled interviews from calendar"

        description="Automatically remove cancelled interviews from your Google Calendar"

        enabled={settings.removeCancelledEvents}

        onChange={(removeCancelledEvents) => patch({ removeCancelledEvents })}

      />



      <div className="rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-4 py-3">

        <SettingsField label="Reminder Before Interview">

          <SettingsSelect

            value={settings.reminderTime}

            onChange={(value) => patch({ reminderTime: value as GoogleCalendarSyncSettings['reminderTime'] })}

            options={REMINDER_OPTIONS.map((option) => option.value)}

            labels={Object.fromEntries(REMINDER_OPTIONS.map((option) => [option.value, option.label]))}

          />

        </SettingsField>

      </div>



      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-4 py-3 sm:grid-cols-2">

        <SettingsField label="Working Availability Start">

          <input

            type="time"

            value={settings.workingStart}

            onChange={(e) => patch({ workingStart: e.target.value })}

            className="h-10 w-full rounded-lg border border-[#2d2e3e] bg-[#161722] px-3 text-sm text-white focus:border-[#6366f1] focus:outline-none"

          />

        </SettingsField>

        <SettingsField label="Working Availability End">

          <input

            type="time"

            value={settings.workingEnd}

            onChange={(e) => patch({ workingEnd: e.target.value })}

            className="h-10 w-full rounded-lg border border-[#2d2e3e] bg-[#161722] px-3 text-sm text-white focus:border-[#6366f1] focus:outline-none"

          />

        </SettingsField>

      </div>



      {validationError && (

        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">

          {validationError}

        </p>

      )}

    </div>

  )

}



function ZoomSyncForm({

  settings,

  onChange,

}: {

  settings: ZoomSyncSettings

  onChange: (next: ZoomSyncSettings) => void

}) {

  function patch(partial: Partial<ZoomSyncSettings>) {

    onChange({ ...settings, ...partial })

  }



  return (

    <div className="space-y-3">

      <SyncToggleRow

        label="Automatically create Zoom meeting"

        description="Generate a Zoom meeting whenever an interview is scheduled"

        enabled={settings.autoCreateMeeting}

        onChange={(autoCreateMeeting) => patch({ autoCreateMeeting })}

      />

      <SyncToggleRow

        label="Add Zoom link to interview"

        description="Attach the Zoom meeting link to the interview details"

        enabled={settings.addLinkToInterview}

        onChange={(addLinkToInterview) => patch({ addLinkToInterview })}

      />

      <SyncToggleRow

        label="Enable waiting room"

        description="Candidates wait in the lobby until the recruiter admits them"

        enabled={settings.enableWaitingRoom}

        onChange={(enableWaitingRoom) => patch({ enableWaitingRoom })}

      />

      <SyncToggleRow

        label="Enable meeting password"

        description="Protect interviews with an auto-generated meeting password"

        enabled={settings.enableMeetingPassword}

        onChange={(enableMeetingPassword) => patch({ enableMeetingPassword })}

      />

      <SyncToggleRow

        label="Enable recording"

        description="Allow cloud recording for interview sessions when permitted"

        enabled={settings.enableRecording}

        onChange={(enableRecording) => patch({ enableRecording })}

      />



      <div className="rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 px-4 py-3">

        <SettingsField label="Default Meeting Duration">

          <SettingsSelect

            value={String(settings.defaultDurationMinutes)}

            onChange={(value) =>

              patch({ defaultDurationMinutes: Number(value) as ZoomSyncSettings['defaultDurationMinutes'] })

            }

            options={ZOOM_DURATION_OPTIONS.map((option) => String(option.value))}

            labels={Object.fromEntries(

              ZOOM_DURATION_OPTIONS.map((option) => [String(option.value), option.label]),

            )}

          />

        </SettingsField>

      </div>

    </div>

  )

}



function TeamsSyncForm({

  settings,

  onChange,

}: {

  settings: TeamsSyncSettings

  onChange: (next: TeamsSyncSettings) => void

}) {

  function patch(partial: Partial<TeamsSyncSettings>) {

    onChange({ ...settings, ...partial })

  }



  return (

    <div className="space-y-3">

      <SyncToggleRow

        label="Create Teams meeting automatically"

        description="Generate a Microsoft Teams meeting when interviews are scheduled"

        enabled={settings.createMeetingAutomatically}

        onChange={(createMeetingAutomatically) => patch({ createMeetingAutomatically })}

      />

      <SyncToggleRow

        label="Add candidate to meeting"

        description="Include the candidate as a participant in the Teams meeting"

        enabled={settings.addCandidateToMeeting}

        onChange={(addCandidateToMeeting) => patch({ addCandidateToMeeting })}

      />

      <SyncToggleRow

        label="Send Teams invitation"

        description="Email Teams calendar invitations to candidates automatically"

        enabled={settings.sendTeamsInvitation}

        onChange={(sendTeamsInvitation) => patch({ sendTeamsInvitation })}

      />

      <SyncToggleRow

        label="Notify recruiter team"

        description="Alert your hiring team when a Teams interview is scheduled"

        enabled={settings.notifyRecruiterTeam}

        onChange={(notifyRecruiterTeam) => patch({ notifyRecruiterTeam })}

      />

      <SyncToggleRow

        label="Sync meeting updates"

        description="Update Teams meetings when interview details change"

        enabled={settings.syncMeetingUpdates}

        onChange={(syncMeetingUpdates) => patch({ syncMeetingUpdates })}

      />

    </div>

  )

}



function normalizeDraft(

  provider: RecruiterIntegrationView['provider'],

  draft: Record<string, unknown>,

): { payload: Record<string, unknown>; validationError: string | null } {

  if (provider === 'GOOGLE_CALENDAR') {

    const parsed = parseGoogleCalendarSyncSettings(draft)

    const validationError = validateGoogleCalendarSyncSettings(parsed)

    if (validationError) {

      return { payload: draft, validationError }

    }

    return { payload: googleCalendarSyncSettingsToRecord(parsed), validationError: null }

  }

  if (provider === 'ZOOM') {

    return { payload: parseZoomSyncSettings(draft), validationError: null }

  }

  return { payload: parseTeamsSyncSettings(draft), validationError: null }

}



export function IntegrationSyncSettingsModal({

  integration,

  onClose,

  onSaved,

  onSaveError,

}: Props) {

  const [draft, setDraft] = useState<Record<string, unknown>>(() =>

    loadLocalIntegrationSyncSettings(integration.provider),

  )

  const [saving, setSaving] = useState(false)

  const [validationError, setValidationError] = useState<string | null>(null)

  const hasUserEdited = useRef(false)



  const { data, isFetching } = useGetIntegrationSyncSettingsQuery(integration.provider)

  const [updateSettings] = useUpdateIntegrationSyncSettingsMutation()



  useEffect(() => {

    hasUserEdited.current = false

    setValidationError(null)

    setDraft(loadLocalIntegrationSyncSettings(integration.provider))

  }, [integration.provider])



  useEffect(() => {

    if (hasUserEdited.current || !data?.settings) return

    setDraft(data.settings)

    saveLocalIntegrationSyncSettings(integration.provider, data.settings)

  }, [data, integration.provider])



  function handleDraftChange(next: Record<string, unknown>) {

    hasUserEdited.current = true

    setValidationError(null)

    setDraft(next)

  }



  async function handleSave() {

    const { payload, validationError: error } = normalizeDraft(integration.provider, draft)

    if (error) {

      setValidationError(error)

      return

    }



    setSaving(true)

    setValidationError(null)



    try {

      saveLocalIntegrationSyncSettings(integration.provider, payload)



      try {

        await updateSettings({ provider: integration.provider, settings: payload }).unwrap()

      } catch {

        // Backend unavailable — localStorage already persisted above

      }



      onSaved(integration.name)

      onClose()

    } catch {

      onSaveError()

    } finally {

      setSaving(false)

    }

  }



  const title = `${integration.name} Sync Settings`



  return (

    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#2d2e3e] bg-[#161722] shadow-2xl">

        <div className="relative shrink-0 border-b border-[#2d2e3e]/60 p-6 pb-4">

          <button

            type="button"

            onClick={onClose}

            className="absolute right-4 top-4 rounded-lg p-1.5 text-[#8b8ca8] hover:bg-[#2d2e3e] hover:text-white"

          >

            <X size={18} />

          </button>

          <h2 className="pr-8 text-lg font-bold text-white">{title}</h2>

          <p className="mt-1 text-sm text-[#8b8ca8]">

            Configure how {integration.name} syncs with your interview workflow

          </p>

        </div>



        <div className="min-h-0 flex-1 overflow-y-auto p-6">

          {isFetching && !hasUserEdited.current && !data ? (

            <div className="flex items-center justify-center py-12 text-sm text-[#8b8ca8]">

              <Loader2 size={18} className="mr-2 animate-spin" />

              Loading sync settings...

            </div>

          ) : integration.provider === 'GOOGLE_CALENDAR' ? (

            <GoogleCalendarSyncForm

              settings={parseGoogleCalendarSyncSettings(draft)}

              onChange={(next) => handleDraftChange(next)}

              validationError={validationError}

            />

          ) : integration.provider === 'ZOOM' ? (

            <ZoomSyncForm

              settings={parseZoomSyncSettings(draft)}

              onChange={(next) => handleDraftChange(next)}

            />

          ) : (

            <TeamsSyncForm

              settings={parseTeamsSyncSettings(draft)}

              onChange={(next) => handleDraftChange(next)}

            />

          )}

        </div>



        <div className="flex shrink-0 gap-3 border-t border-[#2d2e3e]/60 p-6">

          <button

            type="button"

            onClick={onClose}

            disabled={saving}

            className="flex-1 rounded-xl border border-[#2d2e3e] bg-white/5 px-4 py-2.5 text-sm font-semibold text-[#8b8ca8] transition hover:text-white disabled:opacity-60"

          >

            Cancel

          </button>

          <button

            type="button"

            onClick={() => void handleSave()}

            disabled={saving}

            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"

          >

            {saving ? (

              <>

                <Loader2 size={16} className="animate-spin" />

                Saving...

              </>

            ) : (

              <>

                <Save size={16} />

                Save Sync Settings

              </>

            )}

          </button>

        </div>

      </div>

    </div>

  )

}


