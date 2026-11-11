import { apiUrl } from '../config'

export function resolveResourcePreviewUrl(
  previewUrl: string | null | undefined,
  accessToken?: string | null,
): string | undefined {
  if (!previewUrl) return undefined
  if (previewUrl.startsWith('http://') || previewUrl.startsWith('https://')) {
    return previewUrl
  }
  const url = apiUrl(previewUrl.startsWith('/') ? previewUrl : `/${previewUrl}`)
  if (previewUrl.startsWith('/uploads/')) {
    return url
  }
  if (!accessToken) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}token=${encodeURIComponent(accessToken)}`
}

export function resolveResourceDownloadUrl(downloadUrl: string | null | undefined): string | undefined {
  if (!downloadUrl) return undefined
  return apiUrl(downloadUrl.startsWith('/') ? downloadUrl : `/${downloadUrl}`)
}

export function resolveResourcePreviewApiUrl(resourceId: string): string {
  return apiUrl(`/api/mentors/learning/resources/${resourceId}/preview`)
}

export function resolveResourceDownloadApiUrl(resourceId: string): string {
  return apiUrl(`/api/mentors/learning/resources/${resourceId}/download`)
}

export type PdfDocumentSource = {
  url: string
  withAuth: boolean
}

/** Preferred PDF sources — preview (inline, no count) before static, download last. */
export function resolvePdfDocumentSources(
  resourceId: string,
  previewUrl?: string | null,
): PdfDocumentSource[] {
  const sources: PdfDocumentSource[] = [
    { url: resolveResourcePreviewApiUrl(resourceId), withAuth: true },
  ]
  const staticUrl = previewUrl ? resolveResourcePreviewUrl(previewUrl, null) : undefined
  if (staticUrl) {
    sources.push({ url: staticUrl, withAuth: false })
  }
  sources.push({ url: resolveResourceDownloadApiUrl(resourceId), withAuth: true })
  return sources
}

async function fetchPdfBytes(url: string, accessToken?: string | null): Promise<Uint8Array> {
  const headers: HeadersInit = {}
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  const response = await fetch(url, { headers, credentials: 'same-origin' })
  if (!response.ok) {
    throw new Error(`Failed to load PDF (${response.status})`)
  }
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength === 0) {
    throw new Error('Empty PDF response')
  }
  return new Uint8Array(buffer)
}

export async function loadResourcePdfBytes(
  resourceId: string,
  accessToken: string | null | undefined,
  previewUrl?: string | null,
): Promise<Uint8Array> {
  const sources = resolvePdfDocumentSources(resourceId, previewUrl)
  let lastError: Error | null = null

  for (const source of sources) {
    if (source.withAuth && !accessToken) continue
    try {
      return await fetchPdfBytes(source.url, source.withAuth ? accessToken : undefined)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn('[loadResourcePdfBytes] attempt failed:', source.url, lastError.message)
    }
  }

  throw lastError ?? new Error('Could not load PDF from any source')
}

export async function downloadResourceFile(
  downloadUrl: string,
  accessToken: string,
  filename: string,
): Promise<void> {
  const bytes = await fetchPdfBytes(downloadUrl, accessToken)
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(objectUrl)
}
