import type { RecruiterIntegrationProvider } from '../types/recruiterIntegration'
import {
  defaultSyncSettingsForProvider,
  type IntegrationSyncSettingsResponse,
} from '../types/integrationSyncSettings'

const STORAGE_KEY = 'devconnect-recruiter-integration-sync-settings'

type SyncSettingsStore = Partial<
  Record<RecruiterIntegrationProvider, Record<string, unknown>>
>

function readStore(): SyncSettingsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SyncSettingsStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: SyncSettingsStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function loadLocalIntegrationSyncSettings(
  provider: RecruiterIntegrationProvider,
): Record<string, unknown> {
  const store = readStore()
  return {
    ...defaultSyncSettingsForProvider(provider),
    ...(store[provider] ?? {}),
  }
}

export function saveLocalIntegrationSyncSettings(
  provider: RecruiterIntegrationProvider,
  settings: Record<string, unknown>,
): IntegrationSyncSettingsResponse {
  const store = readStore()
  store[provider] = settings
  writeStore(store)
  return { provider, settings }
}

export function clearLocalIntegrationSyncSettings(provider: RecruiterIntegrationProvider) {
  const store = readStore()
  delete store[provider]
  writeStore(store)
}
