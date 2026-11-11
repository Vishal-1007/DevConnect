import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

interface ApiErrorBody {
  message?: string
  error?: string
  status?: number
}

export function getApiErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong'

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const fetchError = error as FetchBaseQueryError

    if (fetchError.status === 'FETCH_ERROR') {
      return (
        'Cannot reach the API server. Start PostgreSQL, then run auth-service (port 8081) ' +
        'and gateway-service (port 8080). See README — Quick start.'
      )
    }

    if (fetchError.status === 'PARSING_ERROR') {
      return 'Invalid response from server. Is the gateway running on port 8080?'
    }

    if (typeof fetchError.status === 'number') {
      const data = fetchError.data as ApiErrorBody | string | undefined
      if (data && typeof data === 'object' && data.message) {
        return data.message
      }
      if (typeof data === 'string' && data.length > 0) {
        return data
      }
      if (fetchError.status === 409) return 'Username or email already in use'
      if (fetchError.status === 400) return 'Invalid input — check username (3+ chars) and password (8+ chars)'
      if (fetchError.status === 502 || fetchError.status === 503) {
        return 'Gateway cannot reach auth-service. Start auth-service on port 8081.'
      }
      if (fetchError.status >= 500) {
        return 'Server error — is PostgreSQL running? Check auth-service logs.'
      }
    }
  }

  return 'Could not create account. Check that backend services are running.'
}
