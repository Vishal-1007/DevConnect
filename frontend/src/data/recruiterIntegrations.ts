import type { IntegrationCatalogItem } from '../types/recruiterIntegration'

export const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  {
    provider: 'GOOGLE_CALENDAR',
    name: 'Google Calendar',
    description: 'Automatically create interview events and send invites to candidates',
    icon: 'GC',
  },
  {
    provider: 'ZOOM',
    name: 'Zoom',
    description: 'Generate video interview meeting links when scheduling interviews',
    icon: 'ZM',
  },
  {
    provider: 'MICROSOFT_TEAMS',
    name: 'Microsoft Teams',
    description: 'Create Teams meeting links for scheduled interviews',
    icon: 'MT',
  },
]

export function mergeIntegrationCatalog(
  statuses: Array<{
    provider: string
    connected: boolean
    connectedEmail?: string | null
    connectedAt?: string | null
    lastSyncAt?: string | null
  }>,
) {
  const statusByProvider = new Map(statuses.map((s) => [s.provider, s]))

  return INTEGRATION_CATALOG.map((item) => {
    const status = statusByProvider.get(item.provider)
    return {
      ...item,
      connected: status?.connected ?? false,
      connectedEmail: status?.connectedEmail ?? null,
      connectedAt: status?.connectedAt ?? null,
      lastSyncAt: status?.lastSyncAt ?? null,
    }
  })
}
