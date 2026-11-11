import type {
  RecruiterIntegrationProvider,
  RecruiterIntegrationStatus,
} from '../types/recruiterIntegration'
import { INTEGRATION_CATALOG } from '../data/recruiterIntegrations'
import { clearLocalIntegrationSyncSettings } from './recruiterIntegrationSyncStore'

const STORAGE_KEY = 'devconnect-recruiter-integrations'

function defaultStatuses(): RecruiterIntegrationStatus[] {
  return INTEGRATION_CATALOG.map((item) => ({
    provider: item.provider,
    connected: false,
    connectedEmail: null,
    connectedAt: null,
    lastSyncAt: null,
  }))
}

export function loadLocalIntegrationStatuses(): RecruiterIntegrationStatus[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultStatuses()
    const parsed = JSON.parse(raw) as RecruiterIntegrationStatus[]
    const byProvider = new Map(parsed.map((item) => [item.provider, item]))
    return defaultStatuses().map((item) => byProvider.get(item.provider) ?? item)
  } catch {
    return defaultStatuses()
  }
}

function saveLocalIntegrationStatuses(statuses: RecruiterIntegrationStatus[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses))
}

export function saveIntegrationStatuses(statuses: RecruiterIntegrationStatus[]) {
  saveLocalIntegrationStatuses(statuses)
}

export function disconnectLocalIntegration(provider: RecruiterIntegrationProvider) {
  const statuses = loadLocalIntegrationStatuses().map((item) =>
    item.provider === provider
      ? {
          ...item,
          connected: false,
          connectedEmail: null,
          connectedAt: null,
          lastSyncAt: null,
        }
      : item,
  )
  saveLocalIntegrationStatuses(statuses)
  clearLocalIntegrationSyncSettings(provider)
}

export function isIntegrationConnected(provider: RecruiterIntegrationProvider) {
  return loadLocalIntegrationStatuses().some(
    (item) => item.provider === provider && item.connected,
  )
}
