import { apiUrl } from '../config'

export function resolveCommunityMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return apiUrl(url.startsWith('/') ? url : `/${url}`)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export async function downloadCommunityFile(
  downloadUrl: string,
  accessToken: string,
  filename: string,
): Promise<void> {
  const url = resolveCommunityMediaUrl(downloadUrl)
  if (!url) return
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'same-origin',
  })
  if (!response.ok) throw new Error('Download failed')
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(objectUrl)
}
