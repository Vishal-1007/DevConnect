import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { RecruiterSettingsData, SettingsTabId } from '../../../data/recruiterSettingsData'
import {
  loadRecruiterSettings,
  updateRecruiterSettings,
} from '../../../lib/recruiterSettingsStore'
import { useRecruiterIntegrations } from '../../../hooks/useRecruiterIntegrations'
import { useTestIntegrationConnectionMutation } from '../../../api/recruiterIntegrationsApi'
import { parseIntegrationApiError, mapOAuthProviderError } from '../../../lib/integrationOAuthConfig'
import {
  consumeOAuthCallbackResult,
  getOAuthSuccessMessage,
  parseOAuthCallbackParams,
} from '../../../lib/oauthCallback'
import { SettingsTabs } from './SettingsTabs'
import { TeamAccess } from './TeamAccess'
import { AccountSettings } from './AccountSettings'
import { SecuritySettings } from './SecuritySettings'
import { IntegrationSettings } from './IntegrationSettings'
import { IntegrationManageModal } from './IntegrationManageModal'
import { IntegrationSyncSettingsModal } from './IntegrationSyncSettingsModal'
import { HiringPreferences } from './HiringPreferences'
import type { RecruiterIntegrationView } from '../../../types/recruiterIntegration'

const GOOGLE_PERMISSIONS = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'email',
  'profile',
]

const ZOOM_PERMISSIONS = ['user:read:admin', 'meeting:write:meeting', 'meeting:read:meeting']

const TEAMS_PERMISSIONS = [
  'User.Read',
  'OnlineMeetings.ReadWrite',
  'Calendars.ReadWrite',
  'email',
  'profile',
  'offline_access',
]

