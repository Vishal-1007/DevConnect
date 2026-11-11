export type RecruiterIntegrationProvider =
  | 'GOOGLE_CALENDAR'
  | 'ZOOM'
  | 'MICROSOFT_TEAMS'

export type RecruiterIntegrationStatus = {
  provider: RecruiterIntegrationProvider
  connected: boolean
  connectedEmail?: string | null
  connectedAt?: string | null
  lastSyncAt?: string | null
}

export type IntegrationCatalogItem = {
  provider: RecruiterIntegrationProvider
  name: string
  description: string
  icon: string
}

export type RecruiterIntegrationView = IntegrationCatalogItem & {
  connected: boolean
  connectedEmail?: string | null
  connectedAt?: string | null
  lastSyncAt?: string | null
}
