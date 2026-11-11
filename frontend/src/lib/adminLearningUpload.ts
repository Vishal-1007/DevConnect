import { apiUrl } from '../config'

export function uploadAdminLearningResource(
  payload: {
    title: string
    description?: string
    categoryId: string
    tags?: string
    difficulty: string
    visibility: string
    file: File
    thumbnail?: File | null
  },
  accessToken: string,
  onProgress?: (percent: number) => void,
): Promise<unknown> {
  return uploadMultipart('/api/mentors/admin/learning-resources', payload, accessToken, onProgress, 'file')
}

export function uploadAdminLearningVideo(
  payload: {
    title: string
    description?: string
    categoryId: string
    tags?: string
    durationSeconds: number
    visibility: string
    video: File
    thumbnail?: File | null
  },
  accessToken: string,
  onProgress?: (percent: number) => void,
): Promise<unknown> {
  const formData = new FormData()
  formData.append('title', payload.title)
  if (payload.description) formData.append('description', payload.description)
  formData.append('categoryId', payload.categoryId)
  if (payload.tags) formData.append('tags', payload.tags)
  formData.append('durationSeconds', String(payload.durationSeconds))
  formData.append('visibility', payload.visibility)
  formData.append('video', payload.video)
  if (payload.thumbnail) formData.append('thumbnail', payload.thumbnail)
  return xhrUpload(apiUrl('/api/mentors/admin/learning-videos'), formData, accessToken, onProgress)
}

function uploadMultipart(
  path: string,
  payload: Record<string, unknown> & { file: File; thumbnail?: File | null },
  accessToken: string,
  onProgress: ((percent: number) => void) | undefined,
  fileField: string,
) {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'file' || key === 'thumbnail') return
    if (value != null) formData.append(key, String(value))
  })
  formData.append(fileField, payload.file)
  if (payload.thumbnail) formData.append('thumbnail', payload.thumbnail)
  return xhrUpload(apiUrl(path), formData, accessToken, onProgress)
}

function xhrUpload(
  url: string,
  formData: FormData,
  accessToken: string,
  onProgress?: (percent: number) => void,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)) } catch { resolve(null) }
        return
      }
      reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(formData)
  })
}

export function resolveMediaUrl(url: string | null | undefined, accessToken?: string | null): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const resolved = apiUrl(url.startsWith('/') ? url : `/${url}`)
  if (!accessToken || !resolved.includes('/api/videos/')) return resolved
  const separator = resolved.includes('?') ? '&' : '?'
  return `${resolved}${separator}token=${encodeURIComponent(accessToken)}`
}
