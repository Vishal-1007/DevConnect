import { apiUrl } from '../config'

const MAX_VIDEO_BYTES = 500 * 1024 * 1024
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov']

export function validateVideoFile(file: File): string | null {
  if (!file) return 'Video file is required'
  if (file.size > MAX_VIDEO_BYTES) return 'Video must be 500MB or smaller'
  const lower = file.name.toLowerCase()
  const extOk = ALLOWED_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext))
  const typeOk = ALLOWED_VIDEO_TYPES.includes(file.type)
  if (!extOk && !typeOk) return 'Supported formats: MP4, WEBM, MOV'
  return null
}

export function resolveStreamVideoSrc(videoUrl: string | null | undefined, accessToken?: string | null): string | undefined {
  if (!videoUrl) return undefined
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl
  }
  const url = apiUrl(videoUrl.startsWith('/') ? videoUrl : `/${videoUrl}`)
  if (!accessToken) return url
  if (url.includes('/api/videos/') || url.includes('/api/mentors/learning/resources/')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}token=${encodeURIComponent(accessToken)}`
  }
  return url
}

export function uploadStreamLesson(
  courseId: string,
  sectionId: string,
  payload: {
    title: string
    description?: string
    durationSeconds: number
    sortOrder: number
    previewFree: boolean
    video: File
    thumbnail?: File | null
  },
  accessToken: string,
  onProgress?: (percent: number) => void,
  workspace: 'mentor' | 'admin' = 'mentor',
): Promise<unknown> {
  const base = workspace === 'admin'
    ? `/api/mentors/admin/streams/courses/${courseId}/sections/${sectionId}/lessons`
    : `/api/mentors/me/workspace/streams/courses/${courseId}/sections/${sectionId}/lessons`
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('title', payload.title)
    if (payload.description) formData.append('description', payload.description)
    formData.append('durationSeconds', String(payload.durationSeconds))
    formData.append('sortOrder', String(payload.sortOrder))
    formData.append('previewFree', String(payload.previewFree))
    formData.append('video', payload.video)
    if (payload.thumbnail) formData.append('thumbnail', payload.thumbnail)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', apiUrl(base))
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          resolve(null)
        }
        return
      }
      reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(formData)
  })
}