export function RecruiterSettings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [settings, setSettings] = useState<RecruiterSettingsData>(() => loadRecruiterSettings())
  const [activeTab, setActiveTab] = useState<SettingsTabId>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'integrations' || tab === 'account' || tab === 'team' || tab === 'security' || tab === 'preferences') {
      return tab
    }
    return 'account'
  })
  const [toast, setToast] = useState<string | null>(null)
  const [manageIntegration, setManageIntegration] = useState<RecruiterIntegrationView | null>(null)
  const [syncSettingsIntegration, setSyncSettingsIntegration] =
    useState<RecruiterIntegrationView | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)

  const {
    integrations,
    loading: integrationsLoading,
    connectingProvider,
    disconnecting,
    connect,
    disconnect,
    refetchIntegrations,
  } = useRecruiterIntegrations()

  const [testIntegrationConnection] = useTestIntegrationConnectionMutation()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    refetchIntegrations()
  }, [refetchIntegrations])

  useEffect(() => {
    const stored = consumeOAuthCallbackResult()
    const oauth = searchParams.get('oauth')
    const provider = searchParams.get('provider') ?? stored?.provider
    const messageParam = searchParams.get('message')

    const parsed =
      oauth || messageParam
        ? parseOAuthCallbackParams(searchParams)
        : stored

    if (!parsed || (!oauth && !stored)) return

    if (parsed.status === 'success') {
      showToast(parsed.message ?? getOAuthSuccessMessage(provider))
      refetchIntegrations()
    } else {
      showToast(
        mapOAuthProviderError(
          provider,
          parsed.message ?? parsed.error ?? 'Integration connection failed',
          parsed.details,
        ),
      )
    }

    setActiveTab('integrations')

    if (oauth || searchParams.get('message') || searchParams.get('provider') || searchParams.get('error')) {
      const next = new URLSearchParams(searchParams)
      next.delete('oauth')
      next.delete('success')
      next.delete('provider')
      next.delete('message')
      next.delete('error')
      next.delete('details')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, refetchIntegrations])

  function persist(patch: Partial<RecruiterSettingsData>) {
    setSettings((prev) => updateRecruiterSettings(prev, patch))
  }

  async function handleConnect(integration: RecruiterIntegrationView) {
    showToast(`Connecting to ${integration.name}...`)
    try {
      const message = await connect(integration)
      showToast(message ?? `${integration.name} connected successfully`)
    } catch (err) {
      showToast(parseIntegrationApiError(err, mapOAuthProviderError(integration.provider, 'Connection failed', undefined)))
    }
  }

  async function handleDisconnect() {
    if (!manageIntegration) return
    try {
      await disconnect(manageIntegration.provider)
      showToast(`${manageIntegration.name} disconnected`)
      setManageIntegration(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to disconnect ${manageIntegration.name}`
      showToast(msg)
    }
  }

  async function handleIntegrationAction(action: string) {
    if (!manageIntegration) return

    if (action === 'Test Connection') {
      setTestingConnection(true)
      try {
        const result = await testIntegrationConnection(manageIntegration.provider).unwrap()
        showToast(result.message || `${manageIntegration.name} connection working`)
      } catch (err) {
        showToast(
          parseIntegrationApiError(err, `Failed to verify ${manageIntegration.name} connection`),
        )
      } finally {
        setTestingConnection(false)
      }
      return
    }

    if (action === 'Permissions') {
      const permissions =
        manageIntegration.provider === 'GOOGLE_CALENDAR'
          ? GOOGLE_PERMISSIONS
          : manageIntegration.provider === 'ZOOM'
            ? ZOOM_PERMISSIONS
            : TEAMS_PERMISSIONS
      showToast(`Granted permissions: ${permissions.join(', ')}`)
    }
  }

  function renderTab() {
    switch (activeTab) {
      case 'team':
        return (
          <TeamAccess
            team={settings.team}
            onChange={(team) => persist({ team })}
            onInvite={() => showToast('Invite sent to new team member')}
            onRemove={(id) => {
              persist({
                team: {
                  members: settings.team.members.filter((m) => m.id !== id),
                },
              })
              showToast('Team member removed')
            }}
          />
        )
      case 'account':
        return (
          <AccountSettings
            account={settings.account}
            onChange={(account) => persist({ account })}
            onSave={() => showToast('Profile updated successfully')}
          />
        )
      case 'security':
        return (
          <SecuritySettings
            security={settings.security}
            onChange={(security) => persist({ security })}
            onSavePassword={() => showToast('Password updated successfully')}
            onPasswordError={showToast}
            onTwoFactorChange={(enabled) =>
              showToast(enabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled')
            }
          />
        )
      case 'integrations':
        return (
          <IntegrationSettings
            integrations={integrations}
            loading={integrationsLoading}
            connectingProvider={connectingProvider}
            onConnect={handleConnect}
            onManage={setManageIntegration}
          />
        )
      case 'preferences':
        return (
          <HiringPreferences
            hiringPrefs={settings.hiringPrefs}
            onChange={(hiringPrefs) => persist({ hiringPrefs })}
            onSave={() => showToast('Hiring preferences saved')}
          />
        )
      default:
        return null
    }
  }

  const activeIntegration =
    manageIntegration &&
    integrations.find((item) => item.provider === manageIntegration.provider)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-[#8b8ca8]">
          Manage your recruiter profile, team, security, and hiring preferences
        </p>
      </div>

      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {renderTab()}

      {activeIntegration && (
        <IntegrationManageModal
          integration={activeIntegration}
          onClose={() => {
            setManageIntegration(null)
            setSyncSettingsIntegration(null)
          }}
          onDisconnect={handleDisconnect}
          disconnecting={disconnecting}
          onOpenSyncSettings={() => setSyncSettingsIntegration(activeIntegration)}
          onAction={handleIntegrationAction}
          testingConnection={testingConnection}
        />
      )}

      {syncSettingsIntegration && (
        <IntegrationSyncSettingsModal
          integration={syncSettingsIntegration}
          onClose={() => setSyncSettingsIntegration(null)}
          onSaved={(name) => showToast(`${name} sync settings updated successfully`)}
          onSaveError={() => showToast('Failed to update sync settings')}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl border border-violet-500/30 bg-[#161722] px-4 py-2.5 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
