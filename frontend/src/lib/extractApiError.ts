export function extractApiError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>

    if ('status' in e) {
      const status = e.status

      if (status === 'FETCH_ERROR') {
        return 'Cannot reach the server. Make sure all backend services are running (gateway: 8080, chat: 8083, matching: 8085).'
      }
      if (status === 401) return 'Session expired. Please log out and sign in again.'
      if (status === 403) return 'You do not have permission to perform this action.'
      if (status === 404) {
        if ('data' in e) {
          const data = e.data
          if (typeof data === 'string' && data.trim()) return data.trim()
          if (data && typeof data === 'object') {
            const d = data as Record<string, unknown>
            if (typeof d.message === 'string' && d.message) return d.message
          }
        }
        return 'The requested resource was not found.'
      }
      if (status === 409) return 'A conflict occurred. Please refresh the page and try again.'
      if (status === 503 || status === 502) {
        return 'A backend service is unavailable. Please make sure chat-service (8083) and matching-service (8085) are running, then try again.'
      }
      if (status === 'PARSING_ERROR') {
        const detail =
          typeof (e as { error?: unknown }).error === 'string'
            ? (e as { error: string }).error
            : ''
        return detail
          ? `Server returned an invalid response (${detail}).`
          : 'Server returned an invalid response. Try logging out and back in.'
      }

      // Extract message from response body first, then fall back to status code
      if ('data' in e) {
        const data = e.data
        if (typeof data === 'string' && data.trim()) return data.trim()
        if (data && typeof data === 'object') {
          const d = data as Record<string, unknown>
          if (typeof d.message === 'string' && d.message) return d.message
          if (typeof d.error === 'string' && d.error) return d.error
        }
      }

      if (typeof status === 'number') {
        return `Request failed with status ${status}. Please try again.`
      }
    }

    // No status field — check data directly
    if ('data' in e) {
      const data = e.data
      if (typeof data === 'string' && data.trim()) return data.trim()
      if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>
        if (typeof d.message === 'string' && d.message) return d.message
      }
    }
  }

  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
